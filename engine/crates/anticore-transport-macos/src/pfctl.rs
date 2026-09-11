//! macOS Paket Filtresi (`pfctl`) anchor yöneticisi.
//!
//! Giden TCP 80/443 trafiğini açılan utunX arabirimine yönlendirir.
//! RAII `Drop` ile uygulama kapandığında tüm pf kuralları otomatik kaldırılır.

#[cfg(target_os = "macos")]
use std::io::Write;
#[cfg(target_os = "macos")]
use std::process::{Command, Stdio};

#[cfg(target_os = "macos")]
pub const ANCHOR_NAME: &str = "com.monolithworks.anticore";

#[cfg(target_os = "macos")]
pub struct PfctlGuard {
    active: bool,
}

#[cfg(target_os = "macos")]
impl PfctlGuard {
    /// pfctl kurallarını anchor içerisine yükler.
    pub fn setup(utun_ifname: &str, pasif_savunma: bool, quic_engelle: bool) -> Result<Self, String> {
        // 1. pf'yi etkinleştir (zaten etkinse 0 döner)
        let _ = Command::new("pfctl").args(["-e"]).output();

        // 2. Kural metnini hazırla
        let mut rules = String::new();
        rules.push_str(&format!(
            "pass out on en0 route-to {} proto tcp from any to any port {{80, 443}}\n",
            utun_ifname
        ));

        if pasif_savunma {
            rules.push_str("block in proto tcp from any port {80, 443} flags R/R\n");
        }

        if quic_engelle {
            rules.push_str("block out proto udp to any port 443\n");
        }

        // 3. Kuralları anchor'a yaz
        let mut child = Command::new("pfctl")
            .args(["-a", ANCHOR_NAME, "-f", "-"])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("pfctl çalıştırılamadı: {e}"))?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin
                .write_all(rules.as_bytes())
                .map_err(|e| format!("pfctl stdin hatası: {e}"))?;
        }

        let output = child
            .wait_with_output()
            .map_err(|e| format!("pfctl bekleme hatası: {e}"))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("pfctl kural yükleme başarısız: {err}"));
        }

        Ok(Self { active: true })
    }

    /// Kuralları anchor'dan tamamen temizler.
    pub fn cleanup(&mut self) {
        if self.active {
            let _ = Command::new("pfctl")
                .args(["-a", ANCHOR_NAME, "-F", "all"])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
            self.active = false;
        }
    }
}

#[cfg(target_os = "macos")]
impl Drop for PfctlGuard {
    fn drop(&mut self) {
        self.cleanup();
    }
}
