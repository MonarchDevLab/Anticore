//! Yerel Ağ Cihaz Paylaşım Proxy Sunucusu (SOCKS5 & HTTP CONNECT & PAC).
//!
//! Ağdaki mobil cihazlar (iOS/Android) ve diğer bilgisayarlar, yerel
//! Wi-Fi proxy ayarlarıyla bu sunucuya bağlanarak Anticore'un DPI
//! korumasından şeffaf bir şekilde yararlanabilir.

use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::watch;

/// Varsayılan LAN Proxy dinleme portu.
pub const DEFAULT_PROXY_PORT: u16 = 10808;

/// Canlı proxy sunucu istatistikleri.
#[derive(Debug, Default)]
pub struct ProxyStats {
    pub active_connections: AtomicUsize,
    pub total_connections: AtomicU64,
    pub bytes_transferred: AtomicU64,
}

impl ProxyStats {
    pub fn snapshot(&self) -> ProxyStatsSnapshot {
        ProxyStatsSnapshot {
            active_connections: self.active_connections.load(Ordering::Relaxed),
            total_connections: self.total_connections.load(Ordering::Relaxed),
            bytes_transferred: self.bytes_transferred.load(Ordering::Relaxed),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProxyStatsSnapshot {
    pub active_connections: usize,
    pub total_connections: u64,
    pub bytes_transferred: u64,
}

/// Proxy çalıştırma seçenekleri.
#[derive(Debug, Clone)]
pub struct ProxyConfig {
    pub bind_addr: SocketAddr,
    pub lan_ip: String,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            bind_addr: SocketAddr::from(([0, 0, 0, 0], DEFAULT_PROXY_PORT)),
            lan_ip: "127.0.0.1".into(),
        }
    }
}

/// Proxy sunucusu ana yöneticisi.
pub struct LanProxy {
    config: ProxyConfig,
    stats: Arc<ProxyStats>,
    shutdown_tx: Option<watch::Sender<bool>>,
    bound_port: Option<u16>,
}

impl LanProxy {
    pub fn new(config: ProxyConfig) -> Self {
        Self {
            config,
            stats: Arc::new(ProxyStats::default()),
            shutdown_tx: None,
            bound_port: None,
        }
    }

    pub fn stats(&self) -> Arc<ProxyStats> {
        self.stats.clone()
    }

    pub fn bound_port(&self) -> Option<u16> {
        self.bound_port
    }

    /// Proxy sunucusunu arka planda başlatır.
    pub async fn start(&mut self) -> Result<(), String> {
        let listener = TcpListener::bind(self.config.bind_addr)
            .await
            .map_err(|e| format!("Proxy soketi bağlanamadı ({}): {e}", self.config.bind_addr))?;

        let actual_port = listener
            .local_addr()
            .map(|a| a.port())
            .unwrap_or_else(|_| self.config.bind_addr.port());
        self.bound_port = Some(actual_port);

        let (shutdown_tx, shutdown_rx) = watch::channel(false);
        self.shutdown_tx = Some(shutdown_tx);

        let stats = self.stats.clone();
        let lan_ip = self.config.lan_ip.clone();
        let port = actual_port;

        tokio::spawn(async move {
            let mut rx = shutdown_rx;
            loop {
                tokio::select! {
                    accept_res = listener.accept() => {
                        match accept_res {
                            Ok((stream, client_addr)) => {
                                let stats = stats.clone();
                                let lan_ip = lan_ip.clone();
                                tokio::spawn(async move {
                                    handle_client(stream, client_addr, stats, lan_ip, port).await;
                                });
                            }
                            Err(_) => break,
                        }
                    }
                    _ = rx.changed() => {
                        if *rx.borrow() {
                            break;
                        }
                    }
                }
            }
        });

        Ok(())
    }

    /// Proxy sunucusunu durdurur.
    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(true);
        }
    }
}

/// Gelen istemci bağlantısını protokolüne göre otomatik ayrıştırır (SOCKS5, HTTP CONNECT, PAC GET).
async fn handle_client(
    mut stream: TcpStream,
    _client_addr: SocketAddr,
    stats: Arc<ProxyStats>,
    lan_ip: String,
    proxy_port: u16,
) {
    stats.active_connections.fetch_add(1, Ordering::Relaxed);
    stats.total_connections.fetch_add(1, Ordering::Relaxed);

    let res = handle_client_inner(&mut stream, &stats, &lan_ip, proxy_port).await;
    let _ = res;

    stats.active_connections.fetch_sub(1, Ordering::Relaxed);
}

async fn handle_client_inner(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    lan_ip: &str,
    proxy_port: u16,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut peek_buf = [0u8; 8];
    let n = stream.peek(&mut peek_buf).await?;
    if n == 0 {
        return Ok(());
    }

    if peek_buf[0] == 0x05 {
        // SOCKS5 Protokolü
        handle_socks5(stream, stats).await
    } else {
        // HTTP / HTTP CONNECT / PAC isteği
        handle_http(stream, stats, lan_ip, proxy_port).await
    }
}

/// RFC 1928 SOCKS5 El Sıkışması ve Tünelleme
async fn handle_socks5(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. Kimlik doğrulama yöntemi anlaşması
    let ver = stream.read_u8().await?;
    if ver != 0x05 {
        return Err("Geçersiz SOCKS sürümü".into());
    }
    let nmethods = stream.read_u8().await?;
    let mut methods = vec![0u8; nmethods as usize];
    stream.read_exact(&mut methods).await?;

    // Parolasız / NO_AUTH (0x00) yanıtı
    stream.write_all(&[0x05, 0x00]).await?;

    // 2. İstek paketi (VER, CMD, RSV, ATYP, DST.ADDR, DST.PORT)
    let req_ver = stream.read_u8().await?;
    let cmd = stream.read_u8().await?;
    let _rsv = stream.read_u8().await?;
    let atyp = stream.read_u8().await?;

    if req_ver != 0x05 || cmd != 0x01 {
        // Yalnızca TCP CONNECT (0x01) desteklenir
        stream.write_all(&[0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await?;
        return Err("Yalnızca TCP CONNECT desteklenir".into());
    }

    let target_host = match atyp {
        0x01 => {
            // IPv4 (4 bayt)
            let mut ip = [0u8; 4];
            stream.read_exact(&mut ip).await?;
            std::net::Ipv4Addr::from(ip).to_string()
        }
        0x03 => {
            // Domain adı (uzunluk + string)
            let len = stream.read_u8().await? as usize;
            let mut domain = vec![0u8; len];
            stream.read_exact(&mut domain).await?;
            String::from_utf8_lossy(&domain).to_string()
        }
        0x04 => {
            // IPv6 (16 bayt)
            let mut ip = [0u8; 16];
            stream.read_exact(&mut ip).await?;
            std::net::Ipv6Addr::from(ip).to_string()
        }
        _ => return Err("Geçersiz SOCKS5 adres tipi".into()),
    };

    let target_port = stream.read_u16().await?;

    // Hedef sunucuya yerel sistem üzerinden bağlan (WinDivert paket motoru bu soketi yakalayacak)
    let outbound = match tokio::net::TcpStream::connect((target_host.as_str(), target_port)).await {
        Ok(s) => s,
        Err(_) => {
            stream.write_all(&[0x05, 0x05, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await?;
            return Err("Hedefe bağlanılamadı".into());
        }
    };

    // Bağlantı başarılı yanıtı ver (0x00)
    stream.write_all(&[0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await?;

    // İki yönlü boru (bidirectional copy)
    tunnel_bidirectional(stream, outbound, stats).await
}

/// HTTP CONNECT Tünelleme ve PAC Sunumu
async fn handle_http(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    lan_ip: &str,
    proxy_port: u16,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut buf = vec![0u8; 4096];
    let n = stream.read(&mut buf).await?;
    if n == 0 {
        return Ok(());
    }

    let req_str = String::from_utf8_lossy(&buf[..n]);
    let first_line = req_str.lines().next().unwrap_or_default();

    // PAC (Proxy Auto-Config) sorgusu kontrolü
    if first_line.starts_with("GET /anticore.pac") || first_line.starts_with("GET /pac") {
        let pac_content = format!(
            "function FindProxyForURL(url, host) {{\n  return \"PROXY {lan_ip}:{proxy_port}; DIRECT\";\n}}\n"
        );
        let resp = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/x-ns-proxy-autoconfig\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            pac_content.len(),
            pac_content
        );
        stream.write_all(resp.as_bytes()).await?;
        return Ok(());
    }

    // HTTP CONNECT yöntemi (HTTPS tünelleri için standart)
    if first_line.starts_with("CONNECT ") {
        let parts: Vec<&str> = first_line.split_whitespace().collect();
        if parts.len() < 2 {
            return Err("Bozuk CONNECT satırı".into());
        }
        let target = parts[1];
        let (host, port) = if let Some((h, p)) = target.split_once(':') {
            (h, p.parse::<u16>().unwrap_or(443))
        } else {
            (target, 443)
        };

        // Hedefe yerel makineden bağlan (WinDivert paket motoru bu trafiği de yakalar)
        let outbound = match tokio::net::TcpStream::connect((host, port)).await {
            Ok(s) => s,
            Err(_) => {
                stream.write_all(b"HTTP/1.1 502 Bad Gateway\r\n\r\n").await?;
                return Err("Hedefe bağlanılamadı".into());
            }
        };

        // 200 Connection Established yanıtı
        stream.write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n").await?;

        tunnel_bidirectional(stream, outbound, stats).await
    } else {
        // Düz HTTP GET/POST Proxy
        stream.write_all(b"HTTP/1.1 405 Method Not Allowed\r\n\r\n").await?;
        Ok(())
    }
}

/// İstemci ile hedef sunucu arasında iki yönlü şeffaf veri transferi.
async fn tunnel_bidirectional(
    client: &mut TcpStream,
    mut outbound: TcpStream,
    stats: &Arc<ProxyStats>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (mut c_read, mut c_write) = client.split();
    let (mut o_read, mut o_write) = outbound.split();

    let stats_c = stats.clone();
    let c_to_o = async {
        let mut buf = vec![0u8; 16384];
        let mut total = 0u64;
        loop {
            let n = c_read.read(&mut buf).await?;
            if n == 0 {
                break;
            }
            o_write.write_all(&buf[..n]).await?;
            total += n as u64;
            stats_c.bytes_transferred.fetch_add(n as u64, Ordering::Relaxed);
        }
        o_write.shutdown().await?;
        Ok::<u64, std::io::Error>(total)
    };

    let stats_o = stats.clone();
    let o_to_c = async {
        let mut buf = vec![0u8; 16384];
        let mut total = 0u64;
        loop {
            let n = o_read.read(&mut buf).await?;
            if n == 0 {
                break;
            }
            c_write.write_all(&buf[..n]).await?;
            total += n as u64;
            stats_o.bytes_transferred.fetch_add(n as u64, Ordering::Relaxed);
        }
        c_write.shutdown().await?;
        Ok::<u64, std::io::Error>(total)
    };

    let _ = tokio::join!(c_to_o, o_to_c);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pac_fetch() {
        let config = ProxyConfig {
            bind_addr: SocketAddr::from(([127, 0, 0, 1], 0)),
            lan_ip: "192.168.1.50".into(),
        };
        let mut proxy = LanProxy::new(config);
        proxy.start().await.expect("Proxy başlatılmalı");
        let port = proxy.bound_port().expect("Port atanmalı");

        let mut client = TcpStream::connect(("127.0.0.1", port)).await.expect("Bağlanabilmeli");
        client.write_all(b"GET /anticore.pac HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n").await.unwrap();

        let mut resp = vec![0u8; 1024];
        let n = client.read(&mut resp).await.unwrap();
        let resp_str = String::from_utf8_lossy(&resp[..n]);

        assert!(resp_str.contains("HTTP/1.1 200 OK"));
        assert!(resp_str.contains("application/x-ns-proxy-autoconfig"));
        assert!(resp_str.contains("PROXY 192.168.1.50:"));

        proxy.stop();
    }

    #[tokio::test]
    async fn test_socks5_handshake() {
        let config = ProxyConfig {
            bind_addr: SocketAddr::from(([127, 0, 0, 1], 0)),
            lan_ip: "127.0.0.1".into(),
        };
        let mut proxy = LanProxy::new(config);
        proxy.start().await.expect("Proxy başlatılmalı");
        let port = proxy.bound_port().expect("Port atanmalı");

        let mut client = TcpStream::connect(("127.0.0.1", port)).await.expect("Bağlanabilmeli");
        // SOCKS5 greeting: VER=0x05, NMETHODS=1, METHOD=0x00 (NO AUTH)
        client.write_all(&[0x05, 0x01, 0x00]).await.unwrap();

        let mut reply = [0u8; 2];
        client.read_exact(&mut reply).await.unwrap();
        assert_eq!(reply, [0x05, 0x00]); // VER=5, METHOD=0 (ACCEPTED)

        proxy.stop();
    }

    #[test]
    fn test_proxy_stats_snapshot() {
        let stats = ProxyStats::default();
        stats.active_connections.store(3, Ordering::Relaxed);
        stats.total_connections.store(42, Ordering::Relaxed);
        stats.bytes_transferred.store(1048576, Ordering::Relaxed);

        let snap = stats.snapshot();
        assert_eq!(snap.active_connections, 3);
        assert_eq!(snap.total_connections, 42);
        assert_eq!(snap.bytes_transferred, 1048576);
    }
}
