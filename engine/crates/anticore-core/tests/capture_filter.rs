#![cfg(windows)]

use anticore_core::{dispatch::capture_filter, strategy::Step};
use std::{ffi::{c_void, CString}, os::windows::ffi::OsStrExt, path::Path};

#[link(name = "kernel32")]
extern "system" {
    fn LoadLibraryW(name: *const u16) -> *mut c_void;
    fn GetProcAddress(module: *mut c_void, name: *const u8) -> *mut c_void;
    fn FreeLibrary(module: *mut c_void) -> i32;
}

struct Library(*mut c_void);
impl Drop for Library {
    fn drop(&mut self) { unsafe { FreeLibrary(self.0); } }
}

#[repr(C, align(8))]
struct Address([u8; 80]);

fn packet(payload: &[u8], ipv6: bool) -> Vec<u8> {
    let ip_len = if ipv6 { 40 } else { 20 };
    let mut packet = vec![0u8; ip_len + 20 + payload.len()];
    if ipv6 {
        packet[0] = 0x60;
        packet[4..6].copy_from_slice(&((20 + payload.len()) as u16).to_be_bytes());
        packet[6] = 6;
        packet[7] = 64;
    } else {
        packet[0] = 0x45;
        let len = packet.len() as u16;
        packet[2..4].copy_from_slice(&len.to_be_bytes());
        packet[8] = 64;
        packet[9] = 6;
    }
    packet[ip_len..ip_len + 2].copy_from_slice(&50000u16.to_be_bytes());
    packet[ip_len + 2..ip_len + 4].copy_from_slice(&443u16.to_be_bytes());
    packet[ip_len + 12] = 0x50;
    packet[ip_len + 13] = 0x10;
    packet[ip_len + 20..].copy_from_slice(payload);
    packet
}

#[test]
fn real_windivert_evaluator_preserves_candidates_and_excludes_bulk() {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../WinDivert.dll");
    let wide: Vec<_> = path.as_os_str().encode_wide().chain(Some(0)).collect();
    let lib = Library(unsafe { LoadLibraryW(wide.as_ptr()) });
    assert!(!lib.0.is_null(), "WinDivert.dll required: {}", path.display());
    type Eval = unsafe extern "system" fn(*const u8, *const u8, u32, *const Address) -> i32;
    let symbol = unsafe { GetProcAddress(lib.0, c"WinDivertHelperEvalFilter".as_ptr().cast()) };
    assert!(!symbol.is_null());
    let eval: Eval = unsafe { std::mem::transmute(symbol) };
    for ipv6 in [false, true] {
        let mut addr = Address([0; 80]);
        // NETWORK event, outbound bit 17; IPv6 bit 20 (official 2.x header).
        let flags = (1u32 << 17) | if ipv6 { 1 << 20 } else { 0 };
        addr.0[8..12].copy_from_slice(&flags.to_le_bytes());
        let default = CString::new(capture_filter(&[])).unwrap();
        let compatibility = CString::new(capture_filter(&[Step::WindowSize { size: 1024 }])).unwrap();
        let cases = [
            (vec![], false),
            (vec![0x17; 1400], false),
            (vec![0x16], false),
            (vec![0x16, 3, 1, 0, 1, 1], true),
            (b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n".to_vec(), true),
            (b"POST / HTTP/1.1\r\nHost: example.com\r\n\r\n".to_vec(), true),
            (b"HEAD / HTTP/1.1\r\nHost: example.com\r\n\r\n".to_vec(), true),
            ([vec![0x16, 3, 1, 0, 1, 1], vec![0; 2042]].concat(), true),
            ([vec![0x16, 3, 1, 0, 1, 1], vec![0; 2043]].concat(), false),
        ];
        for (payload, expected) in cases {
            let pkt = packet(&payload, ipv6);
            let actual = unsafe { eval(default.as_ptr().cast(), pkt.as_ptr(), pkt.len() as u32, &addr) };
            assert_eq!(actual != 0, expected, "IPv6={ipv6}, length={}", payload.len());
        }
        let ack = packet(&[], ipv6);
        assert_ne!(unsafe { eval(compatibility.as_ptr().cast(), ack.as_ptr(), ack.len() as u32, &addr) }, 0);
        addr.0[8..12].copy_from_slice(&0u32.to_le_bytes());
        let hello = packet(&[0x16, 3, 1, 0, 1, 1], ipv6);
        assert_eq!(unsafe { eval(default.as_ptr().cast(), hello.as_ptr(), hello.len() as u32, &addr) }, 0);
    }
}
