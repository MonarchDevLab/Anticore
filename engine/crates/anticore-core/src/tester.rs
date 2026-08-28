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
use std::net::{TcpStream, ToSocketAddrs};
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

/// Sentetik, protokol-uyumlu ama sahte SNI'lı ClientHello üretir.
fn synthetic_hello(sni: &str) -> Vec<u8> {
    let mut ch = Vec::new();
    ch.extend_from_slice(&[0x03, 0x03]); // legacy version TLS1.2
    ch.extend_from_slice(&[0xAB; 32]); // random
    ch.push(0x00); // session id
    ch.extend_from_slice(&[0x00, 0x02, 0x13, 0x01]); // cipher: TLS_AES_128_GCM_SHA256
    ch.push(0x01);
    ch.push(0x00); // compression null

    let sni_bytes = sni.as_bytes();
    let mut sni_ext = Vec::new();
    sni_ext.extend_from_slice(&((sni_bytes.len() + 3) as u16).to_be_bytes());
    sni_ext.push(0x00);
    sni_ext.extend_from_slice(&(sni_bytes.len() as u16).to_be_bytes());
    sni_ext.extend_from_slice(sni_bytes);

    let mut exts = Vec::new();
    exts.extend_from_slice(&0x0000u16.to_be_bytes()); // server_name
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

/// Hedefe probe atar. `timeout_ms`: bağlantı + yanıt penceresi.
pub fn probe(host: &str, port: u16, timeout_ms: u64) -> ProbeResult {
    let addr_iter = match (host, port).to_socket_addrs() {
        Ok(it) => it,
        Err(e) => return ProbeResult::Unreachable(format!("DNS: {e}")),
    };
    let Some(addr) = addr_iter.into_iter().next() else {
        return ProbeResult::Unreachable("DNS: adres çözülemedi".into());
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
        Ok(n) if n > 0 && buf[0] == 0x16 => ProbeResult::Open {
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
    let addr_iter = match (host, port).to_socket_addrs() {
        Ok(it) => it,
        Err(e) => return ProbeResult::Unreachable(format!("DNS: {e}")),
    };
    let Some(addr) = addr_iter.into_iter().next() else {
        return ProbeResult::Unreachable("DNS: adres çözülemedi".into());
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
        Ok(n) if n > 0 && buf[0] == 0x16 => ProbeResult::Open {
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
