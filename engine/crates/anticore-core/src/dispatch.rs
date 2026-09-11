//! Yakalanan tek bir paket için "ne yapılmalı" kararı - CLI (`anticore run`)
//! ve masaüstü panel (`service::Engine`) AYNI karar mantığını kullanır.
//!
//! Önceden bu mantık (boyut/hedef filtresi + `apply_steps` çağrısı) iki
//! ayrı yerde elle kopyalanmıştı ve ayrışmıştı: CLI recv() None döndüğünde
//! ne uyku ne çıkış koşulu vardı (%100 CPU spin riski), masaüstünde ise
//! vardı. Transport I/O'sunu (WinDivert recv/send) burada YAPMAYIZ - bu
//! modül anticore-transport-win'e bağımlı değildir, yalnızca kararı üretir;
//! çağıran taraf gönderimi kendi transport'uyla yapar.

use crate::config::Blacklist;
use crate::net::PacketView;
use crate::strategy::{apply_steps, Step};
use crate::tls::{parse_client_hello, parse_http_host};

/// Kurulu oturumun dosya transferi paketleri işlenmez -> CPU ve hız korunur.
/// Post-quantum (Kyber) ve ECH taşıyan büyük ClientHello paketlerini (1400+ bayt)
/// kapsaması için sınır 2048 olarak ayarlanmıştır.
pub const MAX_INSPECT_PAYLOAD: usize = 2048;

/// Keep bulk TLS data and control packets outside the user-mode packet loop.
pub fn capture_filter(steps: &[Step]) -> String {
    capture_filter_with_options(steps, false)
}

/// Mobil Etkin Nokta (Hotspot / Forwarding) seçeneğiyle genişletilmiş filtre.
pub fn capture_filter_with_options(steps: &[Step], allow_forward: bool) -> String {
    let direction = if allow_forward {
        "(outbound or forward)"
    } else {
        "outbound"
    };
    let base = format!(
        "{direction} and tcp and !loopback and !impostor and (tcp.DstPort == 443 or tcp.DstPort == 80) and tcp.PayloadLength <= {MAX_INSPECT_PAYLOAD}"
    );
    if steps.iter().any(|step| matches!(step, Step::WindowSize { .. })) {
        return base;
    }
    format!("{base} and tcp.PayloadLength > 0 and ((tcp.Payload[0] == 0x16 and tcp.Payload[5] == 0x01) or tcp.Payload32[0] == 0x47455420 or tcp.Payload32[0] == 0x504f5354 or tcp.Payload32[0] == 0x48454144)")
}

/// Bir paketin neden dokunulmadan geçtiği (istatistik/log ayrımı içindir).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PassthroughReason {
    /// IPv4/TCP olarak ayrıştırılamadı.
    Unparseable,
    /// TCP payload boş (SYN/ACK/FIN vb. kontrol paketi).
    EmptyPayload,
    /// Payload dosya transferi boyutunda - kasıtlı olarak hiç incelenmez.
    TooLarge,
    /// Hedef listede değil.
    NotTargeted,
    /// Hedeflendi ama hiçbir adım pakete dokunmadı (no-op plan).
    NoOpPlan,
}

/// `decide_packet` çıktısı: transport katmanı buna göre davranır.
#[derive(Debug)]
pub enum PacketDecision {
    /// Orijinal paket aynen (değişmeden) gönderilsin.
    Passthrough(PassthroughReason),
    /// Bu segmentler sırasıyla gönderilsin; orijinal paket YERİNE geçer.
    Rewrite(Vec<Vec<u8>>),
}

/// Ham bir IPv4 paketi için karar üretir. Transport-bağımsızdır (saf
/// fonksiyon): aynı raw + blacklist + steps her zaman aynı kararı verir.
pub fn decide_packet(raw: &[u8], blacklist: &Blacklist, steps: &[Step]) -> PacketDecision {
    let Some(view) = PacketView::parse(raw) else {
        return PacketDecision::Passthrough(PassthroughReason::Unparseable);
    };

    let payload = view.payload();
    let has_window_size = steps.iter().any(|s| matches!(s, Step::WindowSize { .. }));
    if payload.is_empty() && !has_window_size {
        return PacketDecision::Passthrough(PassthroughReason::EmptyPayload);
    }
    if payload.len() > MAX_INSPECT_PAYLOAD {
        return PacketDecision::Passthrough(PassthroughReason::TooLarge);
    }
    if !targets_blacklist(&view, blacklist) {
        return PacketDecision::Passthrough(PassthroughReason::NotTargeted);
    }

    let plan = apply_steps(&view, steps);
    if plan.is_passthrough() {
        return PacketDecision::Passthrough(PassthroughReason::NoOpPlan);
    }
    PacketDecision::Rewrite(plan.in_order().cloned().collect())
}

/// Paketin hedef listede kayıtlı bir SNI/Host taşıyıp taşımadığı.
pub fn targets_blacklist(view: &PacketView, blacklist: &Blacklist) -> bool {
    if blacklist.is_empty() {
        return true; // liste boşsa tüm TLS/HTTP trafiği hedeflenir
    }
    let payload = view.payload();
    if let Some(info) = parse_client_hello(payload) {
        if let Some(sni) = info.sni(payload) {
            return blacklist.matches(sni);
        }
    }
    if let Some(host) = parse_http_host(payload) {
        return blacklist.matches(&payload[host.host_offset..host.host_offset + host.host_len]);
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::strategy::Step;
    use crate::tls::SplitMode;

    fn synthetic_packet(payload: &[u8]) -> Vec<u8> {
        let ip_hdr_len = 20usize;
        let tcp_hdr_len = 20usize;
        let total = ip_hdr_len + tcp_hdr_len + payload.len();
        let mut p = vec![0u8; total];
        p[0] = 0x45;
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
    fn malformed_packet_is_passthrough_unparseable() {
        let raw = [0u8; 4]; // çok kısa
        let bl = Blacklist::from_lines("discord.com\n");
        let d = decide_packet(&raw, &bl, &[]);
        assert!(matches!(d, PacketDecision::Passthrough(PassthroughReason::Unparseable)));
    }

    #[test]
    fn empty_payload_is_passthrough() {
        let pkt = synthetic_packet(&[]);
        let bl = Blacklist::from_lines("discord.com\n");
        let d = decide_packet(&pkt, &bl, &[Step::FragmentTls { mode: SplitMode::SniMid }]);
        assert!(matches!(d, PacketDecision::Passthrough(PassthroughReason::EmptyPayload)));
    }

    #[test]
    fn oversized_payload_is_passthrough_too_large() {
        let pkt = synthetic_packet(&vec![0x41u8; MAX_INSPECT_PAYLOAD + 1]);
        let bl = Blacklist::from_lines("discord.com\n");
        let d = decide_packet(&pkt, &bl, &[Step::FragmentTls { mode: SplitMode::SniMid }]);
        assert!(matches!(d, PacketDecision::Passthrough(PassthroughReason::TooLarge)));
    }

    #[test]
    fn non_targeted_sni_is_passthrough() {
        let payload = client_hello_payload(b"example.com");
        let pkt = synthetic_packet(&payload);
        let bl = Blacklist::from_lines("discord.com\n");
        let d = decide_packet(&pkt, &bl, &[Step::FragmentTls { mode: SplitMode::SniMid }]);
        assert!(matches!(d, PacketDecision::Passthrough(PassthroughReason::NotTargeted)));
    }

    #[test]
    fn targeted_sni_with_steps_yields_rewrite() {
        let payload = client_hello_payload(b"discord.com");
        let pkt = synthetic_packet(&payload);
        let bl = Blacklist::from_lines("discord.com\n");
        let d = decide_packet(&pkt, &bl, &[Step::FragmentTls { mode: SplitMode::SniMid }]);
        match d {
            PacketDecision::Rewrite(segments) => assert_eq!(segments.len(), 2),
            other => panic!("beklenen Rewrite, gelen: {other:?}"),
        }
    }

    #[test]
    fn empty_blacklist_targets_everything() {
        let payload = client_hello_payload(b"anything.example");
        let pkt = synthetic_packet(&payload);
        let bl = Blacklist::from_lines("");
        let d = decide_packet(&pkt, &bl, &[Step::FragmentTls { mode: SplitMode::SniMid }]);
        assert!(matches!(d, PacketDecision::Rewrite(_)));
    }
}
