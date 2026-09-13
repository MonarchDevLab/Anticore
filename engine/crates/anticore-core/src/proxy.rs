//! Yerel Ağ Cihaz Paylaşım Proxy Sunucusu (SOCKS5 & HTTP CONNECT & PAC).
//!
//! Ağdaki mobil cihazlar (iOS/Android) ve diğer bilgisayarlar, yerel
//! Wi-Fi proxy ayarlarıyla bu sunucuya bağlanarak Anticore'un DPI
//! korumasından şeffaf bir şekilde yararlanabilir.

use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::watch;

/// Varsayılan LAN Proxy dinleme portu.
pub const DEFAULT_PROXY_PORT: u16 = 10808;

/// Bağlı istemci için anlık metrik özeti.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub struct ClientStatsSnapshot {
    pub ip: String,
    pub active_streams: usize,
    pub total_requests: u64,
    pub bytes_transferred: u64,
    pub last_seen_epoch_secs: u64,
    pub last_target: Option<String>,
}

#[derive(Debug, Default)]
struct ClientTracker {
    active_streams: usize,
    total_requests: u64,
    bytes_transferred: u64,
    last_seen_epoch_secs: u64,
    last_target: Option<String>,
}

/// Canlı proxy sunucu istatistikleri.
#[derive(Debug, Default)]
pub struct ProxyStats {
    pub active_connections: AtomicUsize,
    pub total_connections: AtomicU64,
    pub bytes_transferred: AtomicU64,
    clients: Mutex<HashMap<IpAddr, ClientTracker>>,
}

impl ProxyStats {
    pub fn snapshot(&self) -> ProxyStatsSnapshot {
        let clients = if let Ok(lock) = self.clients.lock() {
            let mut list: Vec<ClientStatsSnapshot> = lock
                .iter()
                .map(|(ip, t)| ClientStatsSnapshot {
                    ip: ip.to_string(),
                    active_streams: t.active_streams,
                    total_requests: t.total_requests,
                    bytes_transferred: t.bytes_transferred,
                    last_seen_epoch_secs: t.last_seen_epoch_secs,
                    last_target: t.last_target.clone(),
                })
                .collect();
            list.sort_by(|a, b| {
                b.active_streams
                    .cmp(&a.active_streams)
                    .then_with(|| b.last_seen_epoch_secs.cmp(&a.last_seen_epoch_secs))
            });
            list
        } else {
            Vec::new()
        };

        ProxyStatsSnapshot {
            active_connections: self.active_connections.load(Ordering::Relaxed),
            total_connections: self.total_connections.load(Ordering::Relaxed),
            bytes_transferred: self.bytes_transferred.load(Ordering::Relaxed),
            clients,
        }
    }

    pub fn on_client_connect(&self, ip: IpAddr) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        if let Ok(mut lock) = self.clients.lock() {
            let entry = lock.entry(ip).or_default();
            entry.active_streams += 1;
            entry.total_requests += 1;
            entry.last_seen_epoch_secs = now;
        }
    }

    pub fn on_client_disconnect(&self, ip: IpAddr) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        if let Ok(mut lock) = self.clients.lock() {
            if let Some(entry) = lock.get_mut(&ip) {
                entry.active_streams = entry.active_streams.saturating_sub(1);
                entry.last_seen_epoch_secs = now;
            }
        }
    }

    pub fn on_client_bytes(&self, ip: IpAddr, bytes: u64) {
        if let Ok(mut lock) = self.clients.lock() {
            if let Some(entry) = lock.get_mut(&ip) {
                entry.bytes_transferred += bytes;
            }
        }
    }

    pub fn on_client_target(&self, ip: IpAddr, target: &str) {
        if let Ok(mut lock) = self.clients.lock() {
            if let Some(entry) = lock.get_mut(&ip) {
                entry.last_target = Some(target.to_string());
            }
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub struct ProxyStatsSnapshot {
    pub active_connections: usize,
    pub total_connections: u64,
    pub bytes_transferred: u64,
    #[serde(default)]
    pub clients: Vec<ClientStatsSnapshot>,
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

/// Gelen istemci bağlantısını protokolüne göre otomatik ayrıştırır (SOCKS5, HTTP CONNECT, PAC, Status, Plain HTTP).
async fn handle_client(
    mut stream: TcpStream,
    client_addr: SocketAddr,
    stats: Arc<ProxyStats>,
    lan_ip: String,
    proxy_port: u16,
) {
    let client_ip = client_addr.ip();
    stats.active_connections.fetch_add(1, Ordering::Relaxed);
    stats.total_connections.fetch_add(1, Ordering::Relaxed);
    stats.on_client_connect(client_ip);

    let res = handle_client_inner(&mut stream, &stats, &lan_ip, proxy_port, client_ip).await;
    let _ = res;

    stats.on_client_disconnect(client_ip);
    stats.active_connections.fetch_sub(1, Ordering::Relaxed);
}

async fn handle_client_inner(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    lan_ip: &str,
    proxy_port: u16,
    client_ip: IpAddr,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut peek_buf = [0u8; 8];
    let n = stream.peek(&mut peek_buf).await?;
    if n == 0 {
        return Ok(());
    }

    if peek_buf[0] == 0x05 {
        // SOCKS5 Protokolü
        handle_socks5(stream, stats, client_ip).await
    } else {
        // HTTP / HTTP CONNECT / PAC / Status / Plain HTTP isteği
        handle_http(stream, stats, lan_ip, proxy_port, client_ip).await
    }
}

/// RFC 1928 SOCKS5 El Sıkışması ve Tünelleme
async fn handle_socks5(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    client_ip: IpAddr,
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

    // Hedef sunucuya yerel sistem üzerinden bağlan
    let outbound = match tokio::net::TcpStream::connect((target_host.as_str(), target_port)).await {
        Ok(s) => s,
        Err(_) => {
            stream.write_all(&[0x05, 0x05, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await?;
            return Err("Hedefe bağlanılamadı".into());
        }
    };

    // Bağlantı başarılı yanıtı ver (0x00)
    stream.write_all(&[0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await?;

    stats.on_client_target(client_ip, &format!("{target_host}:{target_port}"));

    // İki yönlü boru (bidirectional copy)
    tunnel_bidirectional(stream, outbound, stats, client_ip).await
}

/// HTTP CONNECT Tünelleme, PAC Sunumu, Doğrulama/Durum Sayfası ve Düz HTTP Proxy
async fn handle_http(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    lan_ip: &str,
    proxy_port: u16,
    client_ip: IpAddr,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut buf = vec![0u8; 8192];
    let n = stream.read(&mut buf).await?;
    if n == 0 {
        return Ok(());
    }

    let req_str = String::from_utf8_lossy(&buf[..n]);
    let first_line = req_str.lines().next().unwrap_or_default();
    let parts: Vec<&str> = first_line.split_whitespace().collect();

    // 1. PAC (Proxy Auto-Config) sorgusu kontrolü
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

    // 2. Canlı Doğrulama / Test Sayfası (Mobil cihaz veya tarayıcıdan http://ip:port veya /status açıldığında)
    if parts.len() >= 2
        && (parts[1] == "/" || parts[1] == "/status" || parts[1] == "/anticore-status")
        && (parts[0] == "GET" || parts[0] == "HEAD")
    {
        let html = format!(
            r#"<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Anticore LAN Proxy</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090b0e; color: #e1e7ec; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }}
    .card {{ background: #12171e; border: 1px solid #202b38; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }}
    .badge {{ display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 6px 16px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }}
    .dot {{ width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; }}
    h1 {{ font-size: 20px; margin: 0 0 10px; color: #ffffff; }}
    p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }}
    .info-box {{ background: #0b0f14; border: 1px solid #1a232f; border-radius: 10px; padding: 14px; text-align: left; font-family: monospace; font-size: 13px; color: #cbd5e1; margin-bottom: 20px; }}
    .info-row {{ display: flex; justify-content: space-between; margin-bottom: 6px; }}
    .info-row:last-child {{ margin-bottom: 0; }}
    .info-label {{ color: #64748b; }}
    .footer {{ font-size: 11px; color: #475569; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> PROXY AKTİF &amp; BAĞLI</div>
    <h1>Anticore Ağ Paylaşımı</h1>
    <p>Bu cihaz Anticore DPI korumalı yerel ağ proxy sunucusuna başarıyla bağlandı. İnternet trafiğiniz yerel motor üzerinden filtrelenerek korunmaktadır.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">İstemci IP:</span> <span>{client_ip}</span></div>
      <div class="info-row"><span class="info-label">Proxy Sunucu:</span> <span>{lan_ip}:{proxy_port}</span></div>
      <div class="info-row"><span class="info-label">Protokol:</span> <span>HTTP / HTTPS / SOCKS5</span></div>
      <div class="info-row"><span class="info-label">Durum:</span> <span style="color:#10b981;">Devrede (200 OK)</span></div>
    </div>
    <div class="footer">Anticore Network Security Engine &copy; Monolith Works</div>
  </div>
</body>
</html>"#
        );
        let resp = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            html.len(),
            html
        );
        stream.write_all(resp.as_bytes()).await?;
        return Ok(());
    }

    // 3. HTTP CONNECT yöntemi (HTTPS tünelleri için standart)
    if first_line.starts_with("CONNECT ") {
        if parts.len() < 2 {
            return Err("Bozuk CONNECT satırı".into());
        }
        let target = parts[1];
        let (host, port) = if let Some((h, p)) = target.split_once(':') {
            (h, p.parse::<u16>().unwrap_or(443))
        } else {
            (target, 443)
        };

        // Hedefe yerel makineden bağlan
        let outbound = match tokio::net::TcpStream::connect((host, port)).await {
            Ok(s) => s,
            Err(_) => {
                stream.write_all(b"HTTP/1.1 502 Bad Gateway\r\n\r\n").await?;
                return Err("Hedefe bağlanılamadı".into());
            }
        };

        // 200 Connection Established yanıtı ver
        stream.write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n").await?;

        stats.on_client_target(client_ip, &format!("{host}:{port}"));

        tunnel_bidirectional(stream, outbound, stats, client_ip).await
    } else if parts.len() >= 2 {
        // 4. Düz HTTP Proxy (GET http://example.com/path veya GET /path ile Host: example.com)
        // iOS ve Android captive portal / internet erişim kontrolü (generate_204, hotspot-detect) düz HTTP kullanır.
        let method = parts[0];
        let uri = parts[1];
        let version = parts.get(2).copied().unwrap_or("HTTP/1.1");

        let (target_host, target_port, path_part) = if uri.starts_with("http://") {
            let after = &uri["http://".len()..];
            let (hp, p) = match after.split_once('/') {
                Some((h, path)) => (h, format!("/{path}")),
                None => (after, "/".to_string()),
            };
            let (h, p_num) = if let Some((host_str, port_str)) = hp.split_once(':') {
                (host_str.to_string(), port_str.parse::<u16>().unwrap_or(80))
            } else {
                (hp.to_string(), 80)
            };
            (h, p_num, p)
        } else {
            // Bağıl URI: Host başlığını bul
            let mut host_header: Option<String> = None;
            for line in req_str.lines().skip(1) {
                if line.is_empty() || line == "\r" {
                    break;
                }
                if let Some((k, v)) = line.split_once(':') {
                    if k.trim().eq_ignore_ascii_case("host") {
                        host_header = Some(v.trim().to_string());
                        break;
                    }
                }
            }

            let Some(hh) = host_header else {
                stream.write_all(b"HTTP/1.1 400 Bad Request\r\n\r\nHost header required").await?;
                return Err("Düz HTTP isteğinde Host başlığı bulunamadı".into());
            };

            let (h, p_num) = if let Some((host_str, port_str)) = hh.split_once(':') {
                (host_str.to_string(), port_str.parse::<u16>().unwrap_or(80))
            } else {
                (hh, 80)
            };
            (h, p_num, uri.to_string())
        };

        // Hedefe yerel makineden bağlan
        let mut outbound = match tokio::net::TcpStream::connect((target_host.as_str(), target_port)).await {
            Ok(s) => s,
            Err(_) => {
                stream.write_all(b"HTTP/1.1 502 Bad Gateway\r\n\r\n").await?;
                return Err("Hedefe bağlanılamadı".into());
            }
        };

        stats.on_client_target(client_ip, &format!("{target_host}:{target_port}"));

        // İstek satırını origin-form (bağıl /path) formatına çevir ve kalan başlıklarla birlikte gönder
        let mut first_line_end = 0;
        if let Some(pos) = req_str.find("\r\n") {
            first_line_end = pos + 2;
        } else if let Some(pos) = req_str.find('\n') {
            first_line_end = pos + 1;
        }

        if first_line_end > 0 && first_line_end <= n {
            let rewritten_first_line = format!("{method} {path_part} {version}\r\n");
            outbound.write_all(rewritten_first_line.as_bytes()).await?;
            outbound.write_all(&buf[first_line_end..n]).await?;
        } else {
            outbound.write_all(&buf[..n]).await?;
        }

        tunnel_bidirectional(stream, outbound, stats, client_ip).await
    } else {
        stream.write_all(b"HTTP/1.1 400 Bad Request\r\n\r\n").await?;
        Ok(())
    }
}

/// İstemci ile hedef sunucu arasında iki yönlü şeffaf veri transferi.
async fn tunnel_bidirectional(
    client: &mut TcpStream,
    mut outbound: TcpStream,
    stats: &Arc<ProxyStats>,
    client_ip: IpAddr,
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
            stats_c.on_client_bytes(client_ip, n as u64);
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
            stats_o.on_client_bytes(client_ip, n as u64);
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
    async fn test_status_page_fetch() {
        let config = ProxyConfig {
            bind_addr: SocketAddr::from(([127, 0, 0, 1], 0)),
            lan_ip: "192.168.1.50".into(),
        };
        let mut proxy = LanProxy::new(config);
        proxy.start().await.expect("Proxy başlatılmalı");
        let port = proxy.bound_port().expect("Port atanmalı");

        let mut client = TcpStream::connect(("127.0.0.1", port)).await.expect("Bağlanabilmeli");
        client.write_all(b"GET /status HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n").await.unwrap();

        let mut resp = vec![0u8; 2048];
        let n = client.read(&mut resp).await.unwrap();
        let resp_str = String::from_utf8_lossy(&resp[..n]);

        assert!(resp_str.contains("HTTP/1.1 200 OK"));
        assert!(resp_str.contains("Anticore Ağ Paylaşımı"));
        assert!(resp_str.contains("PROXY AKTİF"));

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

    #[tokio::test]
    async fn test_client_stats_tracking() {
        let stats = Arc::new(ProxyStats::default());
        let client_ip = "192.168.1.100".parse::<IpAddr>().unwrap();

        stats.on_client_connect(client_ip);
        stats.on_client_target(client_ip, "discord.com:443");
        stats.on_client_bytes(client_ip, 4096);

        let snap = stats.snapshot();
        assert_eq!(snap.clients.len(), 1);
        assert_eq!(snap.clients[0].ip, "192.168.1.100");
        assert_eq!(snap.clients[0].active_streams, 1);
        assert_eq!(snap.clients[0].total_requests, 1);
        assert_eq!(snap.clients[0].bytes_transferred, 4096);
        assert_eq!(snap.clients[0].last_target.as_deref(), Some("discord.com:443"));

        stats.on_client_disconnect(client_ip);
        let snap2 = stats.snapshot();
        assert_eq!(snap2.clients[0].active_streams, 0);
    }

    #[tokio::test]
    async fn test_plain_http_proxy_get() {
        // 1. Mock upstream HTTP sunucusu
        let upstream = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let upstream_port = upstream.local_addr().unwrap().port();

        tokio::spawn(async move {
            if let Ok((mut s, _)) = upstream.accept().await {
                let mut buf = [0u8; 1024];
                let _ = s.read(&mut buf).await;
                let body = "HELLO_ANTICORE";
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = s.write_all(resp.as_bytes()).await;
            }
        });

        // 2. Proxy başlat
        let config = ProxyConfig {
            bind_addr: SocketAddr::from(([127, 0, 0, 1], 0)),
            lan_ip: "127.0.0.1".into(),
        };
        let mut proxy = LanProxy::new(config);
        proxy.start().await.expect("Proxy başlatılmalı");
        let proxy_port = proxy.bound_port().expect("Port atanmalı");

        // 3. İstemci üzerinden proxy'ye istek at
        let mut client = TcpStream::connect(("127.0.0.1", proxy_port)).await.expect("Bağlanabilmeli");
        let req = format!(
            "GET http://127.0.0.1:{upstream_port}/test.txt HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\n\r\n"
        );
        client.write_all(req.as_bytes()).await.unwrap();

        let mut resp = vec![0u8; 1024];
        let n = client.read(&mut resp).await.unwrap();
        let resp_str = String::from_utf8_lossy(&resp[..n]);

        assert!(resp_str.contains("HTTP/1.1 200 OK"));
        assert!(resp_str.contains("HELLO_ANTICORE"));

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
        assert!(snap.clients.is_empty());
    }
}
