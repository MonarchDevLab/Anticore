//! IPC komutları: arayüz <-> motor köprüsü.

use std::sync::atomic::Ordering;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use anticore_core::dto::StepDto;
use crate::service::Engine;

// ---------- DTO'lar ----------

#[derive(Serialize)]
pub struct StatusDto {
    pub running: bool,
    pub profile_id: String,
    pub packets_seen: u64,
    pub packets_touched: u64,
    pub passthrough: u64,
    /// Motorun kaç saniyedir çalıştığı; durmuşsa 0.
    pub uptime_sec: u64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ProfileDto {
    pub id: String,
    pub name: String,
    pub description: String,
    pub builtin: bool,
    pub steps: Vec<StepDto>,
}

#[derive(Deserialize)]
pub struct ProfileInput {
    pub id: Option<String>,
    pub name: String,
    pub description: String,
    pub steps: Vec<StepDto>,
}

#[derive(Serialize)]
pub struct ProbeDto {
    pub host: String,
    pub result: String,
    pub latency_ms: Option<u128>,
}

#[derive(Deserialize)]
pub struct ProbeRequest {
    pub host: String,
}

#[derive(Serialize)]
pub struct DnsDto {
    pub servers: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DohStatusDto {
    pub enabled: bool,
    pub auto_doh_value: u32,
    pub template: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DnsHealthDto {
    pub poisoned: bool,
    pub resolved_ip: String,
    pub is_secure: bool,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AdapterDnsInfo {
    pub name: String,
    pub description: String,
    pub interface_index: u32,
    pub ipv4_servers: Vec<String>,
    pub ipv6_servers: Vec<String>,
    pub is_dhcp: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LegacyServiceDto {
    pub id: String,
    pub name: String,
    pub status: String,
    pub installed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EngineConfigDto {
    pub pasif_savunma: bool,
    pub quic_engelle: bool,
    pub lan_share: bool,
}

#[tauri::command]
pub fn get_engine_config(app: AppHandle) -> EngineConfigDto {
    let c = load_engine_config(&app);
    EngineConfigDto {
        pasif_savunma: c.pasif_savunma,
        quic_engelle: c.quic_engelle,
        lan_share: c.lan_share,
    }
}

#[tauri::command]
pub fn set_engine_config(app: AppHandle, config: EngineConfigDto) -> Result<(), String> {
    let engine = app.state::<Engine>();
    if engine.running.load(Ordering::SeqCst) {
        return Err("Motor çalışırken ayar değiştirilemez; önce durdurun".into());
    }
    let mut ec = load_engine_config(&app);
    ec.pasif_savunma = config.pasif_savunma;
    ec.quic_engelle = config.quic_engelle;
    ec.lan_share = config.lan_share;
    save_engine_config_internal(&app, &ec)
}

pub(crate) fn save_engine_config_internal(app: &AppHandle, config: &crate::service::EngineConfig) -> Result<(), String> {
    std::fs::write(
        config_path(app),
        serde_json::to_string_pretty(config).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("kaydedilemedi: {e}"))
}

// ---------- kurulum: servis + bağımsız çalıştırma ----------

pub const SERVICE_NAME: &str = "AnticoreService";

#[cfg(windows)]
pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Windows konsol pencerelerinin ekranda patlamasını önleyen sessiz komut oluşturucu.
pub fn silent_command(program: &str) -> std::process::Command {
    let mut cmd = std::process::Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Motor ikili dosyasını bulur ve mutlak/temiz bir dosya yoluna çözümler.
/// GUI panel ikili dosyasını asla motor olarak kabul etmez.
fn find_motor_exe(_app: &AppHandle) -> Result<PathBuf, String> {
    let current_exe = std::env::current_exe().ok();
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(ref exe) = current_exe {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join("anticore-cli.exe"));
            candidates.push(dir.join("bin").join("anticore.exe"));
            candidates.push(dir.join("engine").join("target").join("release").join("anticore.exe"));
            candidates.push(dir.join("dist").join("anticore-cli.exe"));
            candidates.push(dir.join("anticore.exe"));
            if let Some(parent) = dir.parent() {
                candidates.push(parent.join("anticore-cli.exe"));
                candidates.push(parent.join("bin").join("anticore.exe"));
                candidates.push(parent.join("engine").join("target").join("release").join("anticore.exe"));
                candidates.push(parent.join("dist").join("anticore-cli.exe"));
            }
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("anticore-cli.exe"));
        candidates.push(cwd.join("bin").join("anticore.exe"));
        candidates.push(cwd.join("antikor").join("anticore-cli.exe"));
        candidates.push(cwd.join("antikor").join("bin").join("anticore.exe"));
    }
    for rel in [
        "anticore-cli.exe",
        "bin/anticore.exe",
        "engine/target/release/anticore.exe",
        "dist/anticore-cli.exe",
        "../../engine/target/release/anticore.exe",
        "../../../engine/target/release/anticore.exe",
    ] {
        if let Some(ref exe) = current_exe {
            if let Some(dir) = exe.parent() {
                candidates.push(dir.join(rel));
            }
        }
        candidates.push(PathBuf::from(rel));
    }
    candidates.retain(|p| {
        if !p.is_file() {
            return false;
        }
        // Panelin kendisini motor olarak kabul etmeyi kesinlikle engelle
        if let Some(ref cur) = current_exe {
            if let (Ok(c1), Ok(c2)) = (p.canonicalize(), cur.canonicalize()) {
                if c1 == c2 {
                    return false;
                }
            }
        }
        // GUI dosyası (> 5MB) motor olamaz (CLI ~370KB'dır)
        if let Ok(meta) = p.metadata() {
            if meta.len() > 5 * 1024 * 1024 {
                return false;
            }
        }
        true
    });

    let found = candidates
        .into_iter()
        .next()
        .ok_or_else(|| "anticore-cli.exe bulunamadı (CLI motor dosyası panel yanında olmalı)".to_string())?;

    if let Ok(canon) = found.canonicalize() {
        let s = canon.to_string_lossy().to_string();
        let clean = s.strip_prefix(r"\\?\").unwrap_or(&s).to_string();
        Ok(PathBuf::from(clean))
    } else {
        Ok(found)
    }
}

fn sc_query(service: &str) -> String {
    silent_command("sc")
        .args(["query", service])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default()
}

#[derive(Serialize)]
pub struct SetupStatusDto {
    pub service_installed: bool,
    pub service_running: bool,
    pub detached_running: bool,
}

fn is_detached_running(app: &AppHandle) -> bool {
    let pid_file = app_dir(app).join("detached.pid");
    pid_file.is_file()
        && std::fs::read_to_string(&pid_file)
            .ok()
            .and_then(|s| s.trim().parse::<u32>().ok())
            .map(|pid| {
                silent_command("tasklist")
                    .args(["/FI", &format!("PID eq {pid}"), "/FO", "CSV", "/NH"])
                    .output()
                    .map(|o| {
                        let out = String::from_utf8_lossy(&o.stdout).to_lowercase();
                        out.contains("anticore")
                    })
                    .unwrap_or(false)
            })
            .unwrap_or(false)
}

#[tauri::command]
pub fn get_setup_status(app: AppHandle) -> Result<SetupStatusDto, String> {
    let output = silent_command("sc").args(["query", SERVICE_NAME]).output()
        .map_err(|e| format!("Servis durumu sorgulanamadı: {e}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{stdout} {stderr}");

    // Windows 1060: ERROR_SERVICE_DOES_NOT_EXIST (servis kurulu değil, bu bir hata değildir)
    let not_installed = combined.contains("1060") || output.status.code() == Some(1060);

    if !output.status.success() && !not_installed {
        return Err(format!("Servis durumu sorgulanamadı: {combined}"));
    }
    let service_installed = !not_installed && stdout.contains("SERVICE_NAME:");
    let service_running = service_installed && stdout.contains("RUNNING");
    let detached_running = is_detached_running(&app);

    Ok(SetupStatusDto {
        service_installed,
        service_running,
        detached_running,
    })
}

#[tauri::command]
pub fn install_service(app: AppHandle, profile_id: String) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("Windows servisi kurmak için uygulamanın Yönetici olarak çalıştırılması gerekir.".into());
    }

    if app.state::<Engine>().running.load(Ordering::SeqCst) || is_detached_running(&app) {
        return Err("Önce çalışan panel veya bağımsız motoru durdurun.".into());
    }
    resolve_steps(&app, &profile_id)?;
    if !profile_id.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.')) {
        return Err("Servis profili kimliği geçersiz.".into());
    }
    if get_setup_status(app.clone())?.service_installed {
        return Err("Servis zaten kurulu. Yeniden kurmadan önce kaldırın.".into());
    }
    let motor = find_motor_exe(&app)?;
    let data_dir = app_dir(&app);
    let exe_str = motor.to_string_lossy().to_string();
    let dir_str = data_dir.to_string_lossy().to_string();

    // sc create komutunu CMD üzerinden tırnakları tam koruyarak çalıştır
    let create_cmd = format!(
        "sc.exe create {} binPath= \"\\\"{}\\\" service-run --profile {} --data-dir \\\"{}\\\"\" start= auto",
        SERVICE_NAME, exe_str, profile_id, dir_str
    );
    let out = silent_command("cmd")
        .args(["/C", &create_cmd])
        .output()
        .map_err(|e| format!("sc çalıştırılamadı: {e}"))?;

    if !out.status.success() {
        return Err(format!(
            "servis oluşturulamadı: {} {}",
            String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr)
        ));
    }
    let desc_cmd = format!(
        "sc.exe description {} \"Anticore DPI Paket Filtreleme ve Koruma Servisi\"",
        SERVICE_NAME
    );
    let _ = silent_command("cmd").args(["/C", &desc_cmd]).output();

    let start = silent_command("sc")
        .args(["start", SERVICE_NAME])
        .output()
        .map_err(|e| format!("sc start başarısız: {e}"))?;
    if !start.status.success() {
        let err = String::from_utf8_lossy(&start.stderr).trim().to_string();
        let out_msg = String::from_utf8_lossy(&start.stdout).trim().to_string();
        let msg = if !err.is_empty() { err } else { out_msg };
        return Err(format!("servis başlatılamadı: {msg} (Başka DPI servisi çakışıyor olabilir)"));
    }
    app.emit("log", format!("[+] servis kuruldu ve başlatıldı (profil={profile_id})"))
        .ok();
    Ok(())
}

#[tauri::command]
pub fn uninstall_service(app: AppHandle) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("Servisi kaldırmak için uygulamanın Yönetici olarak çalıştırılması gerekir.".into());
    }

    let _ = silent_command("sc").args(["stop", SERVICE_NAME]).output();
    std::thread::sleep(std::time::Duration::from_millis(1000));
    let out = silent_command("sc")
        .args(["delete", SERVICE_NAME])
        .output()
        .map_err(|e| format!("sc delete başarısız: {e}"))?;
    if !out.status.success() {
        let combined = format!("{} {}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
        if !combined.contains("1060") {
            return Err("servis kaldırılamadı (kurulu olmayabilir)".into());
        }
    }
    app.emit("log", "[-] servis kaldırıldı".to_string()).ok();
    Ok(())
}

#[tauri::command]
pub fn detached_start(app: AppHandle, profile_id: String) -> Result<(), String> {
    use std::process::Stdio;

    if !is_running_as_admin() {
        return Err("Bağımsız motor çalıştırmak için uygulamanın Yönetici olarak çalıştırılması gerekir.".into());
    }

    if app.state::<Engine>().running.load(Ordering::SeqCst) {
        return Err("Panel motoru çalışıyor; önce onu durdurun".into());
    }
    if is_detached_running(&app) {
        return Err("Bağımsız motor zaten çalışıyor.".into());
    }
    resolve_steps(&app, &profile_id)?;
    let q = sc_query(SERVICE_NAME);
    if q.contains("SERVICE_NAME:") && !q.contains("1060") {
        return Err("Servis kurulu; çakışmayı önlemek için önce servisi kaldırın".into());
    }

    let motor = find_motor_exe(&app)?;
    let data_dir = app_dir(&app);
    let work_dir = motor.parent().unwrap_or(&data_dir);

    let log_path = data_dir.join("detached-startup.log");
    let log = std::fs::File::create(&log_path).map_err(|e| format!("Motor günlüğü açılamadı: {e}"))?;
    let error_log = log.try_clone().map_err(|e| e.to_string())?;
    let mut cmd = silent_command(&motor.to_string_lossy());
    cmd.current_dir(work_dir)
        .args(["run", "--profile", &profile_id, "--data-dir"])
        .arg(&data_dir)
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(error_log));

    let mut child = cmd.spawn().map_err(|e| format!("motor başlatılamadı: {e}"))?;
    let mut ready = false;
    for _ in 0..50 {
        std::thread::sleep(std::time::Duration::from_millis(100));
        let output = std::fs::read_to_string(&log_path).unwrap_or_default();
        if let Some(exit) = child.try_wait().map_err(|e| e.to_string())? {
            return Err(format!("Motor başlangıçta kapandı ({exit}): {output}"));
        }
        if output.contains("[+] aktif. Ctrl+C ile durdurun.") {
            ready = true;
            break;
        }
    }
    if !ready {
        child.kill().map_err(|e| format!("Yanıt vermeyen motor durdurulamadı: {e}"))?;
        child.wait().map_err(|e| e.to_string())?;
        return Err("Motor 5 saniye içinde hazır olmadı; başlangıç iptal edildi.".into());
    }

    std::fs::write(
        app_dir(&app).join("detached.pid"),
        child.id().to_string(),
    )
    .map_err(|e| {
        let _ = child.kill();
        let _ = child.wait();
        format!("Motor PID kaydı yazılamadı: {e}")
    })?;
    drop(child);
    app.emit(
        "log",
        format!("[+] bağımsız motor başladı (profil={profile_id}) — panel kapansa da sürer"),
    )
    .ok();
    Ok(())
}

#[tauri::command]
pub fn detached_stop(app: AppHandle) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("Bağımsız motoru durdurmak için uygulamanın Yönetici olarak çalıştırılması gerekir.".into());
    }

    let pid_file = app_dir(&app).join("detached.pid");
    let pid = std::fs::read_to_string(&pid_file)
        .ok()
        .and_then(|s| s.trim().parse::<u32>().ok())
        .ok_or_else(|| "çalışan bağımsız motor bulunamadı".to_string())?;
    let out = silent_command("taskkill")
        .args(["/PID", &pid.to_string(), "/F"])
        .output()
        .map_err(|e| format!("taskkill başarısız: {e}"))?;
    let out_str = format!("{} {}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
    if out.status.success() || out_str.contains("bulunamadı") || out_str.to_lowercase().contains("not found") {
        let _ = std::fs::remove_file(&pid_file);
        app.emit("log", "[*] bağımsız motor durduruldu".to_string()).ok();
        Ok(())
    } else {
        Err(format!("Motor sonlandırılamadı: {out_str}"))
    }
}

// ---------- yardımcılar ----------

fn app_dir(app: &AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn blacklist_path(app: &AppHandle) -> PathBuf {
    app_dir(app).join("blacklist.txt")
}

fn profiles_path(app: &AppHandle) -> PathBuf {
    app_dir(app).join("profiles.json")
}

fn config_path(app: &AppHandle) -> PathBuf {
    app_dir(app).join("config.json")
}

/// Motor yapılandırması: dosyadan okur, yoksa varsayılan döner.
pub(crate) fn load_engine_config(app: &AppHandle) -> crate::service::EngineConfig {
    let defaults = crate::service::EngineConfig::default();
    let p = config_path(app);
    let Ok(text) = std::fs::read_to_string(&p) else {
        if let Ok(serialized) = serde_json::to_string_pretty(&defaults) {
            let _ = std::fs::write(&p, serialized);
        }
        return defaults;
    };
    #[derive(Deserialize)]
    struct Raw {
        pasif_savunma: Option<bool>,
        quic_engelle: Option<bool>,
        lan_share: Option<bool>,
    }
    match serde_json::from_str::<Raw>(&text) {
        Ok(r) => crate::service::EngineConfig {
            pasif_savunma: r.pasif_savunma.unwrap_or(defaults.pasif_savunma),
            quic_engelle: r.quic_engelle.unwrap_or(defaults.quic_engelle),
            lan_share: r.lan_share.unwrap_or(defaults.lan_share),
        },
        Err(_) => defaults,
    }
}

fn load_blacklist(app: &AppHandle) -> anticore_core::config::Blacklist {
    anticore_core::config::Blacklist::from_file(&blacklist_path(app))
        .unwrap_or_else(|_| anticore_core::config::Blacklist::from_lines(anticore_core::config::DEFAULT_BLACKLIST))
}

fn load_custom_profiles(app: &AppHandle) -> Vec<ProfileDto> {
    let Ok(text) = std::fs::read_to_string(profiles_path(app)) else {
        return vec![];
    };
    serde_json::from_str(&text).unwrap_or_default()
}

fn resolve_steps(app: &AppHandle, profile_id: &str) -> Result<Vec<anticore_core::strategy::Step>, String> {
    // Önce builtin, yoksa custom
    if let Some(p) = anticore_core::profile::find_profile(profile_id) {
        return Ok(p.steps);
    }
    for p in load_custom_profiles(app) {
        if p.id == profile_id {
            return anticore_core::dto::steps_from_dto(&p.steps);
        }
    }
    Err(format!("profil bulunamadı: {profile_id}"))
}

// ---------- durum ----------

#[tauri::command]
pub fn get_status(app: AppHandle, engine: tauri::State<Engine>) -> StatusDto {
    let panel_running = engine.running.load(Ordering::SeqCst);
    let service_running = if !panel_running {
        sc_query(SERVICE_NAME).contains("RUNNING")
    } else {
        false
    };
    let detached_running = if !panel_running && !service_running {
        is_detached_running(&app)
    } else {
        false
    };

    let running = panel_running || service_running || detached_running;
    let safe_profile = engine
        .profile_id
        .lock()
        .map(|p| p.clone())
        .unwrap_or_else(|_| "universal".into());

    let profile_id = if panel_running {
        safe_profile
    } else if service_running {
        "service".into()
    } else if detached_running {
        "detached".into()
    } else {
        safe_profile
    };

    StatusDto {
        running,
        profile_id,
        packets_seen: engine.stats.packets_seen.load(Ordering::Relaxed),
        packets_touched: engine.stats.packets_touched.load(Ordering::Relaxed),
        passthrough: engine.stats.passthrough.load(Ordering::Relaxed),
        uptime_sec: engine.uptime_sec(),
    }
}

// ---------- profiller ----------

#[tauri::command]
pub fn list_profiles(app: AppHandle) -> Vec<ProfileDto> {
    let mut out: Vec<ProfileDto> = anticore_core::profile::builtin_profiles()
        .into_iter()
        .map(|p| ProfileDto {
            id: p.id.to_string(),
            name: p.name.to_string(),
            description: p.description.to_string(),
            builtin: true,
            steps: anticore_core::dto::steps_to_dto(&p.steps),
        })
        .collect();
    out.extend(load_custom_profiles(&app));
    out
}

#[tauri::command]
pub fn save_profile(app: AppHandle, profile: ProfileInput) -> Result<ProfileDto, String> {
    if profile.name.trim().is_empty() {
        return Err("Profil adı boş olamaz".into());
    }
    if profile.steps.is_empty() {
        return Err("En az bir adım gerekli".into());
    }
    // Adımların geçerliliğini doğrula
    for s in &profile.steps {
        s.to_step()?;
    }

    let mut all = load_custom_profiles(&app);
    let id = profile.id.unwrap_or_else(|| {
        format!("custom-{}", chrono_like_id())
    });
    let dto = ProfileDto {
        id: id.clone(),
        name: profile.name.trim().to_string(),
        description: profile.description.trim().to_string(),
        builtin: false,
        steps: profile.steps,
    };
    all.retain(|p| p.id != id);
    all.push(dto.clone());
    std::fs::write(
        profiles_path(&app),
        serde_json::to_string_pretty(&all).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("kaydedilemedi: {e}"))?;
    Ok(dto)
}

#[tauri::command]
pub fn delete_profile(app: AppHandle, id: String) -> Result<(), String> {
    let mut all = load_custom_profiles(&app);
    all.retain(|p| p.id != id);
    std::fs::write(
        profiles_path(&app),
        serde_json::to_string_pretty(&all).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("silinemedi: {e}"))?;
    Ok(())
}

/// Özel (builtin olmayan) profilleri native "Farklı Kaydet" diyaloğuyla
/// seçilen JSON dosyasına yazar. Builtin profiller dahil edilmez — kaynak
/// kodda zaten tanımlılar, tekrar içe aktarmak anlamsız olurdu.
#[tauri::command]
pub fn export_profiles_to_file(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;

    let custom = load_custom_profiles(&app);
    if custom.is_empty() {
        return Err("Dışa aktarılacak özel profil yok".into());
    }

    let Some(path) = app
        .dialog()
        .file()
        .add_filter("Anticore Profilleri", &["json"])
        .set_file_name("anticore-profiller.json")
        .blocking_save_file()
    else {
        return Ok(false); // kullanıcı iptal etti
    };
    let path = path.into_path().map_err(|e| e.to_string())?;

    let text = serde_json::to_string_pretty(&custom).map_err(|e| e.to_string())?;
    std::fs::write(&path, text).map_err(|e| format!("kaydedilemedi: {e}"))?;
    Ok(true)
}

/// Native "Aç" diyaloğuyla seçilen JSON dosyasından profilleri içe aktarır.
/// Her profilin adım listesi doğrulanır (geçersiz olan atlanır, tüm dosya
/// reddedilmez); aynı id varsa üzerine yazılır (`save_profile` ile aynı
/// davranış). Döner: içe aktarılan profil sayısı.
#[tauri::command]
pub fn import_profiles_from_file(app: AppHandle) -> Result<usize, String> {
    use tauri_plugin_dialog::DialogExt;

    let Some(path) = app.dialog().file().add_filter("Anticore Profilleri", &["json"]).blocking_pick_file() else {
        return Ok(0); // kullanıcı iptal etti
    };
    let path = path.into_path().map_err(|e| e.to_string())?;

    let text = std::fs::read_to_string(&path).map_err(|e| format!("okunamadı: {e}"))?;
    let incoming: Vec<ProfileDto> =
        serde_json::from_str(&text).map_err(|e| format!("geçersiz profil dosyası: {e}"))?;

    let mut all = load_custom_profiles(&app);
    let mut imported = 0usize;
    for mut p in incoming {
        if p.steps.iter().any(|s| s.to_step().is_err()) {
            continue; // geçersiz adımlı profili sessizce atla
        }
        p.builtin = false; // içe aktarılan hiçbir zaman builtin işaretlenmez
        all.retain(|existing| existing.id != p.id);
        all.push(p);
        imported += 1;
    }

    std::fs::write(
        profiles_path(&app),
        serde_json::to_string_pretty(&all).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("kaydedilemedi: {e}"))?;

    Ok(imported)
}

fn chrono_like_id() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// ---------- hedef siteler ----------

#[tauri::command]
pub fn get_blacklist(app: AppHandle) -> Vec<String> {
    let bl = load_blacklist(&app);
    let mut v: Vec<String> = bl.iter().cloned().collect();
    
    let priorities = ["discord.com", "roblox.com", "wattpad.com", "pastebin.com", "eksisozluk.com"];
    
    v.sort_by(|a, b| {
        let p_a = priorities.iter().position(|&p| a.ends_with(p)).unwrap_or(usize::MAX);
        let p_b = priorities.iter().position(|&p| b.ends_with(p)).unwrap_or(usize::MAX);
        
        if p_a != p_b {
            p_a.cmp(&p_b)
        } else {
            a.cmp(b)
        }
    });
    
    v
}

/// Hedef listesini native "Farklı Kaydet" diyaloğuyla seçilen `.txt`
/// dosyasına yazar. Önceden Sites.tsx `<a download>` + blob kullanıyordu —
/// WebView2'de sessizce çalışmaz (bkz. Faz 0 analizi A2.9).
#[tauri::command]
pub fn export_sites_to_file(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;

    let Some(path) = app
        .dialog()
        .file()
        .add_filter("Metin dosyası", &["txt"])
        .set_file_name("anticore-hedefler.txt")
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path = path.into_path().map_err(|e| e.to_string())?;

    std::fs::write(&path, get_blacklist(app).join("\n")).map_err(|e| format!("kaydedilemedi: {e}"))?;
    Ok(true)
}

#[tauri::command]
pub fn add_site(app: AppHandle, engine: tauri::State<Engine>, domain: String) -> Result<(), String> {
    let domain = domain.trim().to_lowercase();
    if domain.is_empty() || !domain.contains('.') || domain.contains(' ') {
        return Err("Geçersiz domain".into());
    }
    let mut current = get_blacklist(app.clone());
    if current.contains(&domain) {
        return Ok(());
    }
    current.push(domain.clone());
    save_blacklist(&app, &current)?;
    let new_bl = load_blacklist(&app);
    engine.update_blacklist(new_bl);
    app.emit("log", format!("[+] hedef eklendi: {domain}")).ok();
    Ok(())
}

/// Birden fazla alan adını tek disk yazma işlemiyle kara listeye ekler.
#[tauri::command]
pub fn add_sites(app: AppHandle, engine: tauri::State<Engine>, domains: Vec<String>) -> Result<usize, String> {
    let current = get_blacklist(app.clone());
    let mut set: std::collections::HashSet<String> = current.into_iter().collect();
    let mut added = 0usize;
    for domain in domains {
        let d = domain.trim().to_lowercase();
        if !d.is_empty() && d.contains('.') && !d.contains(' ') && set.insert(d) {
            added += 1;
        }
    }
    if added > 0 {
        let mut sorted: Vec<String> = set.into_iter().collect();
        sorted.sort();
        save_blacklist(&app, &sorted)?;
        let new_bl = load_blacklist(&app);
        engine.update_blacklist(new_bl);
        app.emit("log", format!("[+] {added} yeni hedef listeye eklendi")).ok();
    }
    Ok(added)
}

/// Domain DNS'ten çözümlenebiliyor mu — Sites view'da ekleme öncesi yazım
/// hatalarını yakalamak için. Ağ gerektirir ama tek bir sistem çağrısı
/// kadar hafiftir (`ToSocketAddrs`, port 443 varsayımıyla); ayrı bir TLS
/// probe'una gerek yok.
#[tauri::command]
pub fn resolve_domain(domain: String) -> bool {
    use std::net::ToSocketAddrs;
    (domain.trim(), 443u16)
        .to_socket_addrs()
        .map(|mut it| it.next().is_some())
        .unwrap_or(false)
}

#[tauri::command]
pub fn remove_site(app: AppHandle, engine: tauri::State<Engine>, domain: String) -> Result<(), String> {
    let current = get_blacklist(app.clone());
    save_blacklist(
        &app,
        &current.into_iter().filter(|d| *d != domain).collect::<Vec<_>>(),
    )?;
    let new_bl = load_blacklist(&app);
    engine.update_blacklist(new_bl);
    app.emit("log", format!("[-] hedef çıkarıldı: {domain}")).ok();
    Ok(())
}

fn save_blacklist(app: &AppHandle, domains: &[String]) -> Result<(), String> {
    std::fs::write(blacklist_path(app), domains.join("\n"))
        .map_err(|e| format!("kaydedilemedi: {e}"))
}

// ---------- motor ----------

#[tauri::command]
pub fn start_engine(app: AppHandle, engine: tauri::State<Engine>, profile_id: String) -> Result<(), String> {
    let modes = get_setup_status(app.clone())?;
    if modes.detached_running || (modes.service_installed && !sc_query(SERVICE_NAME).contains("STOPPED")) {
        return Err("Servis veya bağımsız motor çalışıyor; panel motorunu başlatmadan önce durdurun.".into());
    }
    let bl = load_blacklist(&app);
    let steps = resolve_steps(&app, &profile_id)?;
    let config = load_engine_config(&app);

    let handle = app.clone();
    let log_file = app_dir(&app).join("anticore.log");
    let log_sink = move |line: String| {
        crate::service::write_rotated_log(&log_file, &line);
        handle.emit("log", line).ok();
    };

    let dll_dir = app
        .path()
        .resource_dir()
        .ok()
        .or_else(|| {
            std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        });

    engine.start(&profile_id, bl, steps, &config, dll_dir, log_sink)?;
    app.emit("status_changed", true).ok();
    Ok(())
}

#[tauri::command]
pub fn stop_engine(app: AppHandle, engine: tauri::State<Engine>) -> Result<(), String> {
    if let Err(error) = engine.stop() {
        if error != "Motor zaten durdurulmuş" { return Err(error); }
    }
    let modes = get_setup_status(app.clone())?;
    if modes.detached_running { detached_stop(app.clone())?; }
    if modes.service_installed && !sc_query(SERVICE_NAME).contains("STOPPED") {
        let output = silent_command("sc").args(["stop", SERVICE_NAME]).output()
            .map_err(|e| format!("Servis durdurma komutu çalıştırılamadı: {e}"))?;
        if !output.status.success() {
            return Err(format!("Servis durdurulamadı: {} {}", String::from_utf8_lossy(&output.stdout), String::from_utf8_lossy(&output.stderr)));
        }
        let mut stopped = false;
        for _ in 0..50 {
            let current = get_setup_status(app.clone())?;
            if !current.service_installed || sc_query(SERVICE_NAME).contains("STOPPED") { stopped = true; break; }
            std::thread::sleep(std::time::Duration::from_millis(100));
        }
        if !stopped { return Err("Servisin durması 5 saniye içinde doğrulanamadı.".into()); }
        app.emit("log", "[*] Arka plan servisi durduruldu".to_string()).ok();
    }
    app.emit("status_changed", false).ok();
    Ok(())
}

#[cfg(windows)]
#[link(name = "shell32")]
extern "system" {
    fn IsUserAnAdmin() -> i32;
}

/// Uygulamanın Windows yönetici (Administrator) yetkileriyle çalışıp çalışmadığını test eder.
pub fn is_running_as_admin() -> bool {
    #[cfg(windows)]
    unsafe {
        IsUserAnAdmin() != 0
    }
    #[cfg(not(windows))]
    {
        true
    }
}

/// Arayüzün yönetici yetkisini doğrudan sorgulaması için IPC komutu.
#[tauri::command]
pub fn check_is_admin() -> bool {
    is_running_as_admin()
}

/// Uygulamayı yönetici olarak yeniden başlatır (WinDivert sürücüsü için şart).
#[tauri::command]
pub fn restart_as_admin(app: AppHandle) -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_str = exe.to_string_lossy().replace('\'', "''");
    let script = format!(
        "try {{ Start-Process -FilePath '{}' -Verb RunAs -ErrorAction Stop }} catch {{ exit 1 }}",
        exe_str
    );
    let status = silent_command("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .status()
        .map_err(|e| format!("yükseltme başlatılamadı: {e}"))?;
    if !status.success() {
        return Err("Yükseltme onaylanmadı veya iptal edildi".into());
    }
    // Yeni (yönetici) örnek açıldı; bu örneği kapat
    app.exit(0);
    Ok(())
}

// ---------- test (probe) ----------

#[tauri::command]
pub fn probe_target(req: ProbeRequest) -> ProbeDto {
    let host = req.host.trim().to_lowercase();
    let r = anticore_core::tester::probe(&host, 443, 3000);
    let (result, latency) = match r {
        anticore_core::tester::ProbeResult::Open { latency_ms } => ("open".into(), Some(latency_ms)),
        anticore_core::tester::ProbeResult::Blocked { latency_ms } => ("blocked".into(), Some(latency_ms)),
        anticore_core::tester::ProbeResult::Filtered => ("filtered".into(), None),
        anticore_core::tester::ProbeResult::Unreachable(e) => (format!("unreachable:{e}"), None),
    };
    ProbeDto { host, result, latency_ms: latency }
}

// ---------- ağ onarımı (DNS) ----------

#[tauri::command]
pub fn get_dns_servers() -> DnsDto {
    let out = run_powershell(
        "(Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | ForEach-Object {$_.ServerAddresses}) -join ','",
    );
    let servers: Vec<String> = out
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    DnsDto { servers }
}

#[tauri::command]
pub fn apply_secure_dns(app: AppHandle, provider: Option<String>) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("DNS ayarlarını değiştirmek için Windows yönetici (Administrator) yetkisi gereklidir. Lütfen uygulamayı yönetici olarak yeniden başlatın.".into());
    }

    let provider_key = provider.unwrap_or_else(|| "google".to_string()).to_lowercase();
    let (v4, v6, prov_name) = match provider_key.as_str() {
        "cloudflare" => (
            vec!["1.1.1.1", "1.0.0.1"],
            vec!["2606:4700:4700::1111", "2606:4700:4700::1001"],
            "Cloudflare (1.1.1.1)",
        ),
        "quad9" => (
            vec!["9.9.9.9", "149.112.112.112"],
            vec!["2620:fe::fe", "2620:fe::9"],
            "Quad9 (9.9.9.9)",
        ),
        "yandex" => (
            vec!["77.88.8.8", "77.88.8.1"],
            vec!["2a02:6b8::feed:0ff", "2a02:6b8:0:1::feed:0ff"],
            "Yandex (77.88.8.8)",
        ),
        _ => (
            vec!["8.8.8.8", "8.8.4.4"],
            vec!["2001:4860:4860::8888", "2001:4860:4860::8844"],
            "Google (8.8.8.8)",
        ),
    };

    let v4_str = v4.iter().map(|s| format!("'{s}'")).collect::<Vec<_>>().join(",");
    let v6_str = v6.iter().map(|s| format!("'{s}'")).collect::<Vec<_>>().join(",");

    let script = format!(
        r#"
$ErrorActionPreference = 'Stop'
$v4 = @({v4_str})
$v6 = @({v6_str})
$adapters = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object {{ $_.Status -eq 'Up' -and ($_.HardwareInterface -or -not $_.Virtual) }}
if (-not $adapters) {{
    $adapters = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object {{ $_.Status -eq 'Up' }}
}}
$appliedCount = 0
foreach ($a in $adapters) {{
    try {{
        Set-DnsClientServerAddress -InterfaceIndex $a.ifIndex -ServerAddresses ($v4 + $v6) -ErrorAction Stop
        $appliedCount++
    }} catch {{}}
}}
if ($appliedCount -eq 0 -and $adapters.Count -gt 0) {{
    throw "Hiçbir aktif ağ bağdaştırıcısına DNS atanamadı. Yönetici izinlerinizi kontrol edin."
}}
Clear-DnsClientCache
"#
    );
    run_powershell_script(&script)?;
    app.emit("log", format!("[+] güvenli DNS uygulandı: {prov_name} (IPv4 + IPv6)"))
        .ok();
    Ok(())
}

#[tauri::command]
pub fn reset_dns(app: AppHandle) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("DNS ayarlarını sıfırlamak için Windows yönetici (Administrator) yetkisi gereklidir.".into());
    }
    let script = r#"
$ErrorActionPreference = 'Stop'
$adapters = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' }
foreach ($a in $adapters) {
    try {
        Set-DnsClientServerAddress -InterfaceIndex $a.ifIndex -ResetServerAddresses -ErrorAction Stop
    } catch {}
}
Clear-DnsClientCache
"#;
    run_powershell_script(script)?;
    app.emit("log", "[*] DNS ayarları DHCP'ye döndürüldü".to_string())
        .ok();
    Ok(())
}

/// Verilen IP'nin BTK/ISP DNS zehirlenmesi, mahkeme engelleme sayfası veya
/// geçersiz/özel ağ (bogon/RFC1918) yönlendirmesi olup olmadığını belirler.
pub fn is_poisoned_or_bogus_ip(ip: &std::net::IpAddr) -> bool {
    match ip {
        std::net::IpAddr::V4(v4) => {
            if v4.is_loopback() || v4.is_unspecified() || v4.is_broadcast() {
                return true;
            }
            let octets = v4.octets();
            // RFC 1918 Özel Ağ IP'leri (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
            if octets[0] == 10
                || (octets[0] == 172 && (16..=31).contains(&octets[1]))
                || (octets[0] == 192 && octets[1] == 168)
            {
                return true;
            }
            // RFC 6598 CGNAT (100.64.0.0/10)
            if octets[0] == 100 && (octets[1] >= 64 && octets[1] <= 127) {
                return true;
            }
            // Türk Telekom & BTK Resmi Mahkeme Engelleme Sunucu Havuzları
            if octets[0] == 195 && octets[1] == 175 {
                return true;
            }
            if octets[0] == 212 && octets[1] == 156 {
                return true;
            }
            // Turkcell Superonline Engelleme Sunucu Havuzları
            if octets[0] == 213 && octets[1] == 74 {
                return true;
            }
            if octets[0] == 85 && octets[1] == 29 {
                return true;
            }
            if octets[0] == 212 && octets[1] == 252 {
                return true;
            }
            // Vodafone Türkiye Engelleme Sunucu Havuzları
            if octets[0] == 212 && octets[1] == 65 {
                return true;
            }
            false
        }
        std::net::IpAddr::V6(v6) => {
            if v6.is_loopback() || v6.is_unspecified() {
                return true;
            }
            let segments = v6.segments();
            // Türk Telekom IPv6 engelleme bloğu (2a00:1368::/32)
            if segments[0] == 0x2a00 && segments[1] == 0x1368 {
                return true;
            }
            false
        }
    }
}

/// Discord ve engelli siteler için DNS'in sahte BTK/ISP engelleme IP'sine
/// yönlendirilip yönlendirilmediğini (DNS zehirlenmesi) asenkron ve kilitlenmesiz test eder.
#[tauri::command]
pub async fn check_dns_health() -> DnsHealthDto {
    use std::net::ToSocketAddrs;
    use std::time::Duration;

    let res = tokio::time::timeout(Duration::from_millis(3000), tokio::task::spawn_blocking(|| {
        ("discord.com", 443u16).to_socket_addrs()
    })).await;

    match res {
        Ok(Ok(Ok(addrs))) => {
            let addrs_vec: Vec<_> = addrs.collect();
            if addrs_vec.is_empty() {
                return DnsHealthDto {
                    poisoned: true,
                    resolved_ip: "none".into(),
                    is_secure: false,
                    message: "Discord domaini çözümlenemedi (DNS engeli olabilir).".into(),
                };
            }

            let mut poisoned_ip = None;
            for sa in &addrs_vec {
                if is_poisoned_or_bogus_ip(&sa.ip()) {
                    poisoned_ip = Some(sa.ip().to_string());
                    break;
                }
            }

            let first_ip = addrs_vec[0].ip().to_string();
            if let Some(bad_ip) = poisoned_ip {
                DnsHealthDto {
                    poisoned: true,
                    resolved_ip: bad_ip,
                    is_secure: false,
                    message: "İnternet sağlayıcınız (ISP) Discord'u sahte BTK/ISP engelleme IP'sine yönlendiriyor. Güvenli DNS uygulanmalıdır.".into(),
                }
            } else {
                DnsHealthDto {
                    poisoned: false,
                    resolved_ip: first_ip,
                    is_secure: true,
                    message: "DNS çözünürlüğü temiz ve gerçek sunucuya ulaşıyor.".into(),
                }
            }
        }
        Ok(Ok(Err(e))) => {
            DnsHealthDto {
                poisoned: true,
                resolved_ip: "unresolvable".into(),
                is_secure: false,
                message: format!("DNS çözümlenemedi: {e}"),
            }
        }
        Ok(Err(join_err)) => {
            DnsHealthDto {
                poisoned: true,
                resolved_ip: "task_error".into(),
                is_secure: false,
                message: format!("DNS çözümleme görevi başarısız: {join_err}"),
            }
        }
        Err(_) => {
            DnsHealthDto {
                poisoned: true,
                resolved_ip: "timeout".into(),
                is_secure: false,
                message: "DNS sorgusu 3 saniyede yanıt vermedi (İnternet sağlayıcınız DNS isteklerini engelliyor olabilir).".into(),
            }
        }
    }
}

/// Cloudflare Güvenli DNS'i ve Windows DoH (DNS-over-HTTPS) kaydını tek tıkla uygular,
/// ardından sistem DNS önbelleğini temizler.
#[tauri::command]
pub fn auto_fix_dns(app: AppHandle) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("Otomatik DNS onarımı için Windows yönetici (Administrator) yetkisi gereklidir. Lütfen uygulamayı yönetici olarak yeniden başlatın.".into());
    }
    apply_secure_dns(app.clone(), Some("cloudflare".into()))?;
    #[cfg(windows)]
    apply_doh_registry(app.clone(), Some("https://cloudflare-dns.com/dns-query".into()))?;
    crate::net_teardown::flush_dns_cache();
    app.emit("log", "[+] Cloudflare Güvenli DNS ve DoH otomatik olarak uygulandı, DNS önbelleği temizlendi".to_string()).ok();
    Ok(())
}

#[tauri::command]
pub fn get_adapter_dns_info() -> Result<Vec<AdapterDnsInfo>, String> {
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
$adapters = Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' -or $_.HardwareInterface }
if (-not $adapters) {
    $adapters = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' }
}
$list = @()
foreach ($a in $adapters) {
    $idx = $a.ifIndex
    $v4 = (Get-DnsClientServerAddress -InterfaceIndex $idx -AddressFamily IPv4 -ErrorAction SilentlyContinue).ServerAddresses
    $v6 = (Get-DnsClientServerAddress -InterfaceIndex $idx -AddressFamily IPv6 -ErrorAction SilentlyContinue).ServerAddresses
    $isDhcp = ((Get-NetIPAddress -InterfaceIndex $idx -AddressFamily IPv4 -ErrorAction SilentlyContinue).PrefixOrigin -eq 'Dhcp')
    $list += [PSCustomObject]@{
        name = $a.Name
        description = $a.InterfaceDescription
        interface_index = [int]$idx
        ipv4_servers = if ($v4) { @($v4) } else { @() }
        ipv6_servers = if ($v6) { @($v6) } else { @() }
        is_dhcp = [bool]$isDhcp
    }
}
$list | ConvertTo-Json -Compress
"#;
    let out = run_powershell(script);
    if out.trim().is_empty() {
        return Ok(vec![]);
    }
    if out.trim().starts_with('[') {
        serde_json::from_str::<Vec<AdapterDnsInfo>>(&out).map_err(|e| format!("Adaptör verisi çözümlenemedi: {e}"))
    } else {
        match serde_json::from_str::<AdapterDnsInfo>(&out) {
            Ok(single) => Ok(vec![single]),
            Err(_) => Ok(vec![]),
        }
    }
}

// ---------- LOG YÖNETİMİ ----------

#[tauri::command]
pub fn get_log_file(app: AppHandle, max_lines: Option<usize>) -> Result<Vec<String>, String> {
    let limit = max_lines.unwrap_or(500);
    let log_file = app_dir(&app).join("anticore.log");
    let mut lines = Vec::new();

    let backup_file = app_dir(&app).join("anticore.log.1");
    if backup_file.is_file() {
        if let Ok(content) = std::fs::read_to_string(&backup_file) {
            for line in content.lines() {
                if !line.trim().is_empty() {
                    lines.push(line.to_string());
                }
            }
        }
    }

    if log_file.is_file() {
        if let Ok(content) = std::fs::read_to_string(&log_file) {
            for line in content.lines() {
                if !line.trim().is_empty() {
                    lines.push(line.to_string());
                }
            }
        }
    }

    if lines.len() > limit {
        lines = lines.split_off(lines.len() - limit);
    }
    Ok(lines)
}

#[tauri::command]
pub fn clear_log_file(app: AppHandle) -> Result<(), String> {
    let log_file = app_dir(&app).join("anticore.log");
    let backup_file = app_dir(&app).join("anticore.log.1");
    let _ = std::fs::remove_file(&backup_file);
    if let Ok(mut f) = std::fs::File::create(&log_file) {
        use std::io::Write;
        let _ = writeln!(f, "[{}] [*] Log dosyası sıfırlandı.", crate::service::format_iso8601_now());
    }
    app.emit("log", "[*] Log dosyası temizlendi".to_string()).ok();
    Ok(())
}

/// Log dosyasının TAMAMINI (rotasyon dahil) native "Farklı Kaydet"
/// diyaloğuyla seçilen yola yazar. Diyaloğu ve dosya I/O'sunu Rust
/// tarafında yapıyoruz — frontend'in `<a download>` ile blob indirmesi
/// WebView2'de sessizce çalışmaz (bkz. Faz 0 analizi A2.9).
#[tauri::command]
pub fn export_log_to_file(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;

    let Some(path) = app
        .dialog()
        .file()
        .add_filter("Metin dosyası", &["txt"])
        .set_file_name("anticore-log.txt")
        .blocking_save_file()
    else {
        return Ok(false); // kullanıcı iptal etti
    };
    let path = path.into_path().map_err(|e| e.to_string())?;

    let all_lines = get_log_file(app, Some(usize::MAX))?;
    std::fs::write(&path, all_lines.join("\n")).map_err(|e| format!("kaydedilemedi: {e}"))?;
    Ok(true)
}

fn run_powershell(command: &str) -> String {
    let utf8_cmd = format!(
        "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $OutputEncoding = [System.Text.UTF8Encoding]::new($false); {}",
        command
    );
    silent_command("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &utf8_cmd])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default()
}

fn run_powershell_script(script: &str) -> Result<(), String> {
    let path = std::env::temp_dir().join(format!("Anticore-net-{}.ps1", chrono_like_id()));
    let full_script = format!(
        "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false);\n$OutputEncoding = [System.Text.UTF8Encoding]::new($false);\n{}",
        script
    );
    std::fs::write(&path, full_script.as_bytes()).map_err(|e| e.to_string())?;
    let out = silent_command("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
        ])
        .arg(&path)
        .output()
        .map_err(|e| format!("PowerShell çalıştırılamadı: {e}"))?;
    let _ = std::fs::remove_file(&path);
    if out.status.success() {
        Ok(())
    } else {
        Err(format!(
            "PowerShell betiği başarısız: {}",
            String::from_utf8_lossy(&out.stderr)
        ))
    }
}

// ---------- YENI GOREV B4 KOMUTLARI ----------

#[tauri::command]
pub fn check_compatibility() -> anticore_core::compat::CompatReport {
    anticore_core::compat::check_compatibility()
}

#[tauri::command]
pub async fn auto_discover_profile(app: AppHandle) -> Result<Vec<anticore_core::blockcheck::BlockcheckResult>, String> {
    let profiles = anticore_core::profile::builtin_profiles();
    let (tx, mut rx) = tokio::sync::mpsc::channel(10);
    
    let target = "discord.com";
    let handle = tokio::spawn(async move {
        anticore_core::blockcheck::run_blockcheck(target, &profiles, tx).await
    });
    
    while let Some(prog) = rx.recv().await {
        app.emit("blockcheck_progress", prog).ok();
    }
    
    let res = handle.await.map_err(|e| e.to_string())?;
    Ok(res)
}

#[tauri::command]
pub fn scan_legacy_services() -> Vec<LegacyServiceDto> {
    let targets = [
        ("GoodbyeDPI", "GoodbyeDPI Servisi"),
        ("goodbyedpi", "GoodbyeDPI Servisi (Küçük Harf)"),
        ("GoodbyeDPI-Turkey", "GoodbyeDPI Türkiye Servisi"),
        ("splitwire", "SplitWire Servisi"),
        ("SplitWire", "SplitWire Servisi"),
        ("splitwire-service", "SplitWire Arka Plan Servisi"),
        ("SplitwireService", "SplitWire Arka Plan Servisi"),
        ("zapret", "Zapret DPI Servisi"),
        ("winws1", "WinWS Servisi 1"),
        ("winws2", "WinWS Servisi 2"),
        ("WireSock", "WireSock Servisi"),
        ("WireSockService", "WireSock Service"),
        ("ProxiFyre", "ProxiFyre SOCKS Proxy"),
        ("WinDivert", "WinDivert Sürücü Servisi"),
        ("WinDivert14", "WinDivert 1.4 Sürücü Servisi"),
    ];

    let mut results = Vec::new();
    for (id, name) in targets {
        let q = sc_query(id);
        let installed = q.contains("SERVICE_NAME:") && !q.contains("1060");
        let status = if !installed {
            "NOT_INSTALLED"
        } else if q.contains("RUNNING") {
            "RUNNING"
        } else if q.contains("STOPPED") {
            "STOPPED"
        } else {
            "UNKNOWN"
        };

        results.push(LegacyServiceDto {
            id: id.to_string(),
            name: name.to_string(),
            status: status.to_string(),
            installed,
        });
    }
    results
}

#[tauri::command]
pub fn cleanup_legacy_services(app: AppHandle, service_ids: Option<Vec<String>>) -> Result<Vec<String>, String> {
    if !is_running_as_admin() {
        return Err("Eski servisleri durdurmak ve kaldırmak için Windows Yönetici (Administrator) yetkisi gereklidir. Lütfen uygulamayı yönetici olarak başlatın.".into());
    }

    // 1. Arka planda çalışan ve dosyaları kilitleyen eski süreçleri sonlandır
    let legacy_procs = ["goodbyedpi.exe", "splitwire.exe", "winws.exe", "wiresock.exe", "sing-box.exe"];
    for p in legacy_procs {
        let _ = silent_command("taskkill").args(["/F", "/IM", p, "/T"]).output();
    }

    // 2. WinDivert sürücü kilitlerini çözmek için sürücü servislerini durdur
    let _ = silent_command("sc").args(["stop", "WinDivert"]).output();
    let _ = silent_command("sc").args(["stop", "WinDivert14"]).output();

    let to_clean = if let Some(ids) = service_ids {
        ids
    } else {
        scan_legacy_services()
            .into_iter()
            .filter(|s| s.installed)
            .map(|s| s.id)
            .collect()
    };

    let mut cleaned = Vec::new();
    let mut failed = Vec::new();

    for srv in &to_clean {
        let _ = silent_command("sc").args(["stop", srv]).output();
        std::thread::sleep(std::time::Duration::from_millis(150));
        let out = silent_command("sc").args(["delete", srv]).output();
        match out {
            Ok(o) if o.status.success() => {
                cleaned.push(srv.clone());
            }
            Ok(o) => {
                let err_msg = String::from_utf8_lossy(&o.stderr);
                let out_msg = String::from_utf8_lossy(&o.stdout);
                let combined = format!("{err_msg} {out_msg}").trim().to_string();
                if combined.contains("1060") {
                    cleaned.push(srv.clone());
                } else {
                    failed.push(format!("{srv}: {combined}"));
                }
            }
            Err(e) => {
                failed.push(format!("{srv}: {e}"));
            }
        }
    }

    // Ek güvence: sürücüleri tekrar durdur
    let _ = silent_command("sc").args(["stop", "WinDivert"]).output();
    let _ = silent_command("sc").args(["stop", "WinDivert14"]).output();

    app.emit(
        "log",
        "[+] Eski süreç ve servis kilitleri temizlendi. Dosyalar artık silinebilir.".to_string(),
    )
    .ok();

    if !failed.is_empty() {
        return Err(format!("Bazı servisler silinemedi: {}", failed.join("; ")));
    }

    Ok(cleaned)
}

#[cfg(windows)]
#[tauri::command]
pub fn get_startup_enabled() -> bool {
    // 1. Görev Zamanlayıcısı (Task Scheduler) kontrolü
    let task_exists = silent_command("schtasks")
        .args(["/Query", "/TN", "Anticore"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if task_exists {
        return true;
    }

    // 2. Registry kontrolü (yedek)
    windows_registry::CURRENT_USER
        .open("Software\\Microsoft\\Windows\\CurrentVersion\\Run")
        .and_then(|k| k.get_string("Anticore"))
        .is_ok()
}

#[cfg(not(windows))]
#[tauri::command]
pub fn get_startup_enabled() -> bool {
    false
}

#[cfg(windows)]
#[tauri::command]
pub fn set_startup_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    let run_key_path = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    if enabled {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe.to_string_lossy().to_string();
        let tr_arg = format!("\"{}\" --hidden", exe_str);

        // Birincil Yöntem: Windows Task Scheduler (Yönetici yetkisiyle logon anında başlar, WinDivert için UAC'siz şarttır)
        let sch_res = silent_command("schtasks")
            .args([
                "/Create",
                "/TN", "Anticore",
                "/TR", &tr_arg,
                "/SC", "ONLOGON",
                "/RL", "HIGHEST",
                "/F",
            ])
            .output();

        // İkincil Yöntem: Standart HKCU Run anahtarı
        if let Ok(run_key) = windows_registry::CURRENT_USER.create(run_key_path) {
            let _ = run_key.set_string("Anticore", &tr_arg);
        }

        let is_elevated = sch_res.map(|o| o.status.success()).unwrap_or(false);
        if is_elevated {
            app.emit("log", "[+] Windows başlangıcı etkinleştirildi (Task Scheduler - Yönetici Modu)".to_string()).ok();
        } else {
            app.emit("log", "[+] Windows başlangıcı etkinleştirildi (Kayıt Defteri)".to_string()).ok();
        }
    } else {
        // Task Scheduler görevini sil
        let _ = silent_command("schtasks")
            .args(["/Delete", "/TN", "Anticore", "/F"])
            .output();

        // Registry Run değerini sil
        if let Ok(run_key) = windows_registry::CURRENT_USER.create(run_key_path) {
            let _ = run_key.remove_value("Anticore");
        }
        app.emit("log", "[-] Windows başlangıcı devre dışı bırakıldı".to_string()).ok();
    }
    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn set_startup_enabled(_app: AppHandle, _enabled: bool) -> Result<(), String> {
    Err("Bu platformda başlangıç kaydı desteklenmiyor".into())
}

#[cfg(windows)]
#[tauri::command]
pub fn get_doh_status() -> DohStatusDto {
    let params_path = "SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters";
    if let Ok(k) = windows_registry::LOCAL_MACHINE.open(params_path) {
        let auto_doh_value = k.get_u32("EnableAutoDoh").unwrap_or(0);
        let template = k.get_string("AutoDohTemplate").ok();
        DohStatusDto {
            enabled: auto_doh_value == 2,
            auto_doh_value,
            template,
        }
    } else {
        DohStatusDto {
            enabled: false,
            auto_doh_value: 0,
            template: None,
        }
    }
}

#[cfg(not(windows))]
#[tauri::command]
pub fn get_doh_status() -> DohStatusDto {
    DohStatusDto {
        enabled: false,
        auto_doh_value: 0,
        template: None,
    }
}

#[cfg(windows)]
#[tauri::command]
pub fn apply_doh_registry(app: AppHandle, template: Option<String>) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("DoH (DNS over HTTPS) kayıt defteri anahtarlarını yazmak için Windows yönetici (Administrator) yetkisi gereklidir.".into());
    }
    let params_path = "SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters";
    let key = windows_registry::LOCAL_MACHINE
        .create(params_path)
        .map_err(|e| format!("Dnscache kayıt defteri açılamadı (Yönetici yetkisi gerekli): {e}"))?;

    key.set_u32("EnableAutoDoh", 2)
        .map_err(|e| format!("EnableAutoDoh yazılamadı: {e}"))?;

    if let Some(tpl) = &template {
        if !tpl.trim().is_empty() {
            key.set_string("AutoDohTemplate", tpl.trim())
                .map_err(|e| format!("AutoDohTemplate yazılamadı: {e}"))?;
        }
    }

    crate::net_teardown::flush_dns_cache();
    app.emit(
        "log",
        "[+] DoH (DNS over HTTPS) kayıt defterine eklendi (EnableAutoDoh=2, Native Registry)".to_string(),
    )
    .ok();
    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn apply_doh_registry(_app: AppHandle, _template: Option<String>) -> Result<(), String> {
    Err("DoH kayıt defteri yalnızca Windows'ta geçerlidir".into())
}

#[cfg(windows)]
#[tauri::command]
pub fn reset_doh_registry(app: AppHandle) -> Result<(), String> {
    if !is_running_as_admin() {
        return Err("DoH kayıt defteri anahtarlarını silmek için Windows yönetici (Administrator) yetkisi gereklidir.".into());
    }
    let params_path = "SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters";
    let key = windows_registry::LOCAL_MACHINE
        .create(params_path)
        .map_err(|e| format!("Dnscache kayıt defteri açılamadı (Yönetici yetkisi gerekli): {e}"))?;

    let _ = key.remove_value("EnableAutoDoh");
    let _ = key.remove_value("AutoDohTemplate");

    if let Ok(val) = key.get_u32("EnableAutoDoh") {
        if val != 0 {
            let _ = key.set_u32("EnableAutoDoh", 0);
        }
    }

    crate::net_teardown::flush_dns_cache();
    app.emit("log", "[-] DoH kayıt defterinden kaldırıldı ve DNS önbelleği temizlendi".to_string()).ok();
    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn reset_doh_registry(_app: AppHandle) -> Result<(), String> {
    Err("DoH kayıt defteri yalnızca Windows'ta geçerlidir".into())
}

#[tauri::command]
pub fn factory_reset(app: AppHandle, engine: tauri::State<Engine>) -> Result<(), String> {
    engine.stop().ok();

    // 1. Blacklist varsayılana sıfırlanır
    std::fs::write(blacklist_path(&app), anticore_core::config::DEFAULT_BLACKLIST)
        .map_err(|e| format!("Blacklist sıfırlanamadı: {e}"))?;
    let new_bl = load_blacklist(&app);
    engine.update_blacklist(new_bl);

    // 2. Özel profiller kaldırılır
    let _ = std::fs::remove_file(profiles_path(&app));

    // 3. Yapılandırma varsayılana döndürülür
    let default_cfg = crate::service::EngineConfig::default();
    let cfg_dto = EngineConfigDto {
        pasif_savunma: default_cfg.pasif_savunma,
        quic_engelle: default_cfg.quic_engelle,
        lan_share: default_cfg.lan_share,
    };
    std::fs::write(
        config_path(&app),
        serde_json::to_string_pretty(&cfg_dto).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("Yapılandırma sıfırlanamadı: {e}"))?;

    // 4. Bağımsız motor pid dosyasını kaldır
    let _ = std::fs::remove_file(app_dir(&app).join("detached.pid"));

    // 5. Başlangıçta çalıştırma görev ve kayıtlarını sil
    set_startup_enabled(app.clone(), false).ok();

    // 6. DNS ve DoH kayıt defterini sıfırla
    reset_dns(app.clone()).ok();
    #[cfg(windows)]
    reset_doh_registry(app.clone()).ok();

    // 7. Log dosyasını temizle
    clear_log_file(app.clone()).ok();

    app.emit(
        "log",
        "[!] Fabrika sıfırlama tamamlandı: Tüm profiller, hedef listesi, DNS ayarları ve yapılandırma varsayılana döndürüldü.".to_string(),
    )
    .ok();
    Ok(())
}

#[tauri::command]
pub fn dns_leak_test() -> Result<String, String> {
    let script = r#"
try {
    $result = Resolve-DnsName -Name discord.com -Type A -ErrorAction Stop
    $server = (Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses}).ServerAddresses -join ', '
    "Resolved using: $server"
} catch {
    "Failed to resolve: $_"
}
"#;
    let out = run_powershell(script);
    Ok(out.trim().to_string())
}

#[tauri::command]
pub fn repair_discord_updates(app: AppHandle) -> Result<String, String> {
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
Get-Process -Name Discord, DiscordPTB, DiscordCanary -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

Clear-DnsClientCache
ipconfig /flushdns

$discordFolders = @('Discord', 'DiscordPTB', 'DiscordCanary')
foreach ($f in $discordFolders) {
    $localDiscord = Join-Path $env:LOCALAPPDATA $f
    if (Test-Path $localDiscord) {
        Remove-Item -Path (Join-Path $localDiscord 'Update.exe.log') -Force -ErrorAction SilentlyContinue
        Remove-Item -Path (Join-Path $localDiscord 'Squirrel.log') -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $localDiscord -Filter 'Squirrel-tmp*' -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

"Discord güncelleme kilitleri ve DNS önbelleği başarıyla temizlendi."
"#;
    let out = run_powershell(script);
    app.emit("log", "[+] Discord güncelleme döngüsü onarıldı".to_string()).ok();
    Ok(out.trim().to_string())
}

#[tauri::command]
pub fn clear_discord_cache(app: AppHandle) -> Result<String, String> {
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
Get-Process -Name Discord, DiscordPTB, DiscordCanary -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$discordNames = @('discord', 'discordptb', 'discordcanary')
foreach ($name in $discordNames) {
    $appDataDiscord = Join-Path $env:APPDATA $name
    if (Test-Path $appDataDiscord) {
        $caches = @('Cache', 'Code Cache', 'GPUCache', 'DawnCache', 'DawnGraphiteCache', 'blob_storage', 'Session Storage', 'DIPS', 'lockfile')
        foreach ($c in $caches) {
            $p = Join-Path $appDataDiscord $c
            if (Test-Path $p) {
                Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        $netPersistent = Join-Path $appDataDiscord 'Network\Network Persistent State'
        if (Test-Path $netPersistent) {
            Remove-Item -Path $netPersistent -Force -ErrorAction SilentlyContinue
        }
    }
}

Clear-DnsClientCache
ipconfig /flushdns

"Discord önbelleği (Cache / GPU / Network State) ve DNS önbelleği başarıyla temizlendi."
"#;
    let out = run_powershell(script);
    app.emit("log", "[+] Discord önbellek dosyaları temizlendi".to_string()).ok();
    Ok(out.trim().to_string())
}

#[tauri::command]
pub fn flush_dns_and_renew_adapters(app: AppHandle) -> Result<String, String> {
    crate::net_teardown::flush_dns_cache();
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
Clear-DnsClientCache
ipconfig /flushdns
ipconfig /renew
"DNS önbelleği temizlendi ve ağ bağdaştırıcıları (DHCP) başarıyla yenilendi."
"#;
    let out = run_powershell(script);
    app.emit("log", "[+] Windows DNS önbelleği temizlendi ve bağdaştırıcılar yenilendi".to_string()).ok();
    Ok(out.trim().to_string())
}

#[tauri::command]
pub fn reset_network_stack(app: AppHandle) -> Result<String, String> {
    if !is_running_as_admin() {
        return Err("Ağ yığınını ve Winsock katmanını sıfırlamak için Windows Yönetici (Administrator) yetkisi gereklidir. Lütfen uygulamayı yönetici olarak başlatın.".into());
    }
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
netsh winsock reset
netsh int ip reset
ipconfig /flushdns
"Winsock kataloğu ve TCP/IP protokol yığını başarıyla sıfırlandı. Değişikliklerin tam devreye girmesi için bilgisayarınızı yeniden başlatmanız önerilir."
"#;
    let out = run_powershell(script);
    app.emit("log", "[+] Winsock ve TCP/IP ağ yığını başarıyla sıfırlandı".to_string()).ok();
    Ok(out.trim().to_string())
}

// ---------- GITHUB UPDATER & SÜRÜM YÖNETİMİ ----------

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UpdateInfoDto {
    pub has_update: bool,
    pub current_version: String,
    pub latest_version: String,
    pub release_name: String,
    pub release_notes: String,
    pub html_url: String,
    pub download_url: Option<String>,
    pub published_at: String,
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn open_browser_url(app: AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Geçersiz URL protokolü".into());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("URL açılamadı: {e}"))
}

#[derive(Deserialize)]
struct GhAsset {
    name: String,
    browser_download_url: String,
}

#[derive(Deserialize)]
struct GhRelease {
    tag_name: Option<String>,
    name: Option<String>,
    body: Option<String>,
    html_url: Option<String>,
    published_at: Option<String>,
    #[serde(default)]
    assets: Vec<GhAsset>,
}

/// GitHub Releases API'ye doğrudan HTTPS isteği (ureq/rustls) — önceden
/// PowerShell `Invoke-RestMethod` çağırıyordu (~300-600ms process-spawn
/// başına + kırılgan kısıtlı PowerShell ortamlarında).
#[tauri::command]
pub fn check_update(
    repo_override: Option<String>,
    token_override: Option<String>,
) -> Result<UpdateInfoDto, String> {
    let repo = repo_override
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "MonarchDevLab/Anticore".to_string());
    let current_ver = env!("CARGO_PKG_VERSION");

    let uri = format!("https://api.github.com/repos/{}/releases/latest", repo.trim());
    let mut req = ureq::get(&uri)
        .set("User-Agent", &format!("Anticore-Desktop/{current_ver}"))
        .set("Accept", "application/vnd.github+json")
        .timeout(std::time::Duration::from_secs(5));

    let token = token_override
        .filter(|s| !s.trim().is_empty())
        .or_else(|| std::env::var("GITHUB_TOKEN").ok())
        .or_else(|| std::env::var("GH_TOKEN").ok());

    if let Some(tok) = token {
        req = req.set("Authorization", &format!("Bearer {}", tok.trim()));
    }

    let resp = match req.call() {
        Ok(r) => r,
        Err(ureq::Error::Status(404, _)) => {
            return Err(format!(
                "GitHub deposu ({}) özel (private) modda veya henüz bir 'Release' yayımlanmamış. Güncelleme denetimi için geçerli bir GitHub Token tanımlayabilir veya depoyu genel erişime açabilirsiniz.",
                repo.trim()
            ));
        }
        Err(ureq::Error::Status(403, _)) => {
            return Err("GitHub API hız sınırı (rate limit) aşıldı veya yetkisiz erişim.".into());
        }
        Err(e) => {
            return Err(format!("Güncelleme sunucusuna ulaşılamadı (zaman aşımı veya ağ hatası): {e}"));
        }
    };

    let parsed: GhRelease = resp
        .into_json()
        .map_err(|e| format!("Yanıt ayrıştırılamadı: {e}"))?;

    let latest_tag = parsed.tag_name.unwrap_or_default();
    let has_update = is_newer_version(current_ver, &latest_tag);
    let download_url = parsed
        .assets
        .iter()
        .find(|a| {
            a.name.ends_with(".exe") || a.name.ends_with(".zip") || a.name.ends_with(".msi")
        })
        .map(|a| a.browser_download_url.clone());

    Ok(UpdateInfoDto {
        has_update,
        current_version: current_ver.to_string(),
        latest_version: latest_tag,
        release_name: parsed.name.unwrap_or_default(),
        release_notes: parsed.body.unwrap_or_default(),
        html_url: parsed.html_url.unwrap_or_else(|| format!("https://github.com/{repo}/releases")),
        download_url,
        published_at: parsed.published_at.unwrap_or_default(),
    })
}

#[tauri::command]
pub fn fetch_community_blacklist(app: AppHandle, engine: tauri::State<Engine>, source_url: Option<String>) -> Result<usize, String> {
    let url = source_url
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| {
            "https://raw.githubusercontent.com/alimali54/zapret-win-turkey/master/config/hostlist.txt".to_string()
        });

    let remote_text = ureq::get(&url)
        .set("User-Agent", "Anticore-Desktop/0.3.0")
        .timeout(std::time::Duration::from_secs(6))
        .call()
        .ok()
        .and_then(|resp| resp.into_string().ok());

    // Uzak liste indirilemediyse yerleşik genişletilmiş DEFAULT_BLACKLIST hedeflerini kullan
    let text = remote_text.unwrap_or_else(|| anticore_core::config::DEFAULT_BLACKLIST.to_string());

    let path = blacklist_path(&app);
    let existing_text = std::fs::read_to_string(&path).unwrap_or_default();
    let mut existing_set = std::collections::HashSet::new();
    let mut lines = Vec::new();

    for line in existing_text.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            if !trimmed.starts_with('#') {
                existing_set.insert(trimmed.to_ascii_lowercase());
            }
            lines.push(trimmed.to_string());
        }
    }

    let mut added_count = 0;
    lines.push("\n# --- Topluluk Listesinden İçe Aktarılanlar ---".to_string());

    for line in text.lines() {
        let trimmed = line.trim().trim_start_matches("*.").to_ascii_lowercase();
        if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.contains('/') || trimmed.contains(' ') {
            continue;
        }
        if !existing_set.contains(&trimmed) {
            existing_set.insert(trimmed.clone());
            lines.push(trimmed);
            added_count += 1;
        }
    }

    std::fs::write(&path, lines.join("\n"))
        .map_err(|e| format!("Hedef listesi kaydedilemedi: {e}"))?;

    let new_bl = load_blacklist(&app);
    engine.update_blacklist(new_bl);

    app.emit(
        "log",
        format!("[+] Topluluk listesinden {} yeni alan adı içe aktarıldı", added_count),
    )
    .ok();

    Ok(added_count)
}

/// `current`/`remote`, başında opsiyonel "v" ile, semver olarak karşılaştırılır.
/// Ayrıştırılamayan (semver-dışı) etiketler güncelleme YOK sayılır — hatalı
/// pozitif güncelleme bildirimi vermek, bildirim vermemekten daha kötüdür.
fn is_newer_version(current: &str, remote: &str) -> bool {
    let clean = |s: &str| s.trim().trim_start_matches('v').to_string();
    let (Ok(c), Ok(r)) = (
        semver::Version::parse(&clean(current)),
        semver::Version::parse(&clean(remote)),
    ) else {
        return false;
    };
    r > c
}

#[tauri::command]
pub fn window_close(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if crate::tray::get_tray_minimize_pref(&app) {
            let _ = window.hide();
        } else {
            let engine = app.state::<Engine>();
            if engine.running.load(Ordering::SeqCst) {
                let _ = engine.stop();
            }
            app.exit(0);
        }
    }
}

#[tauri::command]
pub fn window_minimize(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

#[tauri::command]
pub fn window_toggle_maximize(app: AppHandle) -> bool {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
            false
        } else {
            let _ = window.maximize();
            true
        }
    } else {
        false
    }
}

#[tauri::command]
pub fn window_is_maximized(app: AppHandle) -> bool {
    if let Some(window) = app.get_webview_window("main") {
        window.is_maximized().unwrap_or(false)
    } else {
        false
    }
}

#[tauri::command]
pub fn show_main_window(app: AppHandle) {
    if let Some(panel) = app.get_webview_window("quick-panel") {
        let _ = panel.hide();
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
pub fn hide_quick_panel(app: AppHandle) {
    if let Some(panel) = app.get_webview_window("quick-panel") {
        let _ = panel.hide();
    }
}

#[tauri::command]
pub fn exit_app(app: AppHandle, engine: tauri::State<Engine>) {
    let _ = stop_engine(app.clone(), engine);
    app.exit(0);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_newer_patch_and_minor() {
        assert!(is_newer_version("0.2.0", "v0.2.1"));
        assert!(is_newer_version("0.2.0", "0.3.0"));
        assert!(!is_newer_version("0.2.0", "0.2.0"));
        assert!(!is_newer_version("0.3.0", "0.2.9"));
    }

    #[test]
    fn unparseable_tags_report_no_update() {
        assert!(!is_newer_version("0.2.0", "not-a-version"));
        assert!(!is_newer_version("0.2.0", ""));
    }

    #[test]
    fn doh_status_dto_roundtrip() {
        let dto = DohStatusDto {
            enabled: true,
            auto_doh_value: 2,
            template: Some("https://dns.google/dns-query".into()),
        };
        let json = serde_json::to_string(&dto).unwrap();
        let parsed: DohStatusDto = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.enabled, true);
        assert_eq!(parsed.auto_doh_value, 2);
        assert_eq!(parsed.template.as_deref(), Some("https://dns.google/dns-query"));
    }

    #[test]
    fn adapter_dns_info_roundtrip() {
        let info = AdapterDnsInfo {
            name: "Ethernet".into(),
            description: "Realtek PCIe GbE Family Controller".into(),
            interface_index: 12,
            ipv4_servers: vec!["8.8.8.8".into(), "8.8.4.4".into()],
            ipv6_servers: vec!["2001:4860:4860::8888".into()],
            is_dhcp: false,
        };
        let json = serde_json::to_string(&info).unwrap();
        let parsed: AdapterDnsInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.name, "Ethernet");
        assert_eq!(parsed.ipv4_servers.len(), 2);
        assert_eq!(parsed.is_dhcp, false);
    }

    #[test]
    fn legacy_service_dto_roundtrip() {
        let dto = LegacyServiceDto {
            id: "GoodbyeDPI".into(),
            name: "GoodbyeDPI Servisi".into(),
            status: "RUNNING".into(),
            installed: true,
        };
        let json = serde_json::to_string(&dto).unwrap();
        let parsed: LegacyServiceDto = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, "GoodbyeDPI");
        assert_eq!(parsed.installed, true);
    }

    #[test]
    fn iso8601_format_structure() {
        let ts = crate::service::format_iso8601_now();
        assert_eq!(ts.len(), 20);
        assert!(ts.ends_with('Z'));
        assert_eq!(&ts[10..11], "T");
    }

    #[test]
    fn batch_domains_filter_logic() {
        let incoming = vec![
            "  EXAMPLE.COM  ".to_string(),
            "invalid_domain".to_string(),
            "domain with space.com".to_string(),
            "".to_string(),
            "example.com".to_string(),
            "new-site.org".to_string(),
        ];
        let mut existing = std::collections::HashSet::new();
        existing.insert("example.com".to_string());
        let mut added = 0;
        for d in incoming {
            let clean = d.trim().to_lowercase();
            if !clean.is_empty() && clean.contains('.') && !clean.contains(' ') && existing.insert(clean) {
                added += 1;
            }
        }
        assert_eq!(added, 1);
        assert!(existing.contains("new-site.org"));
    }

    #[test]
    fn test_is_poisoned_or_bogus_ip() {
        use std::net::IpAddr;

        // TTNet / BTK mahkeme kararı sahte engelleme IP'leri
        let btk_1: IpAddr = "195.175.254.2".parse().unwrap();
        let btk_2: IpAddr = "212.156.4.1".parse().unwrap();
        assert!(is_poisoned_or_bogus_ip(&btk_1));
        assert!(is_poisoned_or_bogus_ip(&btk_2));

        // Superonline engelleme IP'leri
        let sol_1: IpAddr = "213.74.1.1".parse().unwrap();
        let sol_2: IpAddr = "85.29.16.1".parse().unwrap();
        let sol_3: IpAddr = "212.252.0.1".parse().unwrap();
        assert!(is_poisoned_or_bogus_ip(&sol_1));
        assert!(is_poisoned_or_bogus_ip(&sol_2));
        assert!(is_poisoned_or_bogus_ip(&sol_3));

        // Vodafone TR engelleme IP'si
        let voda: IpAddr = "212.65.128.1".parse().unwrap();
        assert!(is_poisoned_or_bogus_ip(&voda));

        // Loopback / Sıfır / Bogon IP'ler
        let loopback: IpAddr = "127.0.0.1".parse().unwrap();
        let zero: IpAddr = "0.0.0.0".parse().unwrap();
        let private_c: IpAddr = "192.168.1.1".parse().unwrap();
        let private_a: IpAddr = "10.0.0.1".parse().unwrap();
        let cgnat: IpAddr = "100.64.0.1".parse().unwrap();
        assert!(is_poisoned_or_bogus_ip(&loopback));
        assert!(is_poisoned_or_bogus_ip(&zero));
        assert!(is_poisoned_or_bogus_ip(&private_c));
        assert!(is_poisoned_or_bogus_ip(&private_a));
        assert!(is_poisoned_or_bogus_ip(&cgnat));

        // Temiz gerçek genel internet ve DNS IP'leri (False pozitif olmamalı)
        let cf_discord: IpAddr = "162.159.135.234".parse().unwrap();
        let cf_dns: IpAddr = "1.1.1.1".parse().unwrap();
        let google_dns: IpAddr = "8.8.8.8".parse().unwrap();
        assert!(!is_poisoned_or_bogus_ip(&cf_discord));
        assert!(!is_poisoned_or_bogus_ip(&cf_dns));
        assert!(!is_poisoned_or_bogus_ip(&google_dns));

        // IPv6 testleri
        let btk_v6: IpAddr = "2a00:1368::1".parse().unwrap();
        let clean_v6: IpAddr = "2606:4700:4700::1111".parse().unwrap();
        let loopback_v6: IpAddr = "::1".parse().unwrap();
        assert!(is_poisoned_or_bogus_ip(&btk_v6));
        assert!(is_poisoned_or_bogus_ip(&loopback_v6));
        assert!(!is_poisoned_or_bogus_ip(&clean_v6));
    }
}
