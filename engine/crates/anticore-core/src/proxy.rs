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

type SocketProtectorFn = Box<dyn Fn(i32) -> bool + Send + Sync>;
static SOCKET_PROTECTOR: std::sync::OnceLock<SocketProtectorFn> = std::sync::OnceLock::new();

/// Android VpnService soket koruma kancasını kaydeder.
pub fn set_socket_protector<F>(f: F)
where
    F: Fn(i32) -> bool + Send + Sync + 'static,
{
    let _ = SOCKET_PROTECTOR.set(Box::new(f));
}

/// Dış ağ soketlerini VPN tünel döngüsünden muaf tutar (VpnService.protect).
pub fn protect_raw_fd(fd: i32) -> bool {
    if let Some(protector) = SOCKET_PROTECTOR.get() {
        protector(fd)
    } else {
        true
    }
}

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
    pub steps: Vec<crate::strategy::Step>,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            bind_addr: SocketAddr::from(([0, 0, 0, 0], DEFAULT_PROXY_PORT)),
            lan_ip: "127.0.0.1".into(),
            steps: Vec::new(),
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
        let steps = Arc::new(self.config.steps.clone());

        tokio::spawn(async move {
            let mut rx = shutdown_rx;
            loop {
                tokio::select! {
                    accept_res = listener.accept() => {
                        match accept_res {
                            Ok((stream, client_addr)) => {
                                let stats = stats.clone();
                                let lan_ip = lan_ip.clone();
                                let steps = steps.clone();
                                tokio::spawn(async move {
                                    handle_client(stream, client_addr, stats, lan_ip, port, steps).await;
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
    steps: Arc<Vec<crate::strategy::Step>>,
) {
    let client_ip = client_addr.ip();
    stats.active_connections.fetch_add(1, Ordering::Relaxed);
    stats.total_connections.fetch_add(1, Ordering::Relaxed);
    stats.on_client_connect(client_ip);

    let res = handle_client_inner(&mut stream, &stats, &lan_ip, proxy_port, client_ip, steps).await;
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
    steps: Arc<Vec<crate::strategy::Step>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut peek_buf = [0u8; 8];
    let n = stream.peek(&mut peek_buf).await?;
    if n == 0 {
        return Ok(());
    }

    if peek_buf[0] == 0x05 {
        // SOCKS5 Protokolü
        handle_socks5(stream, stats, client_ip, steps).await
    } else {
        // HTTP / HTTP CONNECT / PAC / Status / Plain HTTP isteği
        handle_http(stream, stats, lan_ip, proxy_port, client_ip, steps).await
    }
}

/// Güvenli soket bağlantı kurucu: soketi oluşturur, Android'de protect çağırır ve hedefe bağlanır.
async fn connect_to_addr(addr: SocketAddr) -> Result<TcpStream, std::io::Error> {
    let socket = match addr {
        SocketAddr::V4(_) => tokio::net::TcpSocket::new_v4()?,
        SocketAddr::V6(_) => tokio::net::TcpSocket::new_v6()?,
    };

    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        let fd = socket.as_raw_fd();
        protect_raw_fd(fd);
    }

    socket.connect(addr).await
}

/// Hedefe bağlanırken yerel sistem DNS zehirlemesine (0.0.0.0 vb.) karşı güvenli genel DNS yedekli bağlantı kurucu.
async fn connect_target(host: &str, port: u16) -> Result<TcpStream, Box<dyn std::error::Error + Send + Sync>> {
    // 1. IP ise doğrudan bağlan
    if let Ok(ip) = host.parse::<IpAddr>() {
        return Ok(connect_to_addr(SocketAddr::new(ip, port)).await?);
    }

    // 2. Sistem DNS çözümlemesini dene
    if let Ok(mut addrs) = tokio::net::lookup_host((host, port)).await {
        if let Some(addr) = addrs.next() {
            let ip = addr.ip();
            if !ip.is_unspecified() && !ip.is_loopback() {
                if let Ok(stream) = connect_to_addr(addr).await {
                    return Ok(stream);
                }
            }
        }
    }

    // 3. Sistem DNS başarısız veya 0.0.0.0 zehirlenmesi varsa: Güvenli genel DNS (1.1.1.1 / 8.8.8.8) sorgula
    if let Some(resolved_ip) = resolve_via_public_dns(host).await {
        if let Ok(stream) = connect_to_addr(SocketAddr::new(resolved_ip, port)).await {
            return Ok(stream);
        }
    }

    // 4. Son deneme
    if let Ok(mut addrs) = tokio::net::lookup_host(format!("{host}:{port}")).await {
        if let Some(addr) = addrs.next() {
            return Ok(connect_to_addr(addr).await?);
        }
    }

    Err(format!("Hedefe bağlanılamadı ({host}:{port})").into())
}

/// RFC 7766: DNS over TCP ile tekil sunucuya güvenli sorgu gönderir.
/// Android'de soket koruması (protect_raw_fd) ve 2 parçalı mikro-gecikmeli segmentasyon uygular.
pub async fn query_dns_tcp_raw(
    query: &[u8],
    server: SocketAddr,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let timeout = tokio::time::Duration::from_millis(2500);
    tokio::time::timeout(timeout, async {
        let mut stream = connect_to_addr(server).await?;
        stream.set_nodelay(true)?;

        let q_len = query.len() as u16;
        let len_bytes = q_len.to_be_bytes();

        // 2 bayt uzunluk öneki + 2ms mikro gecikme + ham payload (DPI imza kırıcı)
        stream.write_all(&len_bytes).await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(2)).await;
        stream.write_all(query).await?;
        stream.flush().await?;

        // 2 bayt yanıt uzunluğu
        let resp_len = stream.read_u16().await? as usize;
        if resp_len < 12 || resp_len > 65535 {
            return Err("Geçersiz DNS yanıt uzunluğu".into());
        }

        let mut resp = vec![0u8; resp_len];
        stream.read_exact(&mut resp).await?;
        Ok(resp)
    })
    .await?
}

/// Gelen ham DNS sorgusunu (UDP 53) TCP üzerinden Cloudflare (1.1.1.1) veya Google (8.8.8.8) sunucularına iletir.
/// Operatörlerin UDP 53 transparent proxy / zehirleme filtrelerini tamamen atlatır.
pub async fn resolve_raw_dns_query_tcp(query: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let servers = [
        SocketAddr::new(IpAddr::V4(std::net::Ipv4Addr::new(1, 1, 1, 1)), 53),
        SocketAddr::new(IpAddr::V4(std::net::Ipv4Addr::new(8, 8, 8, 8)), 53),
        SocketAddr::new(IpAddr::V4(std::net::Ipv4Addr::new(1, 0, 0, 1)), 53),
    ];

    for &server in &servers {
        if let Ok(resp) = query_dns_tcp_raw(query, server).await {
            if resp.len() >= 12 {
                return Ok(resp);
            }
        }
    }

    Err("Tüm güvenli TCP DNS sunucuları başarısız oldu".into())
}

fn build_dns_a_query(host: &str) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let mut query = Vec::with_capacity(64);
    // Header: ID=0x1337, Flags=RD (0x0100), QDCOUNT=1
    query.extend_from_slice(&[0x13, 0x37, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    for label in host.split('.') {
        if label.is_empty() || label.len() > 63 {
            return Err("Geçersiz alan adı parçası".into());
        }
        query.push(label.len() as u8);
        query.extend_from_slice(label.as_bytes());
    }
    query.push(0x00);
    query.extend_from_slice(&[0x00, 0x01, 0x00, 0x01]); // A, IN
    Ok(query)
}

fn parse_dns_a_response(buf: &[u8]) -> Result<IpAddr, Box<dyn std::error::Error + Send + Sync>> {
    let n = buf.len();
    if n < 12 {
        return Err("DNS yanıtı çok kısa".into());
    }

    let ancount = u16::from_be_bytes([buf[6], buf[7]]);
    if ancount == 0 {
        return Err("DNS yanıtında adres yok".into());
    }

    let mut idx = 12;
    while idx < n && buf[idx] != 0 {
        if (buf[idx] & 0xc0) == 0xc0 {
            idx += 2;
            break;
        }
        idx += 1 + buf[idx] as usize;
    }
    if idx < n && buf[idx] == 0 {
        idx += 1;
    }
    idx += 4;

    for _ in 0..ancount {
        if idx + 10 > n {
            break;
        }
        if (buf[idx] & 0xc0) == 0xc0 {
            idx += 2;
        } else {
            while idx < n && buf[idx] != 0 {
                idx += 1 + buf[idx] as usize;
            }
            if idx < n && buf[idx] == 0 {
                idx += 1;
            }
        }
        if idx + 10 > n {
            break;
        }
        let rtype = u16::from_be_bytes([buf[idx], buf[idx + 1]]);
        let rdlength = u16::from_be_bytes([buf[idx + 8], buf[idx + 9]]) as usize;
        idx += 10;
        if rtype == 1 && rdlength == 4 && idx + 4 <= n {
            let ip = std::net::Ipv4Addr::new(buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]);
            let ip_addr = IpAddr::V4(ip);
            if !ip.is_unspecified() && !ip.is_loopback() && !crate::tester::is_bogon_or_poisoned(&ip_addr) {
                return Ok(ip_addr);
            }
        }
        idx += rdlength;
    }

    Err("Geçerli ve zehirlenmemiş IPv4 adresi bulunamadı".into())
}

/// Cloudflare (1.1.1.1) veya Google (8.8.8.8) güvenli TCP DNS üzerinden A kaydı çözümleyici
async fn resolve_via_public_dns(host: &str) -> Option<IpAddr> {
    if let Ok(query) = build_dns_a_query(host) {
        if let Ok(resp) = resolve_raw_dns_query_tcp(&query).await {
            if let Ok(ip) = parse_dns_a_response(&resp) {
                return Some(ip);
            }
        }
    }

    // UDP Fallback
    for server in &["1.1.1.1:53", "8.8.8.8:53", "1.0.0.1:53"] {
        if let Ok(ip) = query_dns_udp(host, server).await {
            return Some(ip);
        }
    }
    None
}

async fn query_dns_udp(host: &str, dns_server: &str) -> Result<IpAddr, Box<dyn std::error::Error + Send + Sync>> {
    let mut query = Vec::with_capacity(64);
    query.extend_from_slice(&[0x13, 0x37, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    for label in host.split('.') {
        if label.is_empty() || label.len() > 63 {
            return Err("Geçersiz alan adı parçası".into());
        }
        query.push(label.len() as u8);
        query.extend_from_slice(label.as_bytes());
    }
    query.push(0x00);
    query.extend_from_slice(&[0x00, 0x01, 0x00, 0x01]);

    let socket = tokio::net::UdpSocket::bind("0.0.0.0:0").await?;
    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        protect_raw_fd(socket.as_raw_fd());
    }
    socket.connect(dns_server).await?;
    socket.send(&query).await?;

    let mut buf = [0u8; 512];
    let n = tokio::time::timeout(tokio::time::Duration::from_millis(1500), socket.recv(&mut buf)).await??;
    if n < 12 {
        return Err("DNS yanıtı çok kısa".into());
    }

    parse_dns_a_response(&buf[..n])
}

/// RFC 1928 SOCKS5 El Sıkışması ve Tünelleme
async fn handle_socks5(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    client_ip: IpAddr,
    steps: Arc<Vec<crate::strategy::Step>>,
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

    if req_ver != 0x05 {
        return Err("Geçersiz SOCKS sürümü".into());
    }

    if cmd == 0x03 {
        // UDP ASSOCIATE (RFC 1928) - Android DNS ve UDP trafiği için
        match atyp {
            0x01 => {
                let mut ip = [0u8; 4];
                stream.read_exact(&mut ip).await?;
                let _port = stream.read_u16().await?;
            }
            0x04 => {
                let mut ip = [0u8; 16];
                stream.read_exact(&mut ip).await?;
                let _port = stream.read_u16().await?;
            }
            0x03 => {
                let len = stream.read_u8().await? as usize;
                let mut domain = vec![0u8; len];
                stream.read_exact(&mut domain).await?;
                let _port = stream.read_u16().await?;
            }
            _ => return Err("Geçersiz SOCKS5 adres tipi".into()),
        }

        return handle_socks5_udp(stream, stats, client_ip).await;
    }

    if cmd != 0x01 {
        // Yalnızca TCP CONNECT (0x01) ve UDP ASSOCIATE (0x03) desteklenir
        stream.write_all(&[0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await?;
        return Err("Yalnızca TCP CONNECT ve UDP ASSOCIATE desteklenir".into());
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

    // Hedef sunucuya güvenli DNS ve yerel sistem üzerinden bağlan
    let outbound = match connect_target(&target_host, target_port).await {
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
    tunnel_bidirectional(stream, outbound, stats, client_ip, steps).await
}

/// RFC 1928 SOCKS5 UDP ASSOCIATE Rölesi (Android TUN DNS ve UDP trafiği için)
async fn handle_socks5_udp(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    client_ip: IpAddr,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. İstemcinin (hevtunnel) UDP paketlerini göndereceği yerel dinleme soketi
    let local_udp = tokio::net::UdpSocket::bind("127.0.0.1:0").await?;
    let bound_port = local_udp.local_addr()?.port();

    // 2. Dış internete doğrudan çıkacak soket (Anticore muafiyeti sayesinde gerçek ağa gider)
    let outbound_udp = tokio::net::UdpSocket::bind("0.0.0.0:0").await?;
    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        protect_raw_fd(outbound_udp.as_raw_fd());
    }

    // 3. İstemciye BND.ADDR=127.0.0.1 ve BND.PORT bilgisini başarıyla (0x00) dön
    let mut resp = vec![0x05, 0x00, 0x00, 0x01, 127, 0, 0, 1];
    resp.extend_from_slice(&bound_port.to_be_bytes());
    stream.write_all(&resp).await?;

    stats.on_client_target(client_ip, "udp:associate");

    let local_udp = Arc::new(local_udp);
    let outbound_udp = Arc::new(outbound_udp);
    let client_addr_slot: Arc<Mutex<Option<SocketAddr>>> = Arc::new(Mutex::new(None));

    let l2o_local = local_udp.clone();
    let l2o_outbound = outbound_udp.clone();
    let l2o_slot = client_addr_slot.clone();
    let stats_l2o = stats.clone();

    // Görev A: İstemciden (hevtunnel) gelen UDP paketlerini dış hedefe aktar
    let client_to_remote = async move {
        let mut buf = vec![0u8; 65535];
        loop {
            let (n, src) = match l2o_local.recv_from(&mut buf).await {
                Ok(res) => res,
                Err(_) => break,
            };
            if let Ok(mut lock) = l2o_slot.lock() {
                *lock = Some(src);
            }

            if n < 10 {
                continue;
            }

            // RFC 1928 UDP Paket Başlığı:
            // +----+------+------+----------+----------+----------+
            // |RSV | FRAG | ATYP | DST.ADDR | DST.PORT |   DATA   |
            // +----+------+------+----------+----------+----------+
            // | 2  |  1   |  1   | Variable |    2     | Variable |
            let atyp = buf[3];
            let (target_addr, data_offset) = match atyp {
                0x01 => {
                    if n < 10 { continue; }
                    let ip = std::net::Ipv4Addr::new(buf[4], buf[5], buf[6], buf[7]);
                    let port = u16::from_be_bytes([buf[8], buf[9]]);
                    (SocketAddr::new(IpAddr::V4(ip), port), 10)
                }
                0x04 => {
                    if n < 22 { continue; }
                    let mut ip_bytes = [0u8; 16];
                    ip_bytes.copy_from_slice(&buf[4..20]);
                    let ip = std::net::Ipv6Addr::from(ip_bytes);
                    let port = u16::from_be_bytes([buf[20], buf[21]]);
                    (SocketAddr::new(IpAddr::V6(ip), port), 22)
                }
                0x03 => {
                    let len = buf[4] as usize;
                    if n < 7 + len { continue; }
                    let domain = String::from_utf8_lossy(&buf[5..5 + len]);
                    let port = u16::from_be_bytes([buf[5 + len], buf[6 + len]]);
                    if let Ok(mut addrs) = tokio::net::lookup_host(format!("{domain}:{port}")).await {
                        if let Some(addr) = addrs.next() {
                            (addr, 7 + len)
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                }
                _ => continue,
            };

            let payload = &buf[data_offset..n];

            // DNS sorguları (Port 53) için ISP UDP 53 zehirleme/engellemesini tamamen aşan güvenli TCP yönlendirmesi
            if target_addr.port() == 53 {
                let l2o_local = l2o_local.clone();
                let l2o_outbound = l2o_outbound.clone();
                let stats_l2o = stats_l2o.clone();
                let payload_vec = payload.to_vec();
                tokio::spawn(async move {
                    if let Ok(resp_bytes) = resolve_raw_dns_query_tcp(&payload_vec).await {
                        let mut out_pkt = Vec::with_capacity(32 + resp_bytes.len());
                        out_pkt.extend_from_slice(&[0x00, 0x00, 0x00]); // RSV (2) + FRAG (1)
                        match target_addr {
                            SocketAddr::V4(v4) => {
                                out_pkt.push(0x01); // ATYP IPv4
                                out_pkt.extend_from_slice(&v4.ip().octets());
                                out_pkt.extend_from_slice(&v4.port().to_be_bytes());
                            }
                            SocketAddr::V6(v6) => {
                                out_pkt.push(0x04); // ATYP IPv6
                                out_pkt.extend_from_slice(&v6.ip().octets());
                                out_pkt.extend_from_slice(&v6.port().to_be_bytes());
                            }
                        }
                        out_pkt.extend_from_slice(&resp_bytes);
                        let _ = l2o_local.send_to(&out_pkt, src).await;
                        stats_l2o.bytes_transferred.fetch_add((payload_vec.len() + resp_bytes.len()) as u64, Ordering::Relaxed);
                        stats_l2o.on_client_bytes(client_ip, (payload_vec.len() + resp_bytes.len()) as u64);
                    } else {
                        // TCP DNS başarısız olursa düz UDP ile dış hedefe gönder
                        let _ = l2o_outbound.send_to(&payload_vec, target_addr).await;
                    }
                });
                continue;
            }

            if l2o_outbound.send_to(payload, target_addr).await.is_ok() {
                stats_l2o.bytes_transferred.fetch_add(payload.len() as u64, Ordering::Relaxed);
                stats_l2o.on_client_bytes(client_ip, payload.len() as u64);
            }
        }
    };

    // Görev B: Dış hedeften gelen yanıtları RFC 1928 başlığıyla istemciye geri aktar
    let o2l_local = local_udp.clone();
    let o2l_outbound = outbound_udp.clone();
    let o2l_slot = client_addr_slot.clone();
    let stats_o2l = stats.clone();

    let remote_to_client = async move {
        let mut in_buf = vec![0u8; 65535];
        let mut out_pkt = Vec::with_capacity(65535);

        loop {
            let (n, remote_src) = match o2l_outbound.recv_from(&mut in_buf).await {
                Ok(res) => res,
                Err(_) => break,
            };

            let client_dest = {
                let lock = o2l_slot.lock().ok();
                lock.and_then(|l| *l)
            };

            if let Some(dest) = client_dest {
                out_pkt.clear();
                out_pkt.extend_from_slice(&[0x00, 0x00, 0x00]); // RSV (2) + FRAG (1)
                match remote_src {
                    SocketAddr::V4(v4) => {
                        out_pkt.push(0x01); // ATYP IPv4
                        out_pkt.extend_from_slice(&v4.ip().octets());
                        out_pkt.extend_from_slice(&v4.port().to_be_bytes());
                    }
                    SocketAddr::V6(v6) => {
                        out_pkt.push(0x04); // ATYP IPv6
                        out_pkt.extend_from_slice(&v6.ip().octets());
                        out_pkt.extend_from_slice(&v6.port().to_be_bytes());
                    }
                }
                out_pkt.extend_from_slice(&in_buf[..n]);

                if o2l_local.send_to(&out_pkt, dest).await.is_ok() {
                    stats_o2l.bytes_transferred.fetch_add(n as u64, Ordering::Relaxed);
                    stats_o2l.on_client_bytes(client_ip, n as u64);
                }
            }
        }
    };

    // Görev C: TCP kontrol kanalı bağlantısı koptuğunda (EOF veya hata) UDP tünelini sonlandır
    let wait_disconnect = async {
        let mut b = [0u8; 64];
        loop {
            match stream.read(&mut b).await {
                Ok(0) | Err(_) => break,
                Ok(_) => continue,
            }
        }
    };

    tokio::select! {
        _ = client_to_remote => {},
        _ = remote_to_client => {},
        _ = wait_disconnect => {},
    }

    Ok(())
}

/// HTTP CONNECT Tünelleme, PAC Sunumu, Doğrulama/Durum Sayfası ve Düz HTTP Proxy
async fn handle_http(
    stream: &mut TcpStream,
    stats: &Arc<ProxyStats>,
    lan_ip: &str,
    proxy_port: u16,
    client_ip: IpAddr,
    steps: Arc<Vec<crate::strategy::Step>>,
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

        // Hedefe yerel makineden güvenli DNS yedekli bağlan
        let outbound = match connect_target(host, port).await {
            Ok(s) => s,
            Err(_) => {
                stream.write_all(b"HTTP/1.1 502 Bad Gateway\r\n\r\n").await?;
                return Err("Hedefe bağlanılamadı".into());
            }
        };

        // 200 Connection Established yanıtı ver
        stream.write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n").await?;

        stats.on_client_target(client_ip, &format!("{host}:{port}"));

        tunnel_bidirectional(stream, outbound, stats, client_ip, steps).await
    } else if parts.len() >= 2 {
        // 4. Düz HTTP Proxy (GET http://example.com/path veya GET /path ile Host: example.com)
        // iOS ve Android captive portal / internet erişim kontrolü (generate_204, hotspot-detect) düz HTTP kullanır.
        let method = parts[0];
        let uri = parts[1];
        let version = parts.get(2).copied().unwrap_or("HTTP/1.1");

        let (target_host, target_port, path_part) = if let Some(after) = uri.strip_prefix("http://") {
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

        // Hedefe yerel makineden güvenli DNS yedekli bağlan
        let mut outbound = match connect_target(&target_host, target_port).await {
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

        tunnel_bidirectional(stream, outbound, stats, client_ip, steps).await
    } else {
        stream.write_all(b"HTTP/1.1 400 Bad Request\r\n\r\n").await?;
        Ok(())
    }
}

/// İstemci ile hedef sunucu arasında iki yönlü şeffaf veri transferi ve DPI bypass koruması.
async fn tunnel_bidirectional(
    client: &mut TcpStream,
    mut outbound: TcpStream,
    stats: &Arc<ProxyStats>,
    client_ip: IpAddr,
    steps: Arc<Vec<crate::strategy::Step>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let _ = outbound.set_nodelay(true);
    let (mut c_read, mut c_write) = client.split();
    let (mut o_read, mut o_write) = outbound.split();

    let stats_c = stats.clone();
    let steps_c = steps.clone();
    let c_to_o = async {
        let mut buf = vec![0u8; 16384];
        let mut total = 0u64;
        let mut first_packet = true;

        loop {
            let n = c_read.read(&mut buf).await?;
            if n == 0 {
                break;
            }

            if first_packet {
                first_packet = false;
                let payload = &buf[..n];

                // 1) TLS ClientHello parçalama (DPI SNI sansürünü aşma)
                if let Some(info) = crate::tls::parse_client_hello(payload) {
                    let mut cuts = Vec::with_capacity(4);

                    // A) Profil adımlarından kesim noktalarını topla
                    let mut custom_cuts = false;
                    for step in steps_c.iter() {
                        match step {
                            crate::strategy::Step::MultiSplit { positions } => {
                                for &pos in positions {
                                    if pos > 0 && pos < payload.len() {
                                        cuts.push(pos);
                                    }
                                }
                                custom_cuts = true;
                            }
                            crate::strategy::Step::FragmentTls { mode } => {
                                if let Some(off) = crate::tls::find_split_offset(payload, mode) {
                                    if off > 0 && off < payload.len() {
                                        cuts.push(off);
                                    }
                                }
                                custom_cuts = true;
                            }
                            _ => {}
                        }
                    }

                    // B) Varsayılan / Evrensel kalkan: Türkiye mobil ve sabit hatları için Tri-Split (2 bayt + SNI ortası)
                    if !custom_cuts || cuts.is_empty() {
                        cuts.push(2);
                        let mid = info.sni_offset + (info.sni_len / 2);
                        if mid > 2 && mid < payload.len() {
                            cuts.push(mid);
                        }
                    } else if !cuts.contains(&2) && payload.len() > 2 {
                        cuts.push(2);
                    }

                    cuts.sort_unstable();
                    cuts.dedup();

                    let mut prev = 0;
                    for &cut in &cuts {
                        if cut > prev && cut <= payload.len() {
                            o_write.write_all(&payload[prev..cut]).await?;
                            let _ = o_write.flush().await;
                            tokio::time::sleep(tokio::time::Duration::from_millis(3)).await;
                            prev = cut;
                        }
                    }
                    if prev < payload.len() {
                        o_write.write_all(&payload[prev..]).await?;
                        let _ = o_write.flush().await;
                    }
                } else if let Some(http_info) = crate::tls::parse_http_host(payload) {
                    // 2) HTTP Host başlığını parçalama
                    let split_pt = (http_info.host_offset + http_info.host_len / 2).min(n - 1).max(1);
                    o_write.write_all(&payload[..split_pt]).await?;
                    let _ = o_write.flush().await;
                    tokio::time::sleep(tokio::time::Duration::from_millis(3)).await;
                    o_write.write_all(&payload[split_pt..]).await?;
                    let _ = o_write.flush().await;
                } else {
                    o_write.write_all(payload).await?;
                }
            } else {
                o_write.write_all(&buf[..n]).await?;
            }

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
            steps: Vec::new(),
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
            steps: Vec::new(),
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
            steps: Vec::new(),
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
            steps: Vec::new(),
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

    #[tokio::test]
    async fn test_socks5_udp_associate() {
        let config = ProxyConfig {
            bind_addr: SocketAddr::from(([127, 0, 0, 1], 0)),
            lan_ip: "127.0.0.1".into(),
            steps: Vec::new(),
        };
        let mut proxy = LanProxy::new(config);
        proxy.start().await.expect("Proxy başlatılmalı");
        let port = proxy.bound_port().expect("Port atanmalı");

        let mut client = TcpStream::connect(("127.0.0.1", port)).await.expect("Bağlanabilmeli");
        // 1. SOCKS5 greeting
        client.write_all(&[0x05, 0x01, 0x00]).await.unwrap();
        let mut reply = [0u8; 2];
        client.read_exact(&mut reply).await.unwrap();
        assert_eq!(reply, [0x05, 0x00]);

        // 2. SOCKS5 UDP ASSOCIATE request: CMD=0x03, ATYP=0x01, 0.0.0.0:0
        client.write_all(&[0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0]).await.unwrap();
        let mut resp = [0u8; 10];
        client.read_exact(&mut resp).await.unwrap();
        assert_eq!(resp[0], 0x05); // VER=5
        assert_eq!(resp[1], 0x00); // SUCCESS
        assert_eq!(resp[3], 0x01); // ATYP IPv4
        let bnd_port = u16::from_be_bytes([resp[8], resp[9]]);
        assert!(bnd_port > 0);

        proxy.stop();
    }

    #[test]
    fn test_build_and_parse_dns_query() {
        let q = build_dns_a_query("example.com").expect("Sorgu oluşturulmalı");
        assert!(q.len() >= 12);
        assert_eq!(&q[0..2], &[0x13, 0x37]); // ID

        // Sentetik gecerli DNS yaniti (A kaydi)
        let mut resp = Vec::new();
        resp.extend_from_slice(&[0x13, 0x37, 0x81, 0x80, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]);
        // Question
        resp.extend_from_slice(&[0x07, b'e', b'x', b'a', b'm', b'p', b'l', b'e', 0x03, b'c', b'o', b'm', 0x00]);
        resp.extend_from_slice(&[0x00, 0x01, 0x00, 0x01]);
        // Answer (pointer 0xc00c, type A, class IN, ttl 300, rdlen 4)
        resp.extend_from_slice(&[0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x01, 0x2c, 0x00, 0x04]);
        resp.extend_from_slice(&[192, 0, 2, 1]);

        let parsed = parse_dns_a_response(&resp).expect("A kaydi cozulmeli");
        assert_eq!(parsed, IpAddr::V4(std::net::Ipv4Addr::new(192, 0, 2, 1)));

        // Zehirli yanıt testi (0.0.0.0 reddedilmeli)
        let mut poisoned_resp = resp.clone();
        let len = poisoned_resp.len();
        poisoned_resp[len - 4..].copy_from_slice(&[0, 0, 0, 0]);
        assert!(parse_dns_a_response(&poisoned_resp).is_err());
    }
}
