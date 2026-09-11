//! macOS ham soket enjeksiyon modülü.
//!
//! Bölünmüş segmentleri ve sahte TTL'li paketleri doğrudan fiziksel ağ arabirimine basar.

#[cfg(target_os = "macos")]
use std::os::unix::io::RawFd;

#[cfg(target_os = "macos")]
pub struct RawSocket {
    fd: RawFd,
}

#[cfg(target_os = "macos")]
impl RawSocket {
    /// Ham IP soketini (IP_HDRINCL) açar.
    pub fn open() -> Result<Self, String> {
        let fd = unsafe { libc::socket(libc::AF_INET, libc::SOCK_RAW, libc::IPPROTO_RAW) };
        if fd < 0 {
            return Err(format!(
                "SOCK_RAW soketi açılamadı (root/sudo yetkisi gereklidir): {}",
                std::io::Error::last_os_error()
            ));
        }

        let one: libc::c_int = 1;
        let res = unsafe {
            libc::setsockopt(
                fd,
                libc::IPPROTO_IP,
                libc::IP_HDRINCL,
                &one as *const _ as *const libc::c_void,
                std::mem::size_of_val(&one) as libc::socklen_t,
            )
        };
        if res < 0 {
            unsafe { libc::close(fd); }
            return Err("IP_HDRINCL setsockopt başarısız".into());
        }

        Ok(Self { fd })
    }

    /// Ham IP paketini hedefe gönderir.
    pub fn send(&self, raw_packet: &[u8]) -> Result<(), String> {
        if raw_packet.len() < 20 {
            return Err("Geçersiz paket boyutu (en az 20 bayt IP başlığı gereklidir)".into());
        }

        // Hedef IP IPv4 başlığının 16-19. baytlarındadır
        let dest_ip = [raw_packet[16], raw_packet[17], raw_packet[18], raw_packet[19]];
        let mut dest: libc::sockaddr_in = unsafe { std::mem::zeroed() };
        dest.sin_family = libc::AF_INET as libc::sa_family_t;
        dest.sin_addr.s_addr = u32::from_ne_bytes(dest_ip);

        let sent = unsafe {
            libc::sendto(
                self.fd,
                raw_packet.as_ptr() as *const libc::c_void,
                raw_packet.len(),
                0,
                &dest as *const _ as *const libc::sockaddr,
                std::mem::size_of_val(&dest) as libc::socklen_t,
            )
        };

        if sent >= 0 {
            Ok(())
        } else {
            Err(format!("sendto başarısız: {}", std::io::Error::last_os_error()))
        }
    }
}

#[cfg(target_os = "macos")]
impl Drop for RawSocket {
    fn drop(&mut self) {
        unsafe {
            libc::close(self.fd);
        }
    }
}
