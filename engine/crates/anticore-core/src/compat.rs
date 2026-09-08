use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CompatReport {
    pub av_detected: Vec<String>,
    pub vpn_detected: Vec<String>,
    pub legacy_services: Vec<String>,
    pub windivert_ok: bool,
}

/// Bilinen Antivirüs / Güvenlik yazılımı süreçleri.
pub const KNOWN_AV_PROCESSES: &[(&str, &str)] = &[
    ("avp.exe", "Kaspersky"),
    ("avpui.exe", "Kaspersky"),
    ("ekrn.exe", "ESET"),
    ("egui.exe", "ESET"),
    ("avastui.exe", "Avast"),
    ("afwserv.exe", "Avast"),
    ("avgui.exe", "AVG"),
    ("avgsvc.exe", "AVG"),
    ("bdservicehost.exe", "Bitdefender"),
    ("bdagent.exe", "Bitdefender"),
    ("vsserv.exe", "Bitdefender"),
    ("nortonsecurity.exe", "Norton"),
    ("ccsvchst.exe", "Norton/Symantec"),
    ("symantec.exe", "Symantec"),
    ("mcshield.exe", "McAfee"),
    ("mfevtps.exe", "McAfee"),
    ("mcafeemcs.exe", "McAfee"),
    ("mbam.exe", "Malwarebytes"),
    ("mbamservice.exe", "Malwarebytes"),
    ("mbamtray.exe", "Malwarebytes"),
    ("savservice.exe", "Sophos"),
    ("sophosclean.exe", "Sophos"),
    ("pccntmon.exe", "Trend Micro"),
    ("ntrtscan.exe", "Trend Micro"),
];

/// Bilinen VPN / Tünel yazılımı süreçleri.
pub const KNOWN_VPN_PROCESSES: &[(&str, &str)] = &[
    ("ksde.exe", "Kaspersky VPN"),
    ("ksdeui.exe", "Kaspersky VPN"),
    ("warp-svc.exe", "Cloudflare WARP"),
    ("warp-cli.exe", "Cloudflare WARP"),
    ("cloudflarewarp.exe", "Cloudflare WARP"),
    ("openvpn.exe", "OpenVPN"),
    ("openvpn-gui.exe", "OpenVPN"),
    ("wireguard.exe", "WireGuard"),
    ("nordvpn.exe", "NordVPN"),
    ("nordvpn-service.exe", "NordVPN"),
    ("expressvpn.exe", "ExpressVPN"),
    ("expressvpn-service.exe", "ExpressVPN"),
    ("protonvpn.exe", "ProtonVPN"),
    ("protonvpn-service.exe", "ProtonVPN"),
    ("mullvad-vpn.exe", "Mullvad VPN"),
    ("mullvad-daemon.exe", "Mullvad VPN"),
    ("tailscale.exe", "Tailscale"),
    ("tailscaled.exe", "Tailscale"),
    ("zerotier-one.exe", "ZeroTier"),
];

/// Çakışabilecek eski servisler listesi (WinDivert hariç tutulmuştur; zira Anticore'un kendi çekirdek sürücüsüdür).
pub const KNOWN_LEGACY_SERVICES: &[&str] = &[
    "GoodbyeDPI",
    "GoodbyeDPI-Turkey",
    "zapret",
    "winws1",
    "winws2",
    "WireSock",
    "WireSockService",
    "ProxiFyre",
];

#[cfg(windows)]
fn silent_cmd(program: &str) -> Command {
    use std::os::windows::process::CommandExt;
    let mut cmd = Command::new(program);
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    cmd
}

#[cfg(not(windows))]
fn silent_cmd(program: &str) -> Command {
    Command::new(program)
}

/// Tasklist CSV / metin çıktısını ayrıştırarak tespit edilen AV ve VPN'leri döner.
pub fn parse_tasklist_output(tasklist_raw: &str) -> (Vec<String>, Vec<String>) {
    let lower = tasklist_raw.to_lowercase();
    let mut avs = Vec::new();
    let mut vpns = Vec::new();

    for (proc, name) in KNOWN_AV_PROCESSES {
        if lower.contains(&proc.to_lowercase()) && !avs.contains(&name.to_string()) {
            avs.push(name.to_string());
        }
    }

    for (proc, name) in KNOWN_VPN_PROCESSES {
        if lower.contains(&proc.to_lowercase()) && !vpns.contains(&name.to_string()) {
            vpns.push(name.to_string());
        }
    }

    (avs, vpns)
}

/// sc.exe çıktısını yerelleştirilmiş / hata kodu bağımsız analiz ederek servisin varlığını tespit eder.
pub fn parse_sc_query_output(status_success: bool, output_text: &str) -> bool {
    if !status_success {
        return false;
    }
    let lower = output_text.to_lowercase();
    // 1060 = ERROR_SERVICE_DOES_NOT_EXIST
    if lower.contains("1060")
        || lower.contains("does not exist")
        || lower.contains("mevcut de")
        || lower.contains("non existent")
        || lower.contains("specified service does not exist")
    {
        return false;
    }
    // Servis bilgisi içeriyor mu (SERVICE_NAME / STATE / TYPE)
    lower.contains("service_name") || lower.contains("state") || lower.contains("durum")
}

/// WinDivert sürücü ve DLL dosyalarının varlığını doğrular.
pub fn check_windivert_files(search_paths: &[&Path]) -> bool {
    for base in search_paths {
        let dll = base.join("WinDivert.dll");
        let sys = base.join("WinDivert64.sys");
        if dll.exists() && sys.exists() {
            return true;
        }
    }
    false
}

pub fn check_compatibility() -> CompatReport {
    let mut report = CompatReport {
        av_detected: Vec::new(),
        vpn_detected: Vec::new(),
        legacy_services: Vec::new(),
        windivert_ok: false,
    };

    // 1. Process Check (Penceresiz sessiz komut)
    if let Ok(output) = silent_cmd("tasklist").args(["/FO", "CSV", "/NH"]).output() {
        let tasklist = String::from_utf8_lossy(&output.stdout);
        let (avs, vpns) = parse_tasklist_output(&tasklist);
        report.av_detected = avs;
        report.vpn_detected = vpns;
    }

    // 2. Legacy Services Check (Penceresiz sessiz komut)
    for srv in KNOWN_LEGACY_SERVICES {
        if let Ok(output) = silent_cmd("sc").args(["query", srv]).output() {
            let out = String::from_utf8_lossy(&output.stdout);
            if parse_sc_query_output(output.status.success(), &out) {
                report.legacy_services.push(srv.to_string());
            }
        }
    }


    // 3. WinDivert Files Check
    let mut search_paths = Vec::new();
    if let Ok(cur) = std::env::current_dir() {
        search_paths.push(cur);
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            search_paths.push(parent.to_path_buf());
        }
    }
    let paths_ref: Vec<&Path> = search_paths.iter().map(|p| p.as_path()).collect();
    report.windivert_ok = check_windivert_files(&paths_ref);

    report
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_tasklist_detects_all_major_avs_and_vpns() {
        let tasklist_sample = "\
\"ekrn.exe\",\"1234\",\"Services\",\"0\",\"45,120 K\"\n\
\"bdagent.exe\",\"5678\",\"Console\",\"1\",\"12,300 K\"\n\
\"wireguard.exe\",\"9101\",\"Console\",\"1\",\"8,500 K\"\n\
\"warp-svc.exe\",\"1121\",\"Services\",\"0\",\"32,100 K\"\n\
\"svchost.exe\",\"3344\",\"Services\",\"0\",\"15,000 K\"\n";

        let (avs, vpns) = parse_tasklist_output(tasklist_sample);
        assert!(avs.contains(&"ESET".to_string()));
        assert!(avs.contains(&"Bitdefender".to_string()));
        assert_eq!(avs.len(), 2);

        assert!(vpns.contains(&"WireGuard".to_string()));
        assert!(vpns.contains(&"Cloudflare WARP".to_string()));
        assert_eq!(vpns.len(), 2);
    }

    #[test]
    fn parse_sc_query_output_correctly_classifies_service_states() {
        let not_found_en = "[SC] EnumQueryServicesStatus:OpenService FAILED 1060:\n\nThe specified service does not exist as an installed service.";
        assert!(!parse_sc_query_output(false, not_found_en));
        assert!(!parse_sc_query_output(true, not_found_en));

        let not_found_tr = "[SC] EnumQueryServicesStatus:OpenService BAŞARISIZ 1060:\n\nBelirtilen hizmet yüklü bir hizmet olarak mevcut değil.";
        assert!(!parse_sc_query_output(true, not_found_tr));

        let found_running = "SERVICE_NAME: GoodbyeDPI\n        TYPE               : 1  KERNEL_DRIVER\n        STATE              : 4  RUNNING";
        assert!(parse_sc_query_output(true, found_running));

        let found_stopped = "SERVICE_NAME: zapret\n        TYPE               : 1  KERNEL_DRIVER\n        STATE              : 1  STOPPED";
        assert!(parse_sc_query_output(true, found_stopped));
    }

    #[test]
    fn check_windivert_files_works_with_test_dir() {
        let tmp = std::env::temp_dir().join("anticore_compat_test");
        let _ = std::fs::create_dir_all(&tmp);
        let dll = tmp.join("WinDivert.dll");
        let sys = tmp.join("WinDivert64.sys");

        assert!(!check_windivert_files(&[&tmp]));

        let _ = std::fs::write(&dll, b"test dll");
        assert!(!check_windivert_files(&[&tmp])); // only dll exists

        let _ = std::fs::write(&sys, b"test sys");
        assert!(check_windivert_files(&[&tmp])); // both exist

        let _ = std::fs::remove_file(dll);
        let _ = std::fs::remove_file(sys);
        let _ = std::fs::remove_dir(tmp);
    }
}
