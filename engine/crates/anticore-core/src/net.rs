//! IPv4/TCP header ayrıştırma, checksum hesabı ve segment üretimi.
//!
//! Sadece stdlib: motorun çekirdeği bağımlılıksız ve taşınabilir kalmalı.

use std::sync::atomic::{AtomicU16, Ordering};

pub const PROTO_TCP: u8 = 6;

/// Süreç ömrü boyunca artan sayaç: her üretilen segmente (gerçek parça VEYA
/// sahte paket) kendine özgü bir IP ID verir. Orijinal paketin ID'sini
/// olduğu gibi kopyalamak, TEK pakete bölünen tüm segmentleri (ve önüne
/// eklenen sahte paketleri) aynı ID ile işaretlerdi — bu, gözlemleyen bir
/// DPI/analiz aracına "bunlar tek kaynaktan üretildi" sinyali verir.
static NEXT_IP_ID: AtomicU16 = AtomicU16::new(0);

fn fresh_ip_id() -> u16 {
    NEXT_IP_ID.fetch_add(1, Ordering::Relaxed)
}

/// Internet checksum (RFC 1071).
pub fn internet_checksum(data: &[u8]) -> u16 {
    let mut sum: u32 = 0;
    let mut i = 0;
    while i + 1 < data.len() {
        sum += u16::from_be_bytes([data[i], data[i + 1]]) as u32;
        i += 2;
    }
    if i < data.len() {
        sum += (data[i] as u32) << 8;
    }
    while sum >> 16 != 0 {
        sum = (sum & 0xFFFF) + (sum >> 16);
    }
    !(sum as u16)
}

/// TCP pseudo-header dahil IPv4 segment checksum'u hesaplar.
///
/// ÖN KOŞUL: `tcp_seg` içindeki checksum alanı (offset 16..18) sıfır olmalı.
fn tcp_checksum(ip_hdr: &[u8], tcp_seg: &[u8]) -> u16 {
    let src = &ip_hdr[12..16];
    let dst = &ip_hdr[16..20];

    let mut buf = Vec::with_capacity(12 + tcp_seg.len());
    buf.extend_from_slice(src);
    buf.extend_from_slice(dst);
    buf.push(0);
    buf.push(PROTO_TCP);
    buf.extend_from_slice(&(tcp_seg.len() as u16).to_be_bytes());
    buf.extend_from_slice(tcp_seg);

    internet_checksum(&buf)
}

/// TCP pseudo-header dahil IPv6 segment checksum'u hesaplar (RFC 8200).
fn tcp_checksum_v6(ip_hdr: &[u8], tcp_seg: &[u8]) -> u16 {
    let src = &ip_hdr[8..24];
    let dst = &ip_hdr[24..40];

    let mut buf = Vec::with_capacity(40 + tcp_seg.len());
    buf.extend_from_slice(src);
    buf.extend_from_slice(dst);
    buf.extend_from_slice(&(tcp_seg.len() as u32).to_be_bytes());
    buf.extend_from_slice(&[0, 0, 0, PROTO_TCP]);
    buf.extend_from_slice(tcp_seg);

    internet_checksum(&buf)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IpVersion {
    V4,
    V6,
}

/// Ayrıştırılmış IPv4 / IPv6 + TCP görünümü (sahipliksiz; ham paket üzerinden okur).
#[derive(Debug)]
pub struct PacketView<'a> {
    pub raw: &'a [u8],
    pub version: IpVersion,
    pub ip_hdr_len: usize,
    pub tcp_hdr_len: usize,
}

impl<'a> PacketView<'a> {
    /// Ham IPv4 / IPv6 paketini doğrulayarak ayrıştırır. Geçersizse None.
    pub fn parse(raw: &'a [u8]) -> Option<Self> {
        if raw.len() < 20 {
            return None;
        }
        let ver_nibble = raw[0] >> 4;
        match ver_nibble {
            4 => {
                let ip_hdr_len = ((raw[0] & 0x0F) as usize) * 4;
                if ip_hdr_len < 20 || raw.len() < ip_hdr_len {
                    return None;
                }
                if raw[9] != PROTO_TCP {
                    return None;
                }
                let total_len = u16::from_be_bytes([raw[2], raw[3]]) as usize;
                let effective_end = total_len.min(raw.len());
                if effective_end <= ip_hdr_len {
                    return None;
                }

                let tcp = &raw[ip_hdr_len..effective_end];
                if tcp.len() < 20 {
                    return None;
                }
                let tcp_hdr_len = ((tcp[12] >> 4) as usize) * 4;
                if tcp_hdr_len < 20 || tcp.len() < tcp_hdr_len {
                    return None;
                }

                Some(Self {
                    raw,
                    version: IpVersion::V4,
                    ip_hdr_len,
                    tcp_hdr_len,
                })
            }
            6 => {
                if raw.len() < 40 {
                    return None;
                }
                let ip_hdr_len = 40usize;
                if raw[6] != PROTO_TCP {
                    return None;
                }
                let payload_len = u16::from_be_bytes([raw[4], raw[5]]) as usize;
                let effective_end = (ip_hdr_len + payload_len).min(raw.len());
                if effective_end <= ip_hdr_len {
                    return None;
                }

                let tcp = &raw[ip_hdr_len..effective_end];
                if tcp.len() < 20 {
                    return None;
                }
                let tcp_hdr_len = ((tcp[12] >> 4) as usize) * 4;
                if tcp_hdr_len < 20 || tcp.len() < tcp_hdr_len {
                    return None;
                }

                Some(Self {
                    raw,
                    version: IpVersion::V6,
                    ip_hdr_len,
                    tcp_hdr_len,
                })
            }
            _ => None,
        }
    }

    pub fn src_port(&self) -> u16 {
        u16::from_be_bytes([self.raw[self.ip_hdr_len], self.raw[self.ip_hdr_len + 1]])
    }

    pub fn dst_port(&self) -> u16 {
        u16::from_be_bytes([self.raw[self.ip_hdr_len + 2], self.raw[self.ip_hdr_len + 3]])
    }

    pub fn seq(&self) -> u32 {
        let o = self.ip_hdr_len + 4;
        u32::from_be_bytes([
            self.raw[o],
            self.raw[o + 1],
            self.raw[o + 2],
            self.raw[o + 3],
        ])
    }

    pub fn flags(&self) -> u8 {
        self.raw[self.ip_hdr_len + 13]
    }

    pub fn window(&self) -> u16 {
        let o = self.ip_hdr_len + 14;
        u16::from_be_bytes([self.raw[o], self.raw[o + 1]])
    }

    pub fn ttl(&self) -> u8 {
        match self.version {
            IpVersion::V4 => self.raw[8],
            IpVersion::V6 => self.raw[7], // Hop Limit
        }
    }

    /// IPv4 başlığındaki Identification alanı (fragment/segment kimliği).
    pub fn ip_id(&self) -> u16 {
        match self.version {
            IpVersion::V4 => u16::from_be_bytes([self.raw[4], self.raw[5]]),
            IpVersion::V6 => 0,
        }
    }

    /// IP payload'inin (TCP başlığı + veri) toplam uzunluğu.
    fn tcp_total_len(&self) -> usize {
        match self.version {
            IpVersion::V4 => {
                let total_len = u16::from_be_bytes([self.raw[2], self.raw[3]]) as usize;
                total_len.min(self.raw.len()).saturating_sub(self.ip_hdr_len)
            }
            IpVersion::V6 => {
                let payload_len = raw_payload_len_u16(self.raw);
                payload_len.min(self.raw.len().saturating_sub(self.ip_hdr_len))
            }
        }
    }

    pub fn payload(&self) -> &[u8] {
        let start = self.ip_hdr_len + self.tcp_hdr_len;
        let end = self.ip_hdr_len + self.tcp_total_len();
        &self.raw[start..end.max(start)]
    }
}

fn raw_payload_len_u16(raw: &[u8]) -> usize {
    u16::from_be_bytes([raw[4], raw[5]]) as usize
}

/// Yeni bir IPv4/IPv6 + TCP segmenti üretir (checksum'lar taze).
///
/// `payload` boş olabilir; `ttl_override` ile sahte düşük-TTL kopyalar,
/// `ack_override` ile sıra yanıltma kopyaları üretilir.
pub fn build_tcp_segment(
    view: &PacketView,
    new_seq: u32,
    new_payload: &[u8],
    ttl_override: Option<u8>,
    ack_override: Option<u32>,
    corrupt_checksum: bool,
    urg_override: Option<u16>,
    window_size_override: Option<u16>,
) -> Vec<u8> {
    let tcp_total = view.tcp_hdr_len + new_payload.len();
    let ip_total = view.ip_hdr_len + tcp_total;

    let mut out = Vec::with_capacity(ip_total);

    // --- IP Header ---
    out.extend_from_slice(&view.raw[..view.ip_hdr_len]);
    match view.version {
        IpVersion::V4 => {
            out[2..4].copy_from_slice(&(ip_total as u16).to_be_bytes());
            out[4..6].copy_from_slice(&fresh_ip_id().to_be_bytes());
            if let Some(ttl) = ttl_override {
                out[8] = ttl;
            }
        }
        IpVersion::V6 => {
            out[4..6].copy_from_slice(&(tcp_total as u16).to_be_bytes());
            if let Some(hop_limit) = ttl_override {
                out[7] = hop_limit;
            }
        }
    }

    // --- TCP header + payload ---
    let mut seg = vec![0u8; tcp_total];
    seg[..view.tcp_hdr_len].copy_from_slice(&view.raw[view.ip_hdr_len..view.ip_hdr_len + view.tcp_hdr_len]);
    seg[4..8].copy_from_slice(&new_seq.to_be_bytes());
    if let Some(ack) = ack_override {
        seg[8..12].copy_from_slice(&ack.to_be_bytes());
    }
    if let Some(window) = window_size_override {
        seg[14..16].copy_from_slice(&window.to_be_bytes());
    }
    if let Some(urg_ptr) = urg_override {
        seg[13] |= 0x20; // Set URG flag
        seg[18..20].copy_from_slice(&urg_ptr.to_be_bytes());
    }
    seg[view.tcp_hdr_len..].copy_from_slice(new_payload);

    // Checksum'u sıfırla ve yeniden hesapla (TCP header + payload)
    seg[16..18].copy_from_slice(&[0, 0]);
    let pseudo_ip = &out[..view.ip_hdr_len];
    let mut csum = match view.version {
        IpVersion::V4 => tcp_checksum(pseudo_ip, &seg),
        IpVersion::V6 => tcp_checksum_v6(pseudo_ip, &seg),
    };
    if corrupt_checksum {
        csum ^= 0xFFFF;
    }
    seg[16..18].copy_from_slice(&csum.to_be_bytes());

    out.extend_from_slice(&seg);

    if view.version == IpVersion::V4 {
        // IPv4 header checksum'unu yenile
        out[10..12].copy_from_slice(&[0, 0]);
        let ip_csum = internet_checksum(&out[..view.ip_hdr_len]);
        out[10..12].copy_from_slice(&ip_csum.to_be_bytes());
    }

    out
}

/// Orijinal paketi checksum'larıyla yeniden imzalar (transport'a saf geçiş için).
pub fn recompute_all_checksums(view: &PacketView) -> Vec<u8> {
    build_tcp_segment(view, view.seq(), view.payload(), None, None, false, None, None)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Sentetik bir IPv4+TCP SYN-ACK sonrası veri paketi kurar.
    fn synthetic_data_packet(payload: &[u8]) -> Vec<u8> {
        let ip_hdr_len = 20usize;
        let tcp_hdr_len = 20usize;
        let total = ip_hdr_len + tcp_hdr_len + payload.len();
        let mut p = vec![0u8; total];

        p[0] = 0x45;
        p[1] = 0x00;
        p[2..4].copy_from_slice(&(total as u16).to_be_bytes());
        p[4..6].copy_from_slice(&0x1234u16.to_be_bytes());
        p[6..8].copy_from_slice(&0x4000u16.to_be_bytes()); // DF
        p[8] = 64;
        p[9] = 6;
        p[12..16].copy_from_slice(&[192, 168, 1, 10]);
        p[16..20].copy_from_slice(&[1, 2, 3, 4]);

        let t = ip_hdr_len;
        p[t..t + 2].copy_from_slice(&54321u16.to_be_bytes());
        p[t + 2..t + 4].copy_from_slice(&443u16.to_be_bytes());
        p[t + 4..t + 8].copy_from_slice(&7777u32.to_be_bytes());
        p[t + 8..t + 12].copy_from_slice(&9999u32.to_be_bytes());
        p[t + 12] = 0x50;
        p[t + 13] = 0x18; // PSH|ACK
        p[t + 14..t + 16].copy_from_slice(&64240u16.to_be_bytes());

        p[ip_hdr_len + tcp_hdr_len..].copy_from_slice(payload);
        p
    }

    #[test]
    fn checksum_known_vector() {
        // 0001 + f003 + f0f0 + f0f1 = d1e7 (carry fold sonrası) => ~d1e7 = 2e18
        let data = [0x00u8, 0x01, 0xf0, 0x03, 0xf0, 0xf0, 0xf0, 0xf1];
        assert_eq!(internet_checksum(&data), 0x2e18);
    }

    #[test]
    fn parse_rejects_invalid_ip() {
        let bad = [0x30u8; 40]; // Invalid IP version 3
        assert!(PacketView::parse(&bad).is_none());
        let short = [0x45u8; 10]; // Truncated IPv4
        assert!(PacketView::parse(&short).is_none());
        let short_v6 = [0x60u8; 30]; // Truncated IPv6
        assert!(PacketView::parse(&short_v6).is_none());
    }

    fn synthetic_ipv6_data_packet(payload: &[u8]) -> Vec<u8> {
        let ip_hdr_len = 40usize;
        let tcp_hdr_len = 20usize;
        let tcp_total = tcp_hdr_len + payload.len();
        let total = ip_hdr_len + tcp_total;
        let mut p = vec![0u8; total];

        // IPv6 Header (40 bytes)
        p[0] = 0x60; // Version 6, Traffic Class 0
        p[1] = 0x00;
        p[2] = 0x00;
        p[3] = 0x00; // Flow Label
        p[4..6].copy_from_slice(&(tcp_total as u16).to_be_bytes()); // Payload Length
        p[6] = 6; // Next Header: TCP
        p[7] = 64; // Hop Limit
        // Source IP: 2001:db8::1
        p[8] = 0x20; p[9] = 0x01; p[10] = 0x0d; p[11] = 0xb8;
        p[23] = 0x01;
        // Dest IP: 2001:db8::2
        p[24] = 0x20; p[25] = 0x01; p[26] = 0x0d; p[27] = 0xb8;
        p[39] = 0x02;

        // TCP Header (20 bytes)
        let t = ip_hdr_len;
        p[t..t + 2].copy_from_slice(&54321u16.to_be_bytes());
        p[t + 2..t + 4].copy_from_slice(&443u16.to_be_bytes());
        p[t + 4..t + 8].copy_from_slice(&1000u32.to_be_bytes());
        p[t + 8..t + 12].copy_from_slice(&2000u32.to_be_bytes());
        p[t + 12] = 0x50; // Data offset: 5 (20 bytes)
        p[t + 13] = 0x18; // PSH|ACK
        p[t + 14..t + 16].copy_from_slice(&64240u16.to_be_bytes());

        // Payload
        p[ip_hdr_len + tcp_hdr_len..].copy_from_slice(payload);

        // TCP Checksum calculation
        p[t + 16..t + 18].copy_from_slice(&[0, 0]);
        let csum = tcp_checksum_v6(&p[..ip_hdr_len], &p[ip_hdr_len..]);
        p[t + 16..t + 18].copy_from_slice(&csum.to_be_bytes());

        p
    }

    #[test]
    fn parse_and_split_ipv6_packet() {
        let payload = b"GET /ipv6 HTTP/1.1\r\nHost: example.com\r\n\r\n";
        let pkt = synthetic_ipv6_data_packet(payload);
        let view = PacketView::parse(&pkt).expect("parse ipv6");
        assert_eq!(view.version, IpVersion::V6);
        assert_eq!(view.dst_port(), 443);
        assert_eq!(view.seq(), 1000);
        assert_eq!(view.payload(), payload);
        assert_eq!(view.ttl(), 64);

        // Ortadan böl
        let mid = payload.len() / 2;
        let s1 = build_tcp_segment(&view, view.seq(), &payload[..mid], None, None, false, None, None);
        let s2 = build_tcp_segment(
            &view,
            view.seq() + mid as u32,
            &payload[mid..],
            Some(32), // TTL/Hop limit override
            None,
            false,
            None,
            None,
        );

        let v1 = PacketView::parse(&s1).expect("seg1 v6");
        let v2 = PacketView::parse(&s2).expect("seg2 v6");
        assert_eq!(v1.version, IpVersion::V6);
        assert_eq!(v2.version, IpVersion::V6);
        assert_eq!(v1.payload(), &payload[..mid]);
        assert_eq!(v2.payload(), &payload[mid..]);
        assert_eq!(v1.seq() + mid as u32, v2.seq());
        assert_eq!(v2.ttl(), 32);
    }

    #[test]
    fn parse_roundtrip_and_segment_split() {
        let payload = b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n";
        let pkt = synthetic_data_packet(payload);
        let view = PacketView::parse(&pkt).expect("parse");
        assert_eq!(view.dst_port(), 443);
        assert_eq!(view.seq(), 7777);
        assert_eq!(view.payload(), payload);

        // Ortadan böl
        let mid = payload.len() / 2;
        let s1 = build_tcp_segment(&view, view.seq(), &payload[..mid], None, None, false, None, None);
        let s2 = build_tcp_segment(
            &view,
            view.seq() + mid as u32, &payload[mid..], None, None, false, None, None);

        let v1 = PacketView::parse(&s1).expect("seg1");
        let v2 = PacketView::parse(&s2).expect("seg2");
        assert_eq!(v1.payload(), &payload[..mid]);
        assert_eq!(v2.payload(), &payload[mid..]);
        assert_eq!(v1.seq() + mid as u32, v2.seq());
        assert_eq!(v1.flags(), 0x18);
    }

    #[test]
    fn fake_ttl_packet_differs_only_in_ttl_and_csum() {
        let payload = b"x".repeat(100);
        let pkt = synthetic_data_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();
        let fake = build_tcp_segment(&view, view.seq(), &payload, Some(5), None, true, None, None);
        let fv = PacketView::parse(&fake).unwrap();
        assert_eq!(fv.ttl(), 5);
        // Bozuk checksum: TCP checksum alanı gerçek checksum'un tersi olmalı
        let good = build_tcp_segment(&view, view.seq(), &payload, Some(5), None, false, None, None);
        let cso = 20 + 16; // ip_hdr_len + tcp checksum offset
        assert_ne!(&fake[cso..cso + 2], &good[cso..cso + 2]);
    }

    /// Regresyon: her üretilen segment kendine özgü bir IP ID taşımalı —
    /// orijinal paketin ID'sini kopyalamak, tek pakete bölünen tüm
    /// segmentleri (ve sahte kopyaları) aynı ID ile fingerprintlenebilir
    /// hale getirirdi.
    #[test]
    fn each_generated_segment_gets_a_distinct_ip_id() {
        let payload = b"x".repeat(50);
        let pkt = synthetic_data_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();
        let original_id = view.ip_id();

        let seg1 = build_tcp_segment(&view, view.seq(), &payload, None, None, false, None, None);
        let seg2 = build_tcp_segment(&view, view.seq(), &payload, Some(4), None, true, None, None);
        let seg3 = build_tcp_segment(&view, view.seq(), &payload, None, None, false, None, None);

        let id1 = PacketView::parse(&seg1).unwrap().ip_id();
        let id2 = PacketView::parse(&seg2).unwrap().ip_id();
        let id3 = PacketView::parse(&seg3).unwrap().ip_id();

        assert_ne!(id1, id2, "aynı çağrıdan üretilen iki segment aynı ID'yi taşımamalı");
        assert_ne!(id2, id3);
        assert_ne!(id1, id3);
        // Orijinalle üçünün de eşleşmesi (aynı anda) istatistiksel olarak
        // imkansıza yakın; asıl garanti sayaç tabanlı olmasıdır.
        assert!(!(id1 == original_id && id2 == original_id && id3 == original_id));
    }
}
