//! WinDivert 2.x minimal FFI (dinamik yükleme) ve paket döngüsü.

use std::ffi::c_void;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};

// ---------- WinDivert sabitleri ----------
pub const WINDIVERT_LAYER_NETWORK: i32 = 0;
pub const WINDIVERT_FLAG_NONE: u64 = 0;
pub const WINDIVERT_FLAG_DROP: u64 = 1; // eşleşen paket çekirdekte düşürülür

#[repr(C)]
#[derive(Clone, Copy)]
pub struct WindivertAddress {
    // 2.x'te union + timestamp; bizim için sadece alan boyutu önemli.
    // NETWORK kullanımında ilk alanlar yeterli, gerisi pad.
    _data: [u8; 80],
}

impl WindivertAddress {
    fn zeroed() -> Self {
        Self { _data: [0u8; 80] }
    }
}

impl Default for WindivertAddress {
    fn default() -> Self {
        Self::zeroed()
    }
}

// ---------- kernel32 (her zaman bağlı) ----------
extern "system" {
    fn LoadLibraryW(name: *const u16) -> *mut c_void;
    fn GetProcAddress(module: *mut c_void, name: *const u8) -> *mut c_void;
}

// ---------- WinDivert fonksiyon tipleri ----------
type DivertOpen = unsafe extern "system" fn(
    filter: *const u8,
    layer: i32,
    priority: i16,
    flags: u64,
) -> isize;
type DivertRecv = unsafe extern "system" fn(
    handle: isize,
    packet: *mut u8,
    len: u32,
    recv_len: *mut u32,
    addr: *mut WindivertAddress,
) -> i32;
type DivertSend = unsafe extern "system" fn(
    handle: isize,
    packet: *const u8,
    len: u32,
    send_len: *mut u32,
    addr: *const WindivertAddress,
) -> i32;
type DivertClose = unsafe extern "system" fn(handle: isize) -> i32;

/// Yüklenmiş WinDivert bağlamı.
pub struct WinDivert {
    handle: isize,
    recv: DivertRecv,
    send: DivertSend,
    close: DivertClose,
    /// `shutdown()`/`Drop` idempotent olsun diye: handle değeri OS
    /// tarafından yeniden kullanılmış olabileceğinden aynı handle'ı
    /// iki kez kapatmak yabancı bir tanıtıcıyı kapatma riski taşır.
    closed: AtomicBool,
}

unsafe impl Send for WinDivert {}

impl WinDivert {
    /// DLL'i verilen dizinden yükler ve filtreyle açar. Admin hak gerekir.
    pub fn open(filter: &str, dll_dir: Option<&Path>) -> Result<Self, String> {
        Self::open_with_flags(filter, dll_dir, WINDIVERT_FLAG_NONE)
    }

    /// Ek bayraklarla açar (ör. DROP: eşleşen paket çekirdekte düşer,
    /// recv çağrısı gerekmez — handle açık kaldığı sürece filtre etkindir).
    pub fn open_with_flags(filter: &str, dll_dir: Option<&Path>, flags: u64) -> Result<Self, String> {
        if let Some(dir) = dll_dir {
            set_dll_directory(dir)?;
        }

        let wide: Vec<u16> = std::ffi::OsStr::new("WinDivert.dll")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let lib = unsafe { LoadLibraryW(wide.as_ptr()) };
        if lib.is_null() {
            return Err("WinDivert.dll yüklenemedi. Dosya uygulama dizininde mi?".into());
        }

        let sym = |name: &str| -> Result<*mut c_void, String> {
            // GetProcAddress LPCSTR (null-sonlandırmalı) ister
            let cname = std::ffi::CString::new(name)
                .map_err(|_| format!("Geçersiz sembol adı: {name}"))?;
            match std::ptr::NonNull::new(unsafe {
                GetProcAddress(lib, cname.as_ptr().cast::<u8>())
            }) {
                Some(p) => Ok(p.as_ptr()),
                None => Err(format!("Sembol bulunamadı: {name}")),
            }
        };

        let open_fn = unsafe {
            std::mem::transmute::<*mut c_void, DivertOpen>(sym("WinDivertOpen")?)
        };
        let recv = unsafe {
            std::mem::transmute::<*mut c_void, DivertRecv>(sym("WinDivertRecv")?)
        };
        let send = unsafe {
            std::mem::transmute::<*mut c_void, DivertSend>(sym("WinDivertSend")?)
        };
        let close = unsafe {
            std::mem::transmute::<*mut c_void, DivertClose>(sym("WinDivertClose")?)
        };

        let mut fbytes = filter.as_bytes().to_vec();
        fbytes.push(0);

        let handle = unsafe { open_fn(fbytes.as_ptr(), WINDIVERT_LAYER_NETWORK, 0, flags) };
        if handle == (-1isize) || handle == 0 {
            return Err(format!(
                "WinDivertOpen başarısız (filter={filter}). Yönetici hakları gerekiyor olabilir."
            ));
        }

        Ok(Self {
            handle,
            recv,
            send,
            close,
            closed: AtomicBool::new(false),
        })
    }

    /// Bir paket yakalar. Zaman aşımı yok — çağıran thread bloklanır.
    pub fn recv(&self, buf: &mut [u8]) -> Option<(usize, WindivertAddress)> {
        let mut addr = WindivertAddress::default();
        let mut n: u32 = 0;
        let ok =
            unsafe { (self.recv)(self.handle, buf.as_mut_ptr(), buf.len() as u32, &mut n, &mut addr) };
        if ok == 0 {
            return None;
        }
        Some((n as usize, addr))
    }

    /// Paketi inject eder.
    pub fn send(&self, pkt: &[u8], addr: &WindivertAddress) -> bool {
        let mut n: u32 = 0;
        unsafe { (self.send)(self.handle, pkt.as_ptr(), pkt.len() as u32, &mut n, addr) != 0 }
    }

    /// Handle'ı kapatarak recv() döngüsünü kırar (başka thread'i unblock eder).
    /// İdempotent: birden çok kez çağrılsa (veya `Drop` ile çakışsa) bile
    /// alttaki `WinDivertClose` yalnızca bir kez çalışır.
    pub fn shutdown(&self) {
        self.close_once();
    }

    fn close_once(&self) {
        if self.closed.swap(true, Ordering::AcqRel) {
            return; // zaten kapatıldı
        }
        unsafe { (self.close)(self.handle) };
    }
}

impl Drop for WinDivert {
    fn drop(&mut self) {
        self.close_once();
    }
}

/// DLL arama yoluna geçici olarak ek klasör ekler.
fn set_dll_directory(path: &Path) -> Result<(), String> {
    extern "system" {
        fn SetDllDirectoryW(path: *const u16) -> i32;
    }
    let wide: Vec<u16> = path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let ok = unsafe { SetDllDirectoryW(wide.as_ptr()) };
    if ok == 0 {
        return Err("SetDllDirectory başarısız".into());
    }
    Ok(())
}
