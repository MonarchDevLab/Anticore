//! Yerel Ağ Cihaz Paylaşımı (LAN Proxy & Hotspot Ağ Geçidi).
//!
//! Aynı Wi-Fi'daki telefon, tablet ve diğer cihazlar için SOCKS5/HTTP/PAC proxy
//! yönetimi, Windows Mobil Etkin Nokta transit yönlendirme denetimleri,
//! fiziksel MAC adresi çözümleme ve bağlı cihaz tespiti.

use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use anticore_core::proxy::{LanProxy, ProxyConfig, DEFAULT_PROXY_PORT};
use crate::commands::{load_engine_config, save_engine_config_internal, silent_command};

/// Bağlı istemci cihaz bilgisi ve ağ metrikleri.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct ConnectedClientDto {
    pub ip: String,
    pub mac: Option<String>,
    pub vendor: String,
    pub device_type: String, // "mobile" | "pc" | "console" | "unknown"
    pub active_streams: usize,
    pub total_requests: u64,
    pub bytes_transferred: u64,
    pub last_seen_secs_ago: u64,
    pub last_target: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct LanInfoDto {
    pub local_ip: String,
    pub proxy_port: u16,
    pub proxy_running: bool,
    pub hotspot_mode_enabled: bool,
    pub active_connections: usize,
    pub total_connections: u64,
    pub bytes_transferred: u64,
    pub pac_url: String,
    pub firewall_allowed: bool,
    pub connected_devices: Vec<ConnectedClientDto>,
}

pub struct LanProxyState {
    pub proxy: Mutex<Option<LanProxy>>,
    pub port: Mutex<u16>,
}

impl LanProxyState {
    pub fn new() -> Self {
        Self {
            proxy: Mutex::new(None),
            port: Mutex::new(DEFAULT_PROXY_PORT),
        }
    }
}

impl Default for LanProxyState {
    fn default() -> Self {
        Self::new()
    }
}

/// Bilgisayarın yerel ağdaki birincil IPv4 adresini (192.168.x.x vb.) tespit eder.
pub fn get_local_ipv4() -> Option<String> {
    if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                let ip = addr.ip();
                if !ip.is_loopback() && !ip.is_unspecified() {
                    return Some(ip.to_string());
                }
            }
        }
    }

    #[cfg(windows)]
    {
        if let Ok(output) = silent_command("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*' | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress -First 1",
            ])
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() && s.contains('.') {
                return Some(s);
            }
        }
    }

    None
}

/// Windows platformunda yerel IP adresinin fiziksel MAC adresini SendARP / ARP tablosundan çözer.
#[cfg(windows)]
pub fn resolve_mac_address(ip_str: &str) -> Option<String> {
    if ip_str == "127.0.0.1" || ip_str == "::1" {
        return None;
    }

    if let Ok(ip) = ip_str.parse::<std::net::Ipv4Addr>() {
        #[link(name = "iphlpapi")]
        extern "system" {
            fn SendARP(
                DestIP: u32,
                SrcIP: u32,
                pMacAddr: *mut u8,
                PhyAddrLen: *mut u32,
            ) -> u32;
        }

        let mut mac = [0u8; 6];
        let mut len = 6u32;
        let dest_ip = u32::from_ne_bytes(ip.octets());
        let ret = unsafe { SendARP(dest_ip, 0, mac.as_mut_ptr(), &mut len) };
        if ret == 0 && len == 6 && mac != [0; 6] {
            return Some(format!(
                "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]
            ));
        }
    }

    // SendARP başarısızsa veya önbellek sorgusu için `arp -a` yedek denetimi
    if let Ok(output) = silent_command("arp").args(["-a", ip_str]).output() {
        let out = String::from_utf8_lossy(&output.stdout);
        for line in out.lines() {
            if line.contains(ip_str) {
                for part in line.split_whitespace() {
                    let p = part.replace('-', ":").to_uppercase();
                    if p.len() == 17 && p.chars().filter(|&c| c == ':').count() == 5 {
                        return Some(p);
                    }
                }
            }
        }
    }

    None
}

/// macOS platformunda yerel IP adresinin fiziksel MAC adresini sistem ARP tablosundan çözer.
#[cfg(target_os = "macos")]
pub fn resolve_mac_address(ip_str: &str) -> Option<String> {
    if ip_str == "127.0.0.1" || ip_str == "::1" {
        return None;
    }

    if let Ok(output) = silent_command("arp").args(["-n", ip_str]).output() {
        let out = String::from_utf8_lossy(&output.stdout);
        // Örnek: "? (192.168.1.50) at 3c:22:fb:12:34:56 on en0 ifscope [ethernet]"
        for line in out.lines() {
            if line.contains(ip_str) {
                if let Some(pos) = line.find(" at ") {
                    let rest = &line[pos + 4..];
                    let mac_raw = rest.split_whitespace().next().unwrap_or_default();
                    let parts: Vec<&str> = mac_raw.split(':').collect();
                    if parts.len() == 6 {
                        let formatted = parts
                            .iter()
                            .map(|p| format!("{:02X}", u8::from_str_radix(p, 16).unwrap_or(0)))
                            .collect::<Vec<_>>()
                            .join(":");
                        return Some(formatted);
                    }
                }
            }
        }
    }

    None
}

#[cfg(not(any(windows, target_os = "macos")))]
pub fn resolve_mac_address(_ip_str: &str) -> Option<String> {
    None
}

/// MAC adresi ve IP üzerinden cihaz türünü ve üreticiyi tespit eder.
pub fn identify_device_and_vendor(mac_opt: Option<&str>, ip_str: &str) -> (String, String) {
    if ip_str == "127.0.0.1" || ip_str == "::1" {
        return ("Yerel Bilgisayar (Loopback Test)".into(), "pc".into());
    }

    let Some(mac) = mac_opt else {
        return ("Bilinmeyen Cihaz".into(), "unknown".into());
    };

    // MAC adresinin ilk baytını ayrıştır
    let first_byte_str = mac.split(':').next().unwrap_or("00");
    let first_byte = u8::from_str_radix(first_byte_str, 16).unwrap_or(0);

    // IEEE 802 Locally Administered Address (LAA):
    // (first_byte & 0x02) != 0 ise MAC adresi cihaz tarafından rastgele/özel üretilmiştir.
    // iOS 14+ ve Android 10+ varsayılan olarak "Özel Wi-Fi Adresi" / "Rastgele MAC" kullanır.
    if (first_byte & 0x02) != 0 {
        return (
            "Özel / Rastgele MAC (iOS / Android Gizlilik Modu)".into(),
            "mobile".into(),
        );
    }

    let prefix = mac.replace(':', "").to_uppercase();
    let p6 = if prefix.len() >= 6 { &prefix[..6] } else { "" };

    match p6 {
        // Apple
        "000393" | "000502" | "000A95" | "0010FA" | "001451" | "0017F2" | "001CB3" | "001EC2"
        | "0021E9" | "002312" | "002500" | "002608" | "0026BB" | "28CFE9" | "3C22FB" | "ACBC32"
        | "F01898" | "F45C89" | "BCFE07" | "A483E7" | "703EAC" | "64A5C3" | "40A6D9" | "186590" => {
            ("Apple Inc. (iPhone / iPad / Mac)".into(), "mobile".into())
        }
        // Samsung
        "0007AB" | "001247" | "001599" | "00166B" | "0017D5" | "001A8A" | "001D25" | "002119"
        | "002454" | "002637" | "508569" | "58C38B" | "68EBAE" | "78471D" | "842519" | "88329B"
        | "90F1AA" | "A0821F" | "B0D59D" | "C4731E" | "CC07AB" | "E4E0C5" => {
            ("Samsung Electronics (Galaxy)".into(), "mobile".into())
        }
        // Xiaomi
        "00EC0A" | "18B905" | "286C07" | "3480B3" | "3C9157" | "508F4C" | "584498" | "64CC2E"
        | "7451BA" | "7802F8" | "8CBEBE" | "ACF7F3" | "D4970B" | "F48E92" => {
            ("Xiaomi Communications".into(), "mobile".into())
        }
        // Huawei
        "001882" | "001E10" | "002568" | "00259E" | "00464B" | "0C37DC" | "104780" | "20F3A3"
        | "38BC01" | "4846FB" | "7054F5" | "80B686" | "A4999B" | "D02D44" => {
            ("Huawei Technologies".into(), "mobile".into())
        }
        // Google
        "3C5AB4" | "546009" | "94EB2C" | "A47733" | "D83C69" | "F4F5DB" => {
            ("Google (Pixel / Nest)".into(), "mobile".into())
        }
        // Sony
        "00014A" | "00041F" | "0013A9" | "0015C1" | "001A80" | "001D0D" | "0024BE" | "F8461C" => {
            ("Sony Interactive (PlayStation / Xperia)".into(), "console".into())
        }
        // Nintendo
        "0009BF" | "001656" | "0017AB" | "0019FD" | "001B7A" | "001BE7" | "001F32" | "002147"
        | "00224C" | "0022AA" | "002331" | "0023CC" | "00241E" | "002444" | "0024F3" | "0025A0"
        | "002659" | "98B6E9" | "B88AEC" | "DC68EB" => {
            ("Nintendo (Switch)".into(), "console".into())
        }
        // Microsoft
        "0003FF" | "000D3A" | "00125A" | "00155D" | "0017FA" | "001D7E" | "002248" | "0025AE"
        | "281878" | "3059B7" | "501AC5" | "6045BD" | "7038EE" | "7C1E52" => {
            ("Microsoft (Xbox / Surface / PC)".into(), "pc".into())
        }
        // Intel
        "0002B3" | "000347" | "000423" | "0007E9" | "000E0C" | "001111" | "001302" | "001320"
        | "0013E8" | "001500" | "0016EA" | "0018DE" | "0019D1" | "001B21" | "001C23" | "001D09"
        | "001E64" | "001E65" | "001E67" | "00215C" | "00216A" | "0022FB" | "002314" | "002315"
        | "0024D6" | "0024D7" | "0026C6" | "0026C7" | "002713" | "00270E" => {
            ("Intel Corporation (PC / Laptop)".into(), "pc".into())
        }
        _ => ("Evrensel Ağ Cihazı".into(), "unknown".into()),
    }
}

/// Windows Defender Güvenlik Duvarı'nda LAN Proxy gelen port iznini denetler.
pub fn check_firewall_rule(port: u16) -> bool {
    #[cfg(windows)]
    {
        if let Ok(output) = silent_command("netsh")
            .args([
                "advfirewall",
                "firewall",
                "show",
                "rule",
                &format!("name=Anticore_LAN_Proxy_{port}"),
            ])
            .output()
        {
            let out = String::from_utf8_lossy(&output.stdout);
            if out.contains(&format!("{port}")) && (out.contains("Allow") || out.contains("İzin Ver")) {
                return true;
            }
        }
        // Genel kural adı denetimi
        if let Ok(output) = silent_command("netsh")
            .args(["advfirewall", "firewall", "show", "rule", "name=Anticore_LAN_Proxy"])
            .output()
        {
            let out = String::from_utf8_lossy(&output.stdout);
            if out.contains("Allow") || out.contains("İzin Ver") {
                return true;
            }
        }
        false
    }
    #[cfg(not(windows))]
    {
        let _ = port;
        true
    }
}

/// Windows Defender Güvenlik Duvarı'na otomatik gelen TCP port izin kuralı ekler.
pub fn ensure_firewall_rule(port: u16) -> Result<(), String> {
    #[cfg(windows)]
    {
        let rule_name = format!("Anticore_LAN_Proxy_{port}");
        let _ = silent_command("netsh")
            .args([
                "advfirewall",
                "firewall",
                "add",
                "rule",
                &format!("name={rule_name}"),
                "dir=in",
                "action=allow",
                "protocol=TCP",
                &format!("localport={port}"),
                "profile=any",
                "description=Anticore DPI LAN Proxy Gelen Baglanti Izni",
            ])
            .output();
    }
    #[cfg(not(windows))]
    {
        let _ = port;
    }
    Ok(())
}

/// Güvenlik duvarı iznini tek tıkla uygular.
#[tauri::command]
pub fn allow_firewall_lan_proxy(state: State<'_, LanProxyState>) -> Result<bool, String> {
    let port = *state.port.lock().map_err(|e| e.to_string())?;
    ensure_firewall_rule(port)?;
    Ok(check_firewall_rule(port))
}

/// LAN paylaşım durumu ve canlı bağlı cihaz istatistiklerini döner.
#[tauri::command]
pub fn get_lan_info(
    app: AppHandle,
    state: State<'_, LanProxyState>,
) -> Result<LanInfoDto, String> {
    let local_ip = get_local_ipv4().unwrap_or_else(|| "127.0.0.1".into());
    let lock = state.proxy.lock().map_err(|e| e.to_string())?;
    let port = *state.port.lock().map_err(|e| e.to_string())?;

    let (running, stats) = if let Some(ref p) = *lock {
        (true, p.stats().snapshot())
    } else {
        (
            false,
            anticore_core::proxy::ProxyStatsSnapshot {
                active_connections: 0,
                total_connections: 0,
                bytes_transferred: 0,
                clients: Vec::new(),
            },
        )
    };

    let ec = load_engine_config(&app);
    let pac_url = format!("http://{local_ip}:{port}/anticore.pac");
    let firewall_allowed = check_firewall_rule(port);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let mut connected_devices: Vec<ConnectedClientDto> = Vec::new();
    for c in stats.clients {
        let mac = resolve_mac_address(&c.ip);
        let (vendor, device_type) = identify_device_and_vendor(mac.as_deref(), &c.ip);
        let last_seen_secs_ago = now.saturating_sub(c.last_seen_epoch_secs);

        connected_devices.push(ConnectedClientDto {
            ip: c.ip,
            mac,
            vendor,
            device_type,
            active_streams: c.active_streams,
            total_requests: c.total_requests,
            bytes_transferred: c.bytes_transferred,
            last_seen_secs_ago,
            last_target: c.last_target,
        });
    }

    Ok(LanInfoDto {
        local_ip,
        proxy_port: port,
        proxy_running: running,
        hotspot_mode_enabled: ec.lan_share,
        active_connections: stats.active_connections,
        total_connections: stats.total_connections,
        bytes_transferred: stats.bytes_transferred,
        pac_url,
        firewall_allowed,
        connected_devices,
    })
}

/// Yerel SOCKS5 / HTTP Proxy sunucusunu başlatır ve güvenlik duvarı kuralını güvenceye alır.
#[tauri::command]
pub async fn start_lan_proxy(
    app: AppHandle,
    state: State<'_, LanProxyState>,
    port: Option<u16>,
) -> Result<LanInfoDto, String> {
    let target_port = port.unwrap_or(DEFAULT_PROXY_PORT);
    let local_ip = get_local_ipv4().unwrap_or_else(|| "127.0.0.1".into());

    let already_running = {
        let lock = state.proxy.lock().map_err(|e| e.to_string())?;
        lock.is_some()
    };

    if !already_running {
        let config = ProxyConfig {
            bind_addr: std::net::SocketAddr::from(([0, 0, 0, 0], target_port)),
            lan_ip: local_ip.clone(),
        };
        let mut proxy = LanProxy::new(config);
        proxy.start().await?;
        let bound_port = proxy.bound_port().unwrap_or(target_port);

        // Windows Defender Güvenlik Duvarı kuralını otomatik kaydet
        let _ = ensure_firewall_rule(bound_port);

        let mut lock = state.proxy.lock().map_err(|e| e.to_string())?;
        if lock.is_none() {
            *state.port.lock().map_err(|e| e.to_string())? = bound_port;
            *lock = Some(proxy);
        } else {
            proxy.stop();
        }
    }

    // Proxy açıldığında motor konfigürasyonundaki lan_share bayrağını da otomatik etkinleştir
    let mut ec = load_engine_config(&app);
    if !ec.lan_share {
        ec.lan_share = true;
        let _ = save_engine_config_internal(&app, &ec);
    }

    get_lan_info(app, state)
}

/// Yerel SOCKS5 / HTTP Proxy sunucusunu durdurur.
#[tauri::command]
pub fn stop_lan_proxy(
    app: AppHandle,
    state: State<'_, LanProxyState>,
) -> Result<LanInfoDto, String> {
    {
        let mut lock = state.proxy.lock().map_err(|e| e.to_string())?;
        if let Some(mut proxy) = lock.take() {
            proxy.stop();
        }
    }

    get_lan_info(app, state)
}

/// Mobil Etkin Nokta / Ağ Paylaşım ayarları ekranını doğrudan açar.
#[tauri::command]
pub fn open_hotspot_settings() -> Result<(), String> {
    #[cfg(windows)]
    {
        silent_command("cmd")
            .args(["/C", "start", "ms-settings:network-mobilehotspot"])
            .spawn()
            .map_err(|e| format!("Mobil Etkin Nokta ayarları açılamadı: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        silent_command("open")
            .args(["x-apple.systempreferences:com.apple.preferences.sharing"])
            .spawn()
            .map_err(|e| format!("macOS Paylaşım ayarları açılamadı: {e}"))?;
    }
    Ok(())
}

/// WinDivert motoru için Hotspot / transit ağ paket yakalama modunu açar veya kapatır.
#[tauri::command]
pub fn set_lan_share_hotspot_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut ec = load_engine_config(&app);
    ec.lan_share = enabled;
    save_engine_config_internal(&app, &ec)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lan_info_dto_serde() {
        let client = ConnectedClientDto {
            ip: "192.168.1.55".into(),
            mac: Some("3C:22:FB:11:22:33".into()),
            vendor: "Apple Inc. (iPhone / iPad / Mac)".into(),
            device_type: "mobile".into(),
            active_streams: 1,
            total_requests: 12,
            bytes_transferred: 8192,
            last_seen_secs_ago: 5,
            last_target: Some("discord.com:443".into()),
        };

        let dto = LanInfoDto {
            local_ip: "192.168.1.120".into(),
            proxy_port: 10808,
            proxy_running: true,
            hotspot_mode_enabled: true,
            active_connections: 1,
            total_connections: 15,
            bytes_transferred: 8192,
            pac_url: "http://192.168.1.120:10808/anticore.pac".into(),
            firewall_allowed: true,
            connected_devices: vec![client],
        };
        let json = serde_json::to_string(&dto).unwrap();
        let parsed: LanInfoDto = serde_json::from_str(&json).unwrap();
        assert_eq!(dto, parsed);
    }

    #[test]
    fn test_device_and_vendor_identification() {
        // 1. Loopback
        let (v1, d1) = identify_device_and_vendor(None, "127.0.0.1");
        assert_eq!(d1, "pc");
        assert!(v1.contains("Loopback"));

        // 2. Apple OUI
        let (v2, d2) = identify_device_and_vendor(Some("3C:22:FB:12:34:56"), "192.168.1.45");
        assert_eq!(d2, "mobile");
        assert!(v2.contains("Apple"));

        // 3. Private / Randomized MAC (LAA bit set in first byte, e.g. 0x02, 0x06, 0x0A, 0x0E, 0x12 ...)
        // "36:34:56:78:9A:BC" -> 0x36 has bit 1 set (0x36 & 0x02 == 0x02)
        let (v3, d3) = identify_device_and_vendor(Some("36:34:56:78:9A:BC"), "192.168.1.46");
        assert_eq!(d3, "mobile");
        assert!(v3.contains("Rastgele"));

        // 4. Sony PlayStation
        let (v4, d4) = identify_device_and_vendor(Some("00:01:4A:AA:BB:CC"), "192.168.1.99");
        assert_eq!(d4, "console");
        assert!(v4.contains("PlayStation"));
    }

    #[test]
    fn test_get_local_ipv4_returns_valid_string_if_present() {
        if let Some(ip) = get_local_ipv4() {
            assert!(!ip.is_empty());
            assert!(ip.contains('.'));
            assert_ne!(ip, "127.0.0.1");
        }
    }

    #[test]
    fn test_lan_proxy_state_initial() {
        let state = LanProxyState::new();
        assert!(state.proxy.lock().unwrap().is_none());
        assert_eq!(*state.port.lock().unwrap(), DEFAULT_PROXY_PORT);
    }
}
