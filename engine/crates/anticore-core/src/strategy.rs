//! DPI bypass strateji kataloğu ve pipeline uygulayıcısı.
//!
//! Tasarım: her adım [`Step`] enum'undandır; pipeline ham paketten
//! gönderilecek segment listesi ([`StrategyPlan`]) üretir. Boş plan =
//! orijinal paket dokunulmadan geçer (hız korunur).
//!
//! Sıra garantisi: sahte paketler HER ZAMAN gerçek segmentlerden ÖNCE gelir
//! (DPI cache'ini kirletme amacı bu sıraya bağlıdır).

use crate::net::{build_tcp_segment, PacketView};
use crate::tls::{find_split_offset, parse_http_host, parse_client_hello, SplitMode};

/// Paketin TCP ACK numarası.
fn ack_of(view: &PacketView) -> u32 {
    let o = view.ip_hdr_len + 8;
    u32::from_be_bytes([
        view.raw[o],
        view.raw[o + 1],
        view.raw[o + 2],
        view.raw[o + 3],
    ])
}

/// Tek bir bypass adımı.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Step {
    /// TLS ClientHello'yu belirtilen noktadan ikiye böler.
    FragmentTls { mode: SplitMode },
    /// Düz HTTP isteğinde Host başlığının ortasından böler.
    FragmentHttp,
    /// Gerçek trafikten önce düşük TTL'li sahte kopya gönderir
    /// (denetim cihazına ulaşır, hedef sunucuya ulaşamaz).
    FakePacketBefore { ttl: u8 },
    /// Gerçek trafikten önce, pencere dışı (geçmişte) sıra numarasıyla
    /// sahte kopya gönderir — sunucu düşürür, denetim cihazı kabul eder.
    FakeWrongSeq,
    /// Gerçek trafikten önce, kasıtlı olarak hatalı TCP checksum'a sahip
    /// sahte kopya gönderir — sunucu düşürür, denetim cihazı kabul eder.
    FakeWrongChecksum,
    /// HTTP Host değerinin harflerini karıştırır (alan adları harf
    /// duyarsızdır; düz metin imzası bozulur).
    HostCase,
    /// `Host: ad` biçimindeki boşluğu kaldırır (RFC 7230 geçerli biçim).
    HostSpace,
    /// Otomatik / taban TTL hesabı (base TTL + tolerance tolerans payı).
    AutoTtl { base: u8, tolerance: u8 },
    /// Payload'ı birden fazla ofsetten böler (çoklu segmentasyon).
    MultiSplit { positions: Vec<usize> },
    /// Özel hex baytları ile sahte paket enjekte eder (OOB / özel imza).
    FakeFromHex { payload: Vec<u8> },
    /// Out-of-band byte enjekte eder, URG bayrağını ve Urgent Pointer'ı ayarlar.
    Oob { offset: u16, payload: u8 },
    /// Giden paketlerde TCP Window Size'ı küçülterek DPI yanıtlarını kısıtlar.
    WindowSize { size: u16 },
    /// HTTP metodunun harflerini karıştırır (örn: gEt).
    HttpMethodCase,
    /// HTTP isteğini Absolute URI formatına çevirir (örn: GET http://domain.com/).
    HttpAbsoluteUri,
    /// HTTP satır sonlarını CRLF (\r\n) yerine salt LF (\n) yapar.
    HttpLf,
}

/// Pipeline çıktısı: inject edilecek IPv4+TCP paketleri.
///
/// Sıra garantisi: `fakes` HER ZAMAN `reals`'tan ÖNCE gönderilir
/// (DPI cache kirletme bunu gerektirir).
/// Boş plan = orijinal paket dokunulmadan geçer.
#[derive(Debug, Clone, Default)]
pub struct StrategyPlan {
    /// Sahte paketler (düşük TTL / bozuk checksum) — DPI'a gider, sunucuya gitmez.
    pub fakes: Vec<Vec<u8>>,
    /// Gerçek trafik segmentleri.
    pub reals: Vec<Vec<u8>>,
}

impl StrategyPlan {
    pub fn is_passthrough(&self) -> bool {
        self.fakes.is_empty() && self.reals.is_empty()
    }

    /// Gönderim sırasıyla tüm paketler: önce fake, sonra gerçek.
    pub fn in_order(&self) -> impl Iterator<Item = &Vec<u8>> {
        self.fakes.iter().chain(self.reals.iter())
    }
}

/// Ham outbound paketi pipeline'dan geçirir.
///
/// Döner: plan (inject listesi). Paket ilgisizse (TLS/HTTP değil, bölünecek
/// bir şey yoksa) passthrough döner.
pub fn apply_steps(view: &PacketView, steps: &[Step]) -> StrategyPlan {
    let payload = view.payload();
    let has_window_size = steps.iter().any(|s| matches!(s, Step::WindowSize { .. }));
    if payload.is_empty() && !has_window_size {
        return StrategyPlan::default();
    }

    // 1) Gerçek segmentleri üret
    let mut real_segments: Option<Vec<Vec<u8>>> = None;

    for step in steps {
        match step {
            Step::FragmentTls { mode } if real_segments.is_none() => {
                // Sadece ilk veri paketinde (ClientHello) çalışır
                if parse_client_hello(payload).is_some() {
                    if let Some(off) = find_split_offset(payload, mode) {
                        let seg1 =
                            build_tcp_segment(view, view.seq(), &payload[..off], None, None, false, None, None);
                        let seg2 = build_tcp_segment(
                            view,
                            view.seq() + off as u32,
                            &payload[off..],
                            None, None,
                            false, None, None,
                        );
                        // Reverse: gönderim sırası ters — TCP birleştirmesi
                        // host tarafında seq'le doğru yapılır.
                        real_segments = Some(match mode {
                            SplitMode::Reverse(_) | SplitMode::SniMidReverse => vec![seg2, seg1],
                            _ => vec![seg1, seg2],
                        });
                    }
                }
            }
            Step::MultiSplit { positions } if real_segments.is_none() => {
                let mut valid_cuts: Vec<usize> = positions
                    .iter()
                    .copied()
                    .filter(|&p| p > 0 && p < payload.len())
                    .collect();
                valid_cuts.sort_unstable();
                valid_cuts.dedup();

                if !valid_cuts.is_empty() {
                    let mut segs = Vec::with_capacity(valid_cuts.len() + 1);
                    let mut prev = 0;
                    for &cut in &valid_cuts {
                        let chunk = &payload[prev..cut];
                        let seg = build_tcp_segment(
                            view,
                            view.seq() + prev as u32,
                            chunk,
                            None,
                            None,
                            false, None, None,
                        );
                        segs.push(seg);
                        prev = cut;
                    }
                    let last_chunk = &payload[prev..];
                    let seg = build_tcp_segment(
                        view,
                        view.seq() + prev as u32,
                        last_chunk,
                        None,
                        None,
                        false, None, None,
                    );
                    segs.push(seg);
                    real_segments = Some(segs);
                }
            }
            Step::FragmentHttp if real_segments.is_none() => {
                // Sadece ilk veri paketinde (GET isteği) çalışır
                if let Some(host) = parse_http_host(payload) {
                    let off = host.host_offset + host.host_len / 2;
                    let seg1 =
                        build_tcp_segment(view, view.seq(), &payload[..off], None, None, false, None, None);
                    let seg2 = build_tcp_segment(
                        view,
                        view.seq() + off as u32,
                        &payload[off..],
                        None, None,
                        false, None, None,
                    );
                    real_segments = Some(vec![seg1, seg2]);
                }
            }
            _ => {}
        }
    }

    // 1b) Payload dönüştüren HTTP adımları (bölünmemişse uygulanır)
    let mut real = real_segments.unwrap_or_else(|| {
        let transformed = transform_http_payload(payload, steps);
        if transformed != payload {
            vec![build_tcp_segment(view, view.seq(), &transformed, None, None, false, None, None)]
        } else {
            vec![build_tcp_segment(view, view.seq(), payload, None, None, false, None, None)]
        }
    });

    // WindowSize tekniğini gerçek segmentlere (reals) uygula
    let window_size = steps.iter().find_map(|s| {
        if let Step::WindowSize { size } = s { Some(*size) } else { None }
    });
    
    // 2) Sahte paketler
    let source = real
        .iter()
        .filter_map(|seg| PacketView::parse(seg))
        .filter(|v| !v.payload().is_empty())
        .min_by_key(|v| v.seq());

    let mut fakes = Vec::new();
    let configured_ttl = steps.iter().find_map(|s| match s {
        Step::FakePacketBefore { ttl } => Some(*ttl),
        Step::AutoTtl { base, tolerance } => Some((*base).saturating_add((*tolerance).min(3))),
        _ => None,
    }).unwrap_or(4);

    if let Some(v0) = source {
        for step in steps {
            match step {
                Step::FakePacketBefore { ttl } => {
                    let fake = build_tcp_segment(&v0, v0.seq(), v0.payload(), Some(*ttl), None, false, None, window_size);
                    fakes.push(fake);
                }
                Step::AutoTtl { base, tolerance } => {
                    let effective_ttl = (*base).saturating_add((*tolerance).min(3));
                    let fake = build_tcp_segment(&v0, v0.seq(), v0.payload(), Some(effective_ttl), None, false, None, window_size);
                    fakes.push(fake);
                }
                Step::FakeFromHex { payload: fake_payload } => {
                    let fake = build_tcp_segment(&v0, v0.seq(), fake_payload, Some(configured_ttl), None, false, None, window_size);
                    fakes.push(fake);
                }
                Step::FakeWrongSeq => {
                    let past_seq = v0.seq().wrapping_sub(10_000);
                    let past_ack = ack_of(&v0).wrapping_sub(66_000);
                    let fake = build_tcp_segment(&v0, past_seq, v0.payload(), None, Some(past_ack), true, None, window_size);
                    fakes.push(fake);
                }
                Step::FakeWrongChecksum => {
                    let fake = build_tcp_segment(&v0, v0.seq(), v0.payload(), None, None, true, None, window_size);
                    fakes.push(fake);
                }
                Step::Oob { offset, payload: oob_payload } => {
                    let fake_data = vec![*oob_payload];
                    let seq = v0.seq().wrapping_add(*offset as u32);
                    let fake = build_tcp_segment(&v0, seq, &fake_data, Some(configured_ttl), None, true, Some(1), window_size);
                    fakes.push(fake);
                }
                _ => {}
            }
        }
    }
    
    // WindowSize override'ını real paketlere de uygula (tekrar build ederek)
    if let Some(ws) = window_size {
        for i in 0..real.len() {
            if let Some(view) = PacketView::parse(&real[i]) {
                real[i] = build_tcp_segment(&view, view.seq(), view.payload(), None, None, false, None, Some(ws));
            }
        }
    }

    // Passthrough optimizasyonu
    if fakes.is_empty() && real.len() == 1 && real[0] == view.raw {
        return StrategyPlan::default();
    }

    StrategyPlan { fakes, reals: real }
}

/// HTTP payload dönüştürücüleri: HostCase, HostSpace, HttpMethodCase, HttpAbsoluteUri, HttpLf
fn transform_http_payload(payload: &[u8], steps: &[Step]) -> Vec<u8> {
    let mut out = payload.to_vec();
    
    let is_http = out.starts_with(b"GET ") || out.starts_with(b"POST ") || out.starts_with(b"HEAD ") || out.starts_with(b"PUT ") || out.starts_with(b"DELETE ") || out.starts_with(b"OPTIONS ") || out.starts_with(b"PATCH ");
    if !is_http {
        return out;
    }

    // HttpMethodCase: GET -> GeT, vb.
    if steps.contains(&Step::HttpMethodCase) {
        if let Some(pos) = out.iter().position(|&b| b == b' ') {
            for i in 0..pos {
                if i % 2 == 1 && out[i].is_ascii_alphabetic() {
                    out[i] = out[i].to_ascii_lowercase();
                }
            }
        }
    }

    // HttpAbsoluteUri: GET /path HTTP/1.1 -> GET http://host/path HTTP/1.1
    if steps.contains(&Step::HttpAbsoluteUri) {
        if let Some(host) = parse_http_host(&out) {
            let host_str = &out[host.host_offset..host.host_offset + host.host_len];
            if let Some(space_pos) = out.iter().position(|&b| b == b' ') {
                let mut new_out = out[..space_pos + 1].to_vec();
                new_out.extend_from_slice(b"http://");
                new_out.extend_from_slice(host_str);
                new_out.extend_from_slice(&out[space_pos + 1..]);
                out = new_out;
            }
        }
    }

    // HostCase ve HostSpace
    if let Some(host) = parse_http_host(&out) {
        let start = host.host_offset;
        let end = start + host.host_len;

        if steps.contains(&Step::HostCase) {
            for i in start..end {
                if out[i].is_ascii_alphabetic() {
                    if (i - start) % 2 == 1 {
                        out[i] = out[i].to_ascii_uppercase();
                    } else {
                        out[i] = out[i].to_ascii_lowercase();
                    }
                }
            }
        }

        if steps.contains(&Step::HostSpace) {
            if start >= 1 && out[start - 1] == b' ' {
                out.remove(start - 1);
            }
        }
    }
    
    // HttpLf: \r\n -> \n
    if steps.contains(&Step::HttpLf) {
        out.retain(|&b| b != b'\r');
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::net::PacketView;
    use crate::tls::SplitMode;

    fn synthetic_packet(payload: &[u8]) -> Vec<u8> {
        let ip_hdr_len = 20usize;
        let tcp_hdr_len = 20usize;
        let total = ip_hdr_len + tcp_hdr_len + payload.len();
        let mut p = vec![0u8; total];
        p[0] = 0x45;
        p[1] = 0x00;
        p[2..4].copy_from_slice(&(total as u16).to_be_bytes());
        p[6..8].copy_from_slice(&0x4000u16.to_be_bytes());
        p[8] = 64;
        p[9] = 6;
        p[12..16].copy_from_slice(&[192, 168, 1, 10]);
        p[16..20].copy_from_slice(&[93, 184, 216, 34]);
        let t = ip_hdr_len;
        p[t..t + 2].copy_from_slice(&54321u16.to_be_bytes());
        p[t + 2..t + 4].copy_from_slice(&443u16.to_be_bytes());
        p[t + 4..t + 8].copy_from_slice(&7777u32.to_be_bytes());
        p[t + 8..t + 12].copy_from_slice(&9999u32.to_be_bytes());
        p[t + 12] = 0x50;
        p[t + 13] = 0x18;
        p[t + 14..t + 16].copy_from_slice(&64240u16.to_be_bytes());
        p[ip_hdr_len + tcp_hdr_len..].copy_from_slice(payload);
        p
    }

    fn client_hello_payload(sni: &[u8]) -> Vec<u8> {
        let mut ch = Vec::new();
        ch.extend_from_slice(&[0x03, 0x03]);
        ch.extend_from_slice(&[0xAB; 32]);
        ch.push(0x00);
        ch.extend_from_slice(&[0x00, 0x02, 0x13, 0x01]);
        ch.push(0x01);
        ch.push(0x00);

        let mut sni_ext = Vec::new();
        sni_ext.extend_from_slice(&((sni.len() + 3) as u16).to_be_bytes());
        sni_ext.push(0x00);
        sni_ext.extend_from_slice(&(sni.len() as u16).to_be_bytes());
        sni_ext.extend_from_slice(sni);

        let mut exts = Vec::new();
        exts.extend_from_slice(&0x0000u16.to_be_bytes());
        exts.extend_from_slice(&(sni_ext.len() as u16).to_be_bytes());
        exts.extend_from_slice(&sni_ext);

        ch.extend_from_slice(&(exts.len() as u16).to_be_bytes());
        ch.extend_from_slice(&exts);

        let mut hs = vec![0x01];
        let l = ch.len();
        hs.push(((l >> 16) & 0xFF) as u8);
        hs.push(((l >> 8) & 0xFF) as u8);
        hs.push((l & 0xFF) as u8);
        hs.extend_from_slice(&ch);

        let mut rec = vec![0x16, 0x03, 0x01];
        rec.extend_from_slice(&(hs.len() as u16).to_be_bytes());
        rec.extend_from_slice(&hs);
        rec
    }

    #[test]
    fn tls_fragment_produces_two_valid_segments_in_order() {
        let payload = client_hello_payload(b"discord.com");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();

        let plan = apply_steps(
            &view,
            &[Step::FragmentTls { mode: SplitMode::SniMid }],
        );

        assert_eq!(plan.reals.len(), 2);
        assert!(plan.fakes.is_empty());
        let v1 = PacketView::parse(&plan.reals[0]).unwrap();
        let v2 = PacketView::parse(&plan.reals[1]).unwrap();
        assert!(v1.payload().len() > 0 && v2.payload().len() > 0);
        assert_eq!(v1.seq() + v1.payload().len() as u32, v2.seq());
        // Birleşik payload = orijinal
        let mut joined = v1.payload().to_vec();
        joined.extend_from_slice(v2.payload());
        assert_eq!(joined, payload);
    }

    #[test]
    fn fake_packet_comes_before_real_traffic() {
        let payload = client_hello_payload(b"x.com");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();

        let plan = apply_steps(
            &view,
            &[
                Step::FragmentTls { mode: SplitMode::SniMid },
                Step::FakePacketBefore { ttl: 4 },
            ],
        );

        assert_eq!(plan.fakes.len(), 1);
        assert_eq!(plan.reals.len(), 2);

        // in_order: fake önce
        let order: Vec<usize> = plan.in_order()
            .map(|p| if plan.fakes.contains(p) { 0 } else { 1 })
            .collect();
        assert_eq!(order[0], 0, "fake ilk sırada olmalı");

        let fv = PacketView::parse(&plan.fakes[0]).unwrap();
        assert_eq!(fv.ttl(), 4);
        // Sahte paketin TCP checksum'u GEÇERLİ olmalı — düşük TTL sunucuya
        // ulaşmasını zaten engeller; checksum'ı da bozmak checksum-doğrulayan
        // denetleyicilere karşı tekniği zayıflatırdı. Aynı seq/payload/başlık
        // ile üretildiği için gerçek segmentle checksum'ı birebir eşleşir.
        let rv = PacketView::parse(&plan.reals[0]).unwrap();
        let cso = 20 + 16;
        assert_eq!(&plan.fakes[0][cso..cso + 2], &plan.reals[0][cso..cso + 2]);
        assert_eq!(rv.ttl(), 64);
    }

    #[test]
    fn unrelated_packet_passes_through_untouched() {
        // ACK-only paket (payload boş)
        let pkt = synthetic_packet(&[]);
        let view = PacketView::parse(&pkt).unwrap();
        let plan = apply_steps(&view, &[Step::FragmentHttp]);
        assert!(plan.is_passthrough());
    }

    #[test]
    fn http_fragment_splits_at_host_midpoint() {
        let req = b"GET /p HTTP/1.1\r\nHost: example.com\r\n\r\n";
        let pkt = synthetic_packet(req);
        let view = PacketView::parse(&pkt).unwrap();
        let plan = apply_steps(&view, &[Step::FragmentHttp]);
        assert_eq!(plan.reals.len(), 2);
        let v1 = PacketView::parse(&plan.reals[0]).unwrap();
        // host_offset=23, host_len=11 => off = 23 + 5 = 28
        assert_eq!(v1.payload(), &req[..28]);
        assert_eq!(b"examp", &req[23..28]);
    }

    #[test]
    fn wrong_seq_fake_uses_past_sequence() {
        let payload = client_hello_payload(b"x.com");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();
        let plan = apply_steps(&view, &[Step::FakeWrongSeq]);

        assert_eq!(plan.fakes.len(), 1);
        assert_eq!(plan.reals.len(), 1);
        let fv = PacketView::parse(&plan.fakes[0]).unwrap();
        let rv = PacketView::parse(&plan.reals[0]).unwrap();
        // Sabit kaydırma: SEQ -10.000, ACK -66.000
        assert_eq!(fv.seq(), rv.seq().wrapping_sub(10_000));
        assert_eq!(ack_of(&fv), ack_of(&rv).wrapping_sub(66_000));
        // Checksum bozuk olmalı
        let cso = 20 + 16;
        assert_ne!(&plan.fakes[0][cso..cso + 2], &plan.reals[0][cso..cso + 2]);
    }

    #[test]
    fn reverse_mode_sends_second_segment_first() {
        let payload = client_hello_payload(b"discord.com");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();

        let plan = apply_steps(
            &view,
            &[Step::FragmentTls { mode: SplitMode::Reverse(1) }],
        );

        assert_eq!(plan.reals.len(), 2);
        let first = PacketView::parse(&plan.reals[0]).unwrap();
        let second = PacketView::parse(&plan.reals[1]).unwrap();
        // İlk gönderilen, DAHA YÜKSEK seq'li (ikinci yarı) segment olmalı
        assert_eq!(first.seq(), second.seq() + second.payload().len() as u32);
        // Birleşim yine orijinali vermeli
        let mut joined = second.payload().to_vec();
        joined.extend_from_slice(first.payload());
        assert_eq!(joined, payload);
    }

    /// Regresyon: reverse modda `real[0]` gönderim sırasına göre ilk ama
    /// akışta İKİNCİ YARI segmenttir. Sahte paket üretimi bunu kaynak
    /// almamalı — akıştaki gerçek ilk (en düşük seq'li) segmentten
    /// üretilmeli, yoksa sahte paket yanlış içerik/seq taşır.
    #[test]
    fn fake_packet_in_reverse_mode_sources_from_lowest_seq_segment() {
        let payload = client_hello_payload(b"superonline-test.example");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();

        let plan = apply_steps(
            &view,
            &[
                Step::FragmentTls { mode: SplitMode::SniMidReverse },
                Step::FakeWrongChecksum,
            ],
        );

        assert_eq!(plan.reals.len(), 2);
        assert_eq!(plan.fakes.len(), 1);

        // reals[0] ters modda İKİNCİ YARI (yüksek seq), reals[1] BİRİNCİ
        // YARI (düşük seq, orijinal view.seq()'e eşit).
        let real0 = PacketView::parse(&plan.reals[0]).unwrap();
        let real1 = PacketView::parse(&plan.reals[1]).unwrap();
        assert!(real0.seq() > real1.seq(), "reals[0] ikinci yarı (yüksek seq) olmalı");
        assert_eq!(real1.seq(), view.seq());

        // Sahte paket, DÜŞÜK seq'li (akıştaki gerçek ilk) segmentten
        // üretilmiş olmalı — real[0]'dan değil.
        let fake = PacketView::parse(&plan.fakes[0]).unwrap();
        assert_eq!(fake.seq(), real1.seq());
        assert_eq!(fake.payload(), real1.payload());
    }

    #[test]
    fn host_case_mixes_letters() {
        let req = b"GET /p HTTP/1.1\r\nHost: example.com\r\n\r\n";
        let pkt = synthetic_packet(req);
        let view = PacketView::parse(&pkt).unwrap();
        let plan = apply_steps(&view, &[Step::HostCase]);

        assert!(!plan.is_passthrough());
        let v = PacketView::parse(&plan.reals[0]).unwrap();
        let out = v.payload();
        // Uzunluk korunur, Host değeri değişmiş olmalı
        assert_eq!(out.len(), req.len());
        assert_ne!(out, &req[..]);
        // "example.com" → "eXaMpLe.cOm" (tek indeksler büyük)
        assert_eq!(&out[23..34], b"eXaMpLe.cOm");
    }

    #[test]
    fn host_space_removes_space() {
        let req = b"GET /p HTTP/1.1\r\nHost: example.com\r\n\r\n";
        let pkt = synthetic_packet(req);
        let view = PacketView::parse(&pkt).unwrap();
        let plan = apply_steps(&view, &[Step::HostSpace]);

        let v = PacketView::parse(&plan.reals[0]).unwrap();
        let out = v.payload();
        assert_eq!(out.len(), req.len() - 1);
        assert!(&out.starts_with(b"GET /p HTTP/1.1\r\nHost:example.com"));
    }

    #[test]
    fn http_steps_ignored_on_tls_payload() {
        let payload = client_hello_payload(b"discord.com");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();
        let plan = apply_steps(&view, &[Step::HostCase, Step::HostSpace]);
        // TLS payload'da HTTP dönüştürücüleri etki etmemeli: içerik aynı kalmalı
        let v = PacketView::parse(&plan.reals[0]).unwrap();
        assert_eq!(v.payload(), payload);
    }

    #[test]
    fn multi_split_produces_n_segments_at_specified_offsets() {
        let payload = client_hello_payload(b"multisplit.test.org");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();

        // 3 kesim noktası -> 4 segment
        let plan = apply_steps(&view, &[Step::MultiSplit { positions: vec![5, 15, 30] }]);
        assert_eq!(plan.reals.len(), 4);
        assert!(plan.fakes.is_empty());

        let mut combined = Vec::new();
        let mut expected_seq = view.seq();
        for seg in &plan.reals {
            let v = PacketView::parse(seg).unwrap();
            assert_eq!(v.seq(), expected_seq);
            expected_seq += v.payload().len() as u32;
            combined.extend_from_slice(v.payload());
        }
        assert_eq!(combined, payload);
    }

    #[test]
    fn auto_ttl_and_fake_from_hex_produce_expected_fakes() {
        let payload = client_hello_payload(b"fakehex.test.org");
        let pkt = synthetic_packet(&payload);
        let view = PacketView::parse(&pkt).unwrap();

        let fake_hex_payload = vec![0x16, 0x03, 0x01, 0xDE, 0xAD, 0xBE, 0xEF];
        let plan = apply_steps(
            &view,
            &[
                Step::AutoTtl { base: 3, tolerance: 1 },
                Step::FakeFromHex { payload: fake_hex_payload.clone() },
            ],
        );

        assert_eq!(plan.fakes.len(), 2);
        assert_eq!(plan.reals.len(), 1);

        // Fake 1: AutoTtl (base 3 + tolerance 1 -> TTL 4)
        let f1 = PacketView::parse(&plan.fakes[0]).unwrap();
        assert_eq!(f1.ttl(), 4);
        assert_eq!(f1.payload(), payload);

        // Fake 2: FakeFromHex
        let f2 = PacketView::parse(&plan.fakes[1]).unwrap();
        assert_eq!(f2.payload(), fake_hex_payload);
    }
}
