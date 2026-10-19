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

pub fn is_bogon_or_poisoned(ip: &IpAddr) -> bool {
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
            if v4.is_unspecified() || v4.is_broadcast() || v4.is_loopback() { return true; }
            false
        }
        IpAddr::V6(v6) => {
            if v6.is_unspecified() || v6.is_loopback() { return true; }
            let s = v6.segments();
            if s[0] == 0x2a00 && s[1] == 0x1368 { return true; }
            false
        }
    }
}

/// RFC 7766: DNS over TCP ile tekil sunucudan senkronize A kaydı çözer.
fn query_dns_tcp_sync(host: &str, server: SocketAddr) -> Result<IpAddr, Box<dyn std::error::Error>> {
    let timeout = Duration::from_millis(2000);
    let mut stream = TcpStream::connect_timeout(&server, timeout)?;
    stream.set_read_timeout(Some(timeout)).ok();
    stream.set_write_timeout(Some(timeout)).ok();
    stream.set_nodelay(true).ok();

    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        crate::proxy::protect_raw_fd(stream.as_raw_fd());
    }

    let mut query = Vec::with_capacity(64);
    // Header: ID=0x1337, RD=1, QDCOUNT=1
    query.extend_from_slice(&[0x13, 0x37, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    for label in host.split('.') {
        if label.is_empty() || label.len() > 63 {
            return Err("invalid label".into());
        }
        query.push(label.len() as u8);
        query.extend_from_slice(label.as_bytes());
    }
    query.push(0x00);
    query.extend_from_slice(&[0x00, 0x01, 0x00, 0x01]); // Type A, Class IN

    let q_len = (query.len() as u16).to_be_bytes();
    stream.write_all(&q_len)?;
    std::thread::sleep(Duration::from_millis(2));
    stream.write_all(&query)?;
    stream.flush()?;

    let mut len_buf = [0u8; 2];
    stream.read_exact(&mut len_buf)?;
    let resp_len = u16::from_be_bytes(len_buf) as usize;
    if resp_len < 12 || resp_len > 4096 {
        return Err("invalid len".into());
    }

    let mut buf = vec![0u8; resp_len];
    stream.read_exact(&mut buf)?;

    let ancount = u16::from_be_bytes([buf[6], buf[7]]);
    if ancount == 0 {
        return Err("no answer".into());
    }

    let mut idx = 12;
    while idx < resp_len && buf[idx] != 0 {
        if (buf[idx] & 0xc0) == 0xc0 {
            idx += 2;
            break;
        }
        idx += 1 + buf[idx] as usize;
    }
    if idx < resp_len && buf[idx] == 0 {
        idx += 1;
    }
    idx += 4; // qtype + qclass

    for _ in 0..ancount {
        if idx + 10 > resp_len {
            break;
        }
        if (buf[idx] & 0xc0) == 0xc0 {
            idx += 2;
        } else {
            while idx < resp_len && buf[idx] != 0 {
                idx += 1 + buf[idx] as usize;
            }
            if idx < resp_len && buf[idx] == 0 {
                idx += 1;
            }
        }
        if idx + 10 > resp_len {
            break;
        }
        let rtype = u16::from_be_bytes([buf[idx], buf[idx + 1]]);
        let rdlength = u16::from_be_bytes([buf[idx + 8], buf[idx + 9]]) as usize;
        idx += 10;
        if rtype == 1 && rdlength == 4 && idx + 4 <= resp_len {
            let ip = Ipv4Addr::new(buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]);
            let ip_addr = IpAddr::V4(ip);
            if !is_bogon_or_poisoned(&ip_addr) {
                return Ok(ip_addr);
            }
        }
        idx += rdlength;
    }

    Err("no valid ip".into())
}

/// Cloudflare (1.1.1.1) ve Google (8.8.8.8) üzerinden güvenli TCP DNS çözümleme dener.
fn resolve_via_tcp_dns_sync(host: &str) -> Option<IpAddr> {
    for server_ip in &[Ipv4Addr::new(1, 1, 1, 1), Ipv4Addr::new(8, 8, 8, 8), Ipv4Addr::new(1, 0, 0, 1)] {
        if let Ok(ip) = query_dns_tcp_sync(host, SocketAddr::new(IpAddr::V4(*server_ip), 53)) {
            return Some(ip);
        }
    }
    None
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

    // Sistem DNS zehirlendiyse (0.0.0.0 / ISP block) veya boşsa: Güvenli TCP DNS ile çöz
    if let Some(ip) = resolve_via_tcp_dns_sync(host) {
        return Ok(SocketAddr::new(ip, port));
    }

    // DNS zehirlenmesi veya yerel çözümlenememe durumunda meşru sunucu IP yedekleri
    match host.trim().to_lowercase().as_str() {
        "discord.com" | "www.discord.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(162, 159, 135, 232)), port)),
        "gateway.discord.gg" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(162, 159, 135, 234)), port)),
        "roblox.com" | "www.roblox.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(128, 116, 102, 3)), port)),
        "wattpad.com" | "www.wattpad.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(3, 160, 57, 67)), port)),
        "instagram.com" | "www.instagram.com" => Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::new(157, 240, 245, 174)), port)),
        _ => Err(format!("DNS: {host} için geçerli IP çözümlenemedi (DNS zehirlenmesi olabilir)")),
    }
}

/// Sentetik, protokol-uyumlu ve modern TLS 1.2/1.3 sunucularıyla el sıkışabilen ClientHello üretir.
fn synthetic_hello(sni: &str) -> Vec<u8> {
    let mut ch = Vec::new();
    ch.extend_from_slice(&[0x03, 0x03]); // legacy version TLS1.2
    ch.extend_from_slice(&[0xAB; 32]); // 32 byte random
    ch.push(0x20); // 32-byte session id length (TLS 1.3 middlebox compatibility mode)
    ch.extend_from_slice(&[0xCD; 32]);

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

    // 5. Supported Versions (0x002b: TLS 1.3, TLS 1.2)
    let versions: [u8; 5] = [
        0x04,       // length: 4 bytes
        0x03, 0x04, // TLS 1.3
        0x03, 0x03, // TLS 1.2
    ];
    exts.extend_from_slice(&0x002bu16.to_be_bytes());
    exts.extend_from_slice(&(versions.len() as u16).to_be_bytes());
    exts.extend_from_slice(&versions);

    // 6. Key Share (0x0033: x25519 32-byte public key share)
    let mut ks_ext = Vec::with_capacity(38);
    ks_ext.extend_from_slice(&36u16.to_be_bytes()); // client_shares length
    ks_ext.extend_from_slice(&0x001du16.to_be_bytes()); // group: x25519
    ks_ext.extend_from_slice(&32u16.to_be_bytes()); // key_exchange length
    ks_ext.extend_from_slice(&[0x09; 32]); // valid non-zero x25519 basepoint
    exts.extend_from_slice(&0x0033u16.to_be_bytes());
    exts.extend_from_slice(&(ks_ext.len() as u16).to_be_bytes());
    exts.extend_from_slice(&ks_ext);

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
                    let mut cuts = vec![off];
                    if hello.len() > 2 {
                        cuts.push(2);
                    }
                    if let Some(info) = crate::tls::parse_client_hello(&hello) {
                        if info.sni_offset > 9 && info.sni_offset - 9 < hello.len() {
                            cuts.push(info.sni_offset - 9);
                        }
                        let mid = info.sni_offset + info.sni_len / 2;
                        if mid > 2 && mid < hello.len() {
                            cuts.push(mid);
                        }
                    }
                    cuts.retain(|&p| p > 0 && p < hello.len());
                    cuts.sort_unstable();
                    cuts.dedup();
                    if !cuts.is_empty() {
                        multi_cuts = Some(cuts);
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

/// Yerel SOCKS5 proxy (örn: 127.0.0.1:10808) üzerinden hedefe TLS ClientHello göndererek DPI bypass başarısını ölçer.
pub fn probe_via_socks5(host: &str, port: u16, socks5_addr: &str, timeout_ms: u64) -> ProbeResult {
    let start = std::time::Instant::now();
    let timeout = Duration::from_millis(timeout_ms);

    let Ok(mut stream) = TcpStream::connect_timeout(
        &socks5_addr.to_socket_addrs().ok().and_then(|mut a| a.next()).unwrap_or_else(|| {
            SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 10808)
        }),
        timeout,
    ) else {
        return ProbeResult::Unreachable(format!("socks5 connect: {socks5_addr}"));
    };

    stream.set_read_timeout(Some(timeout)).ok();
    stream.set_write_timeout(Some(timeout)).ok();
    stream.set_nodelay(true).ok();

    // 1. SOCKS5 Greeting (VER=5, NMETHODS=1, NO_AUTH=0)
    if stream.write_all(&[0x05, 0x01, 0x00]).is_err() {
        return ProbeResult::Unreachable("socks5 greeting failed".into());
    }
    let mut greeting_resp = [0u8; 2];
    if stream.read_exact(&mut greeting_resp).is_err() || greeting_resp != [0x05, 0x00] {
        return ProbeResult::Unreachable("socks5 auth rejected".into());
    }

    // 2. SOCKS5 CONNECT (CMD=0x01, ATYP=0x03 DOMAIN)
    let host_bytes = host.as_bytes();
    let mut req = Vec::with_capacity(7 + host_bytes.len());
    req.extend_from_slice(&[0x05, 0x01, 0x00, 0x03]);
    req.push(host_bytes.len() as u8);
    req.extend_from_slice(host_bytes);
    req.extend_from_slice(&port.to_be_bytes());

    if stream.write_all(&req).is_err() {
        return ProbeResult::Unreachable("socks5 connect request failed".into());
    }

    let mut connect_resp = [0u8; 4];
    if stream.read_exact(&mut connect_resp).is_err() || connect_resp[1] != 0x00 {
        return classify_reset(start.elapsed().as_millis());
    }

    // Kalan BND.ADDR ve BND.PORT baytlarını oku
    let atyp = connect_resp[3];
    let to_skip = match atyp {
        0x01 => 4 + 2, // IPv4 (4) + Port (2)
        0x04 => 16 + 2, // IPv6 (16) + Port (2)
        0x03 => {
            let mut len_b = [0u8; 1];
            if stream.read_exact(&mut len_b).is_err() {
                return ProbeResult::Unreachable("socks5 bind read failed".into());
            }
            len_b[0] as usize + 2
        }
        _ => 6,
    };
    let mut skip_buf = vec![0u8; to_skip];
    let _ = stream.read_exact(&mut skip_buf);

    // 3. Tünel üzerinden sentetik TLS ClientHello gönder
    let hello = synthetic_hello(host);
    if stream.write_all(&hello).is_err() || stream.flush().is_err() {
        return classify_reset(start.elapsed().as_millis());
    }

    // 4. Sunucudan yanıt bekle (ServerHello 0x16 veya HTTP 200/301/400 vb.)
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

    #[test]
    #[ignore]
    fn live_probe_with_steps_bypasses_dpi() {
        let steps = crate::profile::find_profile("universal").unwrap().steps;
        for host in ["discord.com", "roblox.com", "wattpad.com"] {
            let res = probe_with_steps(host, 443, &steps, 3500);
            println!("LIVE PROBE {host} -> {res:?}");
            assert!(
                matches!(res, ProbeResult::Open { .. }),
                "Expected Open for {host}, got {res:?}"
            );
        }
    }
}
