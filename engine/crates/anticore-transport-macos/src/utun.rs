//! macOS Userspace TUN (utun) arabirim yönetimi.
//!
//! macOS çekirdeğinde yerleşik bulunan `com.apple.net.utun_control` aygıtı
//! üzerinden dinamik bir utunX arabirimi açar.

#[cfg(target_os = "macos")]
use std::os::unix::io::RawFd;

#[cfg(target_os = "macos")]
const UTUN_CONTROL_NAME: &str = "com.apple.net.utun_control";

#[cfg(target_os = "macos")]
#[repr(C)]
struct CtlInfo {
    ctl_id: u32,
    ctl_name: [u8; 96],
}

#[cfg(target_os = "macos")]
#[repr(C)]
struct SockAddrCtl {
    sc_len: u8,
    sc_family: u8,
    ss_sysaddr: u16,
    sc_id: u32,
    sc_unit: u32,
    sc_reserved: [u32; 5],
}

#[cfg(target_os = "macos")]
const CTLIOCGINFO: libc::c_ulong = 0xc0644e03; // _IOWR('N', 3, struct ctl_info)

#[cfg(target_os = "macos")]
pub struct UtunDevice {
    pub fd: RawFd,
    pub if_name: String,
}

#[cfg(target_os = "macos")]
impl UtunDevice {
    /// Yeni bir utun aygıtı oluşturur ve çekirdeğe bağlar.
    pub fn open() -> Result<Self, String> {
        let fd = unsafe { libc::socket(libc::PF_SYSTEM, libc::SOCK_DGRAM, 2 /* SYSPROTO_CONTROL */) };
        if fd < 0 {
            return Err(format!("PF_SYSTEM soketi açılamadı: {}", std::io::Error::last_os_error()));
        }

        let mut ctl_info = CtlInfo {
            ctl_id: 0,
            ctl_name: [0u8; 96],
        };
        let name_bytes = UTUN_CONTROL_NAME.as_bytes();
        ctl_info.ctl_name[..name_bytes.len()].copy_from_slice(name_bytes);

        if unsafe { libc::ioctl(fd, CTLIOCGINFO, &mut ctl_info) } < 0 {
            unsafe { libc::close(fd); }
            return Err(format!("utun CTLIOCGINFO ioctl başarısız: {}", std::io::Error::last_os_error()));
        }

        let sc = SockAddrCtl {
            sc_len: std::mem::size_of::<SockAddrCtl>() as u8,
            sc_family: libc::AF_SYSTEM as u8,
            ss_sysaddr: 2, // AF_SYS_CONTROL
            sc_id: ctl_info.ctl_id,
            sc_unit: 0, // 0 = kernel ilk boş unit'i (utun0, utun1..) tahsis eder
            sc_reserved: [0; 5],
        };

        if unsafe {
            libc::connect(
                fd,
                &sc as *const _ as *const libc::sockaddr,
                std::mem::size_of::<SockAddrCtl>() as libc::socklen_t,
            )
        } < 0
        {
            unsafe { libc::close(fd); }
            return Err(format!("utun connect başarısız: {}", std::io::Error::last_os_error()));
        }

        // Aygıt adını oku (örn. utun3)
        let mut name_buf = [0u8; 64];
        let mut name_len = name_buf.len() as libc::socklen_t;
        let if_name = if unsafe {
            libc::getsockopt(
                fd,
                2, // SYSPROTO_CONTROL
                2, // UTUN_OPT_IFNAME
                name_buf.as_mut_ptr() as *mut libc::c_void,
                &mut name_len,
            )
        } == 0
        {
            let s = std::str::from_utf8(&name_buf[..name_len.saturating_sub(1) as usize])
                .unwrap_or("utunX");
            s.to_string()
        } else {
            "utun3".to_string()
        };

        Ok(Self { fd, if_name })
    }

    /// utun'dan ham paket okur.
    /// macOS utun, paketin başına 4 baytlık adres ailesi (AF_INET = 2) başlığı ekler.
    pub fn recv(&self, buf: &mut [u8]) -> Option<usize> {
        let mut temp_buf = [0u8; 65535];
        let n = unsafe {
            libc::read(
                self.fd,
                temp_buf.as_mut_ptr() as *mut libc::c_void,
                temp_buf.len(),
            )
        };
        if n <= 4 {
            return None;
        }
        let packet_len = (n as usize) - 4;
        if buf.len() < packet_len {
            return None;
        }
        // İlk 4 baytlık utun başlığını atla, ham IP paketini hedef tampona kopyala
        buf[..packet_len].copy_from_slice(&temp_buf[4..n as usize]);
        Some(packet_len)
    }
}

#[cfg(target_os = "macos")]
impl Drop for UtunDevice {
    fn drop(&mut self) {
        unsafe {
            libc::close(self.fd);
        }
    }
}
