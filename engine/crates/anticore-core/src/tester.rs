//! Engel tespiti: hedefe sentetik ClientHello gönderip DPI davranışını ölçer.
//!
//! Saf stdlib. Mantık: gerçek bir sunucu geçersiz/garip ClientHello'yı
//! sessizce düşürmez ya da RST ile yanıtlamazken, DPI'lı hat RST üretir.
//! Yanıt sınıflandırması:
//!   - ServerHello (0x16...) geldi  -> Open
//!   - Bağlantı sıfırlandı (RST)    -> Blocked
//!   - Zaman aşımı                  -> Filtered (sessiz drop)
//!   - Bağlantı kurulamadı          -> Unreachable

use std::io::{Read, Write};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream, ToSocketAddrs};
use std::time::Duration;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProbeResult {
    /// TLS yanıtı geldi — erişim açık.
    Open { latency_ms: u128 },
    /// RST ile kesildi — aktif engel.
    Blocked { latency_ms: u128 },
    /// Yanıt yok — sessiz filtreleme.
    Filtered,
    /// Host çözümlenemedi / porta ulaşılamadı.
    Unreachable(String),
}

fn is_bogon_or_poisoned(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            let o = v4.octets();
            // Operatör Yönlendirme ve DNS Zehirleme IP Havuzları (195.175.254.2 vb.)
            if o[0] == 195 && o[1] == 175 { return true; }
            if o[0] == 212 && o[1] == 156 { return true; }
            if o[0] == 213 && o[1] == 74 { return true; }
            if o[0] == 85 && o[1] == 29 { return true; }
            if o[0] == 212 && o[1] == 252 { return true; }
            if o[0] == 212 && o[1] == 65 { return true; }
            if v4.is_unspecified() || v4.is_broadcast() { return true; }
            false
        }
        IpAddr::V6(v6) => {
            if v6.is_unspecified() { return true; }
            let s = v6.segments();
            if s[0] == 0x2a00 && s[1] == 0x1368 { return true; }
            false
        }
    }
}

fn resolve_target_addr(host: &str, port: u16) -> Result<SocketAddr, String> {
    if let Ok(addrs) = (host, port).to_socket_addrs() {
        for addr in addrs {
            let ip = addr.ip();
            if !is_bogon_or_poisoned(&ip) {
                return Ok(addr);
            }
        }
    }
    // DNS zehirlenmesi veya yerel çözümlenememe durumunda meşru sunucu IP yedekleri
    match host.trim().to_lowercase().as_str() {
        "discord.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(162, 159, 138, 232)), port)),
        "gateway.discord.gg" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(162, 159, 135, 234)), port)),
        "roblox.com" | "www.roblox.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(128, 116, 119, 3)), port)),
        "instagram.com" | "www.instagram.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(157, 240, 245, 174)), port)),
        _ => Err(format!("DNS: {host} için geçerli IP çözümlenemedi (DNS zehirlenmesi olabilir)")),
    }
}

/// Sentetik, protokol-uyumlu ve modern TLS 1.2/1.3 sunucularıyla el sıkışabilen ClientHello üretir.
fn synthetic_hello(sni: &str) -> Vec<u8> {
    let mut ch = Vec::new();
    ch.extend_from_slice(&[0x03, 0x03]); // legacy version TLS1.2
    ch.extend_from_slice(&[0xAB; 32]); // 32 byte random
    ch.push(0x00); // session id length 0

    // Standart Cipher Suites (TLS 1.3 ve yaygın TLS 1.2 ciphers)
    let ciphers: [u8; 10] = [
        0x13, 0x01, // TLS_AES_128_GCM_SHA256
        0x13, 0x02, // TLS_AES_256_GCM_SHA384
        0x13, 0x03, // TLS_CHACHA20_POLY1305_SHA256
        0xc0, 0x2f, // TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
        0xc0, 0x2b, // TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
    ];
    ch.extend_from_slice(&(ciphers.len() as u16).to_be_bytes());
    ch.extend_from_slice(&ciphers);

    ch.push(0x01); // compression methods length: 1
    ch.push(0x00); // compression method: null

    let mut exts = Vec::new();

    // 1. SNI extension (0x0000)
    let sni_bytes = sni.as_bytes();
    let mut sni_ext = Vec::new();
    sni_ext.extend_from_slice(&((sni_bytes.len() + 3) as u16).to_be_bytes());
    sni_ext.push(0x00); // host_name type
    sni_ext.extend_from_slice(&(sni_bytes.len() as u16).to_be_bytes());
    sni_ext.extend_from_slice(sni_bytes);
    exts.extend_from_slice(&0x0000u16.to_be_bytes());
    exts.extend_from_slice(&(sni_ext.len() as u16).to_be_bytes());
    exts.extend_from_slice(&sni_ext);

    // 2. Supported Groups / Elliptic Curves (0x000a: x25519, secp256r1)
    let groups: [u8; 6] = [
        0x00, 0x04, // length: 4 bytes
        0x00, 0x1d, // x25519
        0x00, 0x17, // secp256r1
    ];
    exts.extend_from_slice(&0x000au16.to_be_bytes());
    exts.extend_from_slice(&(groups.len() as u16).to_be_bytes());
    exts.extend_from_slice(&groups);

    // 3. EC Point Formats (0x000b: uncompressed)
    let ec_points: [u8; 2] = [0x01, 0x00];
    exts.extend_from_slice(&0x000bu16.to_be_bytes());
    exts.extend_from_slice(&(ec_points.len() as u16).to_be_bytes());
    exts.extend_from_slice(&ec_points);

    // 4. Signature Algorithms (0x000d: ecdsa_secp256r1_sha256, rsa_pss_rsae_sha256, rsa_pkcs1_sha256)
    let sig_algs: [u8; 8] = [
        0x00, 0x06, // length: 6 bytes
        0x04, 0x03, // ecdsa_secp256r1_sha256
        0x08, 0x04, // rsa_pss_rsae_sha256
        0x04, 0x01, // rsa_pkcs1_sha256
    ];
    exts.extend_from_slice(&0x000du16.to_be_bytes());
    exts.extend_from_slice(&(sig_algs.len() as u16).to_be_bytes());
    exts.extend_from_slice(&sig_algs);

    // 5. Supported Versions (0x002b: TLS 1.2, TLS 1.3)
    let versions: [u8; 5] = [
        0x04,       // length: 4 bytes
        0x03, 0x04, // TLS 1.3
        0x03, 0x03, // TLS 1.2
    ];
    exts.extend_from_slice(&0x002bu16.to_be_bytes());
    exts.extend_from_slice(&(versions.len() as u16).to_be_bytes());
    exts.extend_from_slice(&versions);

    ch.extend_from_slice(&(exts.len() as u16).to_be_bytes());
    ch.extend_from_slice(&exts);

    let mut hs = vec![0x01]; // Handshake type: ClientHello
    let l = ch.len();
    hs.push(((l >> 16) & 0xFF) as u8);
    hs.push(((l >> 8) & 0xFF) as u8);
    hs.push((l & 0xFF) as u8);
    hs.extend_from_slice(&ch);

    let mut rec = vec![0x16, 0x03, 0x01]; // Record type: Handshake, TLS 1.0 (record layer)
    rec.extend_from_slice(&(hs.len() as u16).to_be_bytes());
    rec.extend_from_slice(&hs);
    rec
}

/// Hedefe probe atar. `timeout_ms`: bağlantı + yanıt penceresi.
pub fn probe(host: &str, port: u16, timeout_ms: u64) -> ProbeResult {
    let addr = match resolve_target_addr(host, port) {
        Ok(a) => a,
        Err(e) => return ProbeResult::Unreachable(e),
    };

    let start = std::time::Instant::now();
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(timeout_ms)) else {
        return ProbeResult::Unreachable(format!("connect: {host}:{port}"));
    };
    stream
        .set_read_timeout(Some(Duration::from_millis(timeout_ms)))
        .ok();
    stream.set_nodelay(true).ok();

    let hello = synthetic_hello(host);
    if stream.write_all(&hello).is_err() {
        return classify_reset(start.elapsed().as_millis());
    }
    if stream.flush().is_err() {
        return classify_reset(start.elapsed().as_millis());
    }

    let mut buf = [0u8; 512];
    match stream.read(&mut buf) {
        Ok(n) if n > 0 && (buf[0] == 0x16 || buf[0] == 0x15 || buf.starts_with(b"HTTP/")) => {
            ProbeResult::Open {
                latency_ms: start.elapsed().as_millis(),
            }
        }
        Ok(n) if n > 0 => ProbeResult::Open {
            latency_ms: start.elapsed().as_millis(),
        },
        Ok(_) => classify_reset(start.elapsed().as_millis()),
        Err(ref e)
            if e.kind() == std::io::ErrorKind::ConnectionReset
                || e.kind() == std::io::ErrorKind::ConnectionAborted =>
        {
            ProbeResult::Blocked {
                latency_ms: start.elapsed().as_millis(),
            }
        }
        Err(_) => ProbeResult::Filtered,
    }
}

/// Hedefe verilen bypass adımlarıyla (parçalama vb.) probe atar.
pub fn probe_with_steps(
    host: &str,
    port: u16,
    steps: &[crate::strategy::Step],
    timeout_ms: u64,
) -> ProbeResult {
    let addr = match resolve_target_addr(host, port) {
        Ok(a) => a,
        Err(e) => return ProbeResult::Unreachable(e),
    };

    let start = std::time::Instant::now();
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(timeout_ms)) else {
        return ProbeResult::Unreachable(format!("connect: {host}:{port}"));
    };
    stream
        .set_read_timeout(Some(Duration::from_millis(timeout_ms)))
        .ok();
    stream.set_nodelay(true).ok();

    let hello = synthetic_hello(host);

    let mut multi_cuts: Option<Vec<usize>> = None;
    for step in steps {
        match step {
            crate::strategy::Step::MultiSplit { positions } => {
                let mut cuts: Vec<usize> = positions
                    .iter()
                    .copied()
                    .filter(|&p| p > 0 && p < hello.len())
                    .collect();
                cuts.sort_unstable();
                cuts.dedup();
                if !cuts.is_empty() {
                    multi_cuts = Some(cuts);
                    break;
                }
            }
            crate::strategy::Step::FragmentTls { mode } => {
                if let Some(off) = crate::tls::find_split_offset(&hello, mode) {
                    if off > 0 && off < hello.len() {
                        multi_cuts = Some(vec![off]);
                        break;
                    }
                }
            }
            _ => {}
        }
    }

    if let Some(cuts) = multi_cuts {
        let mut prev = 0;
        for cut in cuts {
            let chunk = &hello[prev..cut];
            if stream.write_all(chunk).is_err() || stream.flush().is_err() {
                return classify_reset(start.elapsed().as_millis());
            }
            std::thread::sleep(Duration::from_millis(2));
            prev = cut;
        }
        let last = &hello[prev..];
        if stream.write_all(last).is_err() || stream.flush().is_err() {
            return classify_reset(start.elapsed().as_millis());
        }
    } else {
        if stream.write_all(&hello).is_err() || stream.flush().is_err() {
            return classify_reset(start.elapsed().as_millis());
        }
    }

    let mut buf = [0u8; 512];
    match stream.read(&mut buf) {
        Ok(n) if n > 0 && (buf[0] == 0x16 || buf[0] == 0x15 || buf.starts_with(b"HTTP/")) => {
            ProbeResult::Open {
                latency_ms: start.elapsed().as_millis(),
            }
        }
        Ok(n) if n > 0 => ProbeResult::Open {
            latency_ms: start.elapsed().as_millis(),
        },
        Ok(_) => classify_reset(start.elapsed().as_millis()),
        Err(ref e)
            if e.kind() == std::io::ErrorKind::ConnectionReset
                || e.kind() == std::io::ErrorKind::ConnectionAborted =>
        {
            ProbeResult::Blocked {
                latency_ms: start.elapsed().as_millis(),
            }
        }
        Err(_) => ProbeResult::Filtered,
    }
}

/// Sunucu veriyi aniden kapattıysa DPI RST'i olabilir.
fn classify_reset(latency_ms: u128) -> ProbeResult {
    ProbeResult::Blocked { latency_ms }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn synthetic_hello_is_valid_record() {
        let h = synthetic_hello("example.org");
        assert_eq!(h[0], 0x16);
        assert_eq!(h[5], 0x01); // client hello
        // record length alanı toplam uzunlukla tutarlı olmalı
        let reclen = u16::from_be_bytes([h[3], h[4]]) as usize;
        assert_eq!(reclen + 5, h.len());
    }

    #[test]
    fn localhost_probe_returns_classified_result() {
        // Kapalı port: Unreachable beklenir (bağlantı reddedilir)
        let r = probe("127.0.0.1", 9, 300);
        assert!(matches!(r, ProbeResult::Unreachable(_)));
    }
}
