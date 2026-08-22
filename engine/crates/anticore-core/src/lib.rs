//! Anticore-core: platform-bağımsız DPI bypass motoru.
//!
//! Trafik akışı: ham IPv4 paketi -> [`net`] ile ayrıştırılır -> [`tls`] ile
//! ClientHello/SNI tespit edilir -> [`strategy`] ile aksiyon planı üretilir.
//! Transport katmanı (WinDivert/pf/tun) bu planı uygular.

pub mod blockcheck;
pub mod compat;
pub mod config;
pub mod dispatch;
pub mod dto;
pub mod net;
pub mod profile;
pub mod strategy;
pub mod tester;
pub mod tls;

/// Yakalanan outbound paketin ayrıştırılmış görünümü.
#[derive(Debug, Clone)]
pub struct CapturedPacket {
    /// Tam IPv4 paketi (header + payload).
    pub raw: Vec<u8>,
    /// IPv4 header uzunluğu (bayt).
    pub ip_hdr_len: usize,
    /// TCP header uzunluğu (bayt).
    pub tcp_hdr_len: usize,
}

impl CapturedPacket {
    /// TCP payload dilimi (TLS/HTTP verisi).
    pub fn payload(&self) -> &[u8] {
        let start = self.ip_hdr_len + self.tcp_hdr_len;
        if start <= self.raw.len() {
            &self.raw[start..]
        } else {
            &[]
        }
    }

    /// Hedef port.
    pub fn dst_port(&self) -> u16 {
        u16::from_be_bytes([
            self.raw[self.ip_hdr_len + 2],
            self.raw[self.ip_hdr_len + 3],
        ])
    }
}
