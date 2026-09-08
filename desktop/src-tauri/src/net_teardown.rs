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
#[repr(C)]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct MibTcp6Row {
    pub dw_state: u32,
    pub local_addr: [u8; 16],
    pub dw_local_scope_id: u32,
    pub dw_local_port: u32,
    pub remote_addr: [u8; 16],
    pub dw_remote_scope_id: u32,
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
#[cfg(windows)]
const ERROR_INSUFFICIENT_BUFFER: u32 = 122;

/// Aktif HTTP/HTTPS (port 80, 443, 8080, 8443) IPv4 baglantilarini sonlandirir.
#[cfg(windows)]
pub fn reset_http_connections() -> usize {
    let mut closed_count = 0;

    // IPv4 TCP Tablosu (5 denemeli arabellek buyutme dongusu)
    let mut size = 0u32;
    unsafe {
        let _ = GetTcpTable(std::ptr::null_mut(), &mut size, 0);
    }
    for _ in 0..5 {
        if size == 0 {
            break;
        }
        let mut buffer = vec![0u8; size as usize];
        let ret = unsafe { GetTcpTable(buffer.as_mut_ptr(), &mut size, 0) };
        if ret == ERROR_INSUFFICIENT_BUFFER {
            continue;
        }
        if ret == 0 && buffer.len() >= 4 {
            let num_entries = u32::from_ne_bytes(buffer[0..4].try_into().unwrap()) as usize;
            let row_size = std::mem::size_of::<MibTcpRow>();
            for i in 0..num_entries {
                let offset = 4usize.saturating_add(i.saturating_mul(row_size));
                if offset.saturating_add(row_size) > buffer.len() {
                    break;
                }
                let row_ptr = buffer[offset..].as_ptr() as *const MibTcpRow;
                let mut row = unsafe { std::ptr::read_unaligned(row_ptr) };

                let remote_port = u16::from_be((row.dw_remote_port & 0xFFFF) as u16);
                if matches!(remote_port, 80 | 443 | 8080 | 8443)
                    && row.dw_state != 2 /* LISTEN */
                    && row.dw_state != 1 /* CLOSED */
                {
                    row.dw_state = MIB_TCP_STATE_DELETE_TCB;
                    if unsafe { SetTcpEntry(&row) } == 0 {
                        closed_count += 1;
                    }
                }
            }
            break;
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
