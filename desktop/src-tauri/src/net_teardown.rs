//! Windows ag oturumlarini ve DNS onbellegini temizleme mekanizmasi.
//!
//! Motor durduruldugunda tarayicilarin ve istemcilerin (Chrome, Discord, Roblox vb.)
//! Keep-Alive / HTTP/2 uzerinden acik tuttugu kalici TLS baglantilarini aninda
//! sonlandirarak (TCP RST/delete TCB) yeni isteklerin ISP filtresine takilmasini
//! ve motor kapatma isleminin aninda gecerli olmasini saglar.

#[cfg(windows)]
#[repr(C)]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct MibTcpRow {
    pub dw_state: u32,
    pub dw_local_addr: u32,
    pub dw_local_port: u32,
    pub dw_remote_addr: u32,
    pub dw_remote_port: u32,
}

#[cfg(windows)]
#[link(name = "iphlpapi")]
extern "system" {
    fn GetTcpTable(pTcpTable: *mut u8, pdwSize: *mut u32, bOrder: i32) -> u32;
    fn SetTcpEntry(pTcpRow: *const MibTcpRow) -> u32;
}

#[cfg(windows)]
#[link(name = "dnsapi")]
extern "system" {
    fn DnsFlushResolverCache() -> i32;
}

#[cfg(windows)]
pub const MIB_TCP_STATE_DELETE_TCB: u32 = 12;

/// Aktif HTTP/HTTPS (port 80 ve 443) baglantilarini sonlandirir ve soket havuzunu bosaltir.
#[cfg(windows)]
pub fn reset_http_connections() -> usize {
    let mut size = 0u32;
    // Ilk cagri gereken arabellek boyutunu dondurur
    unsafe {
        let _ = GetTcpTable(std::ptr::null_mut(), &mut size, 0);
    }
    if size == 0 {
        return 0;
    }

    let mut buffer = vec![0u8; size as usize];
    let ret = unsafe { GetTcpTable(buffer.as_mut_ptr(), &mut size, 0) };
    if ret != 0 || buffer.len() < 4 {
        return 0;
    }

    let num_entries = u32::from_ne_bytes(buffer[0..4].try_into().unwrap()) as usize;
    let row_size = std::mem::size_of::<MibTcpRow>();
    let mut closed_count = 0;

    for i in 0..num_entries {
        let offset = 4 + i * row_size;
        if offset + row_size > buffer.len() {
            break;
        }
        let row_ptr = buffer[offset..].as_ptr() as *const MibTcpRow;
        let mut row = unsafe { *row_ptr };

        // dw_remote_port network byte order'dadir (Big Endian)
        let remote_port = u16::from_be((row.dw_remote_port & 0xFFFF) as u16);

        // Web portlari (80, 443, 8080, 8443)
        if remote_port == 80 || remote_port == 443 || remote_port == 8080 || remote_port == 8443 {
            // Sadece aktif / dinleme harici baglantilar
            if row.dw_state != 2 /* LISTEN */ && row.dw_state != 1 /* CLOSED */ {
                row.dw_state = MIB_TCP_STATE_DELETE_TCB;
                let set_res = unsafe { SetTcpEntry(&row) };
                if set_res == 0 {
                    closed_count += 1;
                }
            }
        }
    }

    closed_count
}

/// DNS cozumleyici onbellegini bosaltir.
#[cfg(windows)]
pub fn flush_dns_cache() {
    unsafe {
        let _ = DnsFlushResolverCache();
    }
    // Ek emniyet: ipconfig /flushdns (sessiz)
    let _ = crate::commands::silent_command("ipconfig")
        .arg("/flushdns")
        .output();
}

#[cfg(not(windows))]
pub fn reset_http_connections() -> usize {
    0
}

#[cfg(not(windows))]
pub fn flush_dns_cache() {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_row_size_and_alignment() {
        assert_eq!(std::mem::size_of::<MibTcpRow>(), 20);
    }
}
