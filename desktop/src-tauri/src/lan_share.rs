//! Yerel Ağ Cihaz Paylaşımı (LAN Proxy & Hotspot Ağ Geçidi).
//!
//! Aynı Wi-Fi'daki telefon, tablet ve diğer cihazlar için SOCKS5/HTTP/PAC proxy
//! yönetimi ve Windows Mobil Etkin Nokta transit yönlendirme denetimleri.

use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use anticore_core::proxy::{LanProxy, ProxyConfig, DEFAULT_PROXY_PORT};
use crate::commands::{load_engine_config, save_engine_config_internal, silent_command};

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

/// LAN paylaşım durumu ve canlı istatistikleri döner.
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
            },
        )
    };

    let ec = load_engine_config(&app);
    let pac_url = format!("http://{local_ip}:{port}/anticore.pac");

    Ok(LanInfoDto {
        local_ip,
        proxy_port: port,
        proxy_running: running,
        hotspot_mode_enabled: ec.lan_share,
        active_connections: stats.active_connections,
        total_connections: stats.total_connections,
        bytes_transferred: stats.bytes_transferred,
        pac_url,
    })
}

/// Yerel SOCKS5 / HTTP Proxy sunucusunu başlatır.
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

/// Windows Mobil Etkin Nokta ayarları ekranını doğrudan açar.
#[tauri::command]
pub fn open_hotspot_settings() -> Result<(), String> {
    silent_command("cmd")
        .args(["/C", "start", "ms-settings:network-mobilehotspot"])
        .spawn()
        .map_err(|e| format!("Mobil Etkin Nokta ayarları açılamadı: {e}"))?;
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
        let dto = LanInfoDto {
            local_ip: "192.168.1.120".into(),
            proxy_port: 10808,
            proxy_running: true,
            hotspot_mode_enabled: true,
            active_connections: 2,
            total_connections: 15,
            bytes_transferred: 2048,
            pac_url: "http://192.168.1.120:10808/anticore.pac".into(),
        };
        let json = serde_json::to_string(&dto).unwrap();
        let parsed: LanInfoDto = serde_json::from_str(&json).unwrap();
        assert_eq!(dto, parsed);
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
