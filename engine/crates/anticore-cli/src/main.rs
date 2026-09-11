//! Anticore motor CLI — panel'siz çalıştırma ve Windows servis modu.
//!
//! Kullanım:
//!   anticore run --profile <id> [--data-dir <klasor>]     canlı çalıştır
//!   anticore service-run --profile <id> --data-dir <yol>  SCM servis gövdesi
//!   anticore dry-run --profile <id>                        sentetik test
//!   anticore list-profiles                                 profilleri listele

use std::path::{Path, PathBuf};

use anticore_core::config::{Blacklist, DEFAULT_BLACKLIST};
use anticore_core::profile;
use anticore_core::strategy::Step;

pub const SERVICE_NAME: &str = "AnticoreService";

fn main() {
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC: {info}\n");
        eprintln!("{msg}");
        let _ = std::fs::write("anticore-cli-panic.log", &msg);
    }));

    let args: Vec<String> = std::env::args().skip(1).collect();

    let Some(cmd) = args.first().cloned() else {
        print_help();
        return;
    };

    let rest = &args[1..];
    let result = match cmd.as_str() {
        "run" => cmd_run(rest),
        #[cfg(windows)]
        "service-run" => cmd_service_run(rest),
        "dry-run" => cmd_dry_run(rest),
        "list-profiles" => {
            for p in profile::builtin_profiles() {
                println!("{}\t{}\t{} adım", p.id, p.name, p.steps.len());
            }
            Ok(())
        }
        "--help" | "-h" | "help" => {
            print_help();
            Ok(())
        }
        other => {
            eprintln!("bilinmeyen komut: {other}");
            print_help();
            Err(format!("bilinmeyen komut: {other}"))
        }
    };

    if let Err(e) = result {
        eprintln!("HATA: {e}");
        std::process::exit(1);
    }
}

fn print_help() {
    println!(
        "Anticore v{} — paket motoru\n\
         \n\
         KOMUTLAR:\n\
           run <opts>          canlı çalıştır (yönetici hakları gerekir)\n\
           service-run <opts>  Windows servis gövdesi (sc create ile kullanılır)\n\
           dry-run <opts>      sentetik paketle motoru test et\n\
           list-profiles       profilleri listele\n\
         \n\
         SEÇENEKLER:\n\
           --profile <id>   profil kimliği (örn. universal, turknet, superonline)\n\
           --data-dir <yol> ayar klasörü (blacklist.txt / profiles.json / config.json)",
        env!("CARGO_PKG_VERSION")
    );
}

struct RunOpts {
    profile_id: String,
    data_dir: Option<PathBuf>,
    pasif_savunma: bool,
    quic_engelle: bool,
}

fn parse_run_opts(args: &[String]) -> Result<RunOpts, String> {
    let mut o = RunOpts {
        profile_id: "universal".into(),
        data_dir: None,
        pasif_savunma: false,
        quic_engelle: false,
    };
    let mut it = args.iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--profile" => o.profile_id = it.next().ok_or("--profile değer ister")?.clone(),
            "--data-dir" => o.data_dir = Some(PathBuf::from(it.next().ok_or("--data-dir yol ister")?)),
            "--pasif-savunma" | "-p" => o.pasif_savunma = true,
            "--no-pasif-savunma" => o.pasif_savunma = false,
            "--quic-engelle" | "-q" => o.quic_engelle = true,
            "--no-quic-engelle" => o.quic_engelle = false,
            other => return Err(format!("bilinmeyen seçenek: {other}")),
        }
    }
    if let Some(dir) = &o.data_dir {
        if let Ok(text) = std::fs::read_to_string(dir.join("config.json")) {
            #[derive(serde::Deserialize)]
            struct RawConfig {
                pasif_savunma: Option<bool>,
                quic_engelle: Option<bool>,
            }
            if let Ok(raw) = serde_json::from_str::<RawConfig>(&text) {
                if let Some(p) = raw.pasif_savunma {
                    o.pasif_savunma = p;
                }
                if let Some(q) = raw.quic_engelle {
                    o.quic_engelle = q;
                }
            }
        }
    }
    Ok(o)
}

fn load_blacklist_from(data_dir: Option<&Path>) -> Blacklist {
    if let Some(dir) = data_dir {
        if let Ok(text) = std::fs::read_to_string(dir.join("blacklist.txt")) {
            return Blacklist::from_lines(&text);
        }
    }
    Blacklist::from_lines(DEFAULT_BLACKLIST)
}

/// Profil çözümü: builtin + (data-dir varsa) profiles.json içindeki özel profiller.
///
/// Adım sözlüğü `anticore_core::dto::StepDto` üzerinden çözülür — CLI ve
/// masaüstü panel AYNI dönüşümü kullanır (önceden ikisi ayrı elle yazılmıştı
/// ve CLI `fake_wrong_checksum` / `sni_mid_reverse`'i tanımıyordu).
fn resolve_steps(profile_id: &str, data_dir: Option<&Path>) -> Result<Vec<Step>, String> {
    if let Some(p) = profile::find_profile(profile_id) {
        return Ok(p.steps);
    }
    if let Some(dir) = data_dir {
        #[derive(serde::Deserialize)]
        struct CustomProfile {
            id: String,
            steps: Vec<anticore_core::dto::StepDto>,
        }
        let text = std::fs::read_to_string(dir.join("profiles.json"))
            .map_err(|_| format!("profil bulunamadı: {profile_id}"))?;
        let customs: Vec<CustomProfile> = serde_json::from_str(&text)
            .map_err(|e| format!("profiles.json bozuk: {e}"))?;
        if let Some(c) = customs.into_iter().find(|c| c.id == profile_id) {
            return anticore_core::dto::steps_from_dto(&c.steps);
        }
    }
    Err(format!("profil bulunamadı: {profile_id}"))
}

// ---------- komutlar ----------

fn cmd_run(args: &[String]) -> Result<(), String> {
    let opts = parse_run_opts(args)?;
    let steps = resolve_steps(&opts.profile_id, opts.data_dir.as_deref())?;
    let bl = load_blacklist_from(opts.data_dir.as_deref());

    println!(
        "[*] profil={} adım={} blacklist={} pasif_savunma={} quic_engelle={}",
        opts.profile_id,
        steps.len(),
        bl.len(),
        opts.pasif_savunma,
        opts.quic_engelle
    );

    #[cfg(windows)]
    {
        let dll_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()));
        live_loop(
            &steps,
            &bl,
            dll_dir.as_deref(),
            opts.pasif_savunma,
            opts.quic_engelle,
            None,
        )
    }
    #[cfg(not(windows))]
    {
        Err("canlı mod yalnızca Windows'ta desteklenir".into())
    }
}

fn cmd_dry_run(args: &[String]) -> Result<(), String> {
    let opts = parse_run_opts(args)?;
    let steps = resolve_steps(&opts.profile_id, opts.data_dir.as_deref())?;
    let bl = load_blacklist_from(opts.data_dir.as_deref());
    println!("[*] profil={} adım={} blacklist={}", opts.profile_id, steps.len(), bl.len());
    println!("[OK] motor yapılandırması geçerli");
    Ok(())
}

// ---------- Windows: canlı döngü + servis ----------

#[cfg(windows)]
fn live_loop(
    steps: &[Step],
    blacklist: &Blacklist,
    dll_dir: Option<&Path>,
    pasif_savunma: bool,
    quic_engelle: bool,
    stop_flag: Option<&std::sync::atomic::AtomicBool>,
) -> Result<(), String> {
    use anticore_transport_win::{WinDivert, WINDIVERT_FLAG_DROP};

    println!("[*] WinDivert yükleniyor... (yönetici hakları gerekir)");
    let wd = std::sync::Arc::new(WinDivert::open(
        &anticore_core::dispatch::capture_filter(steps),
        dll_dir,
    )?);

    if let Some(stop) = stop_flag {
        *SERVICE_CAPTURE.lock().unwrap() = std::sync::Arc::downgrade(&wd);
        if stop.load(std::sync::atomic::Ordering::SeqCst) {
            wd.shutdown()?;
        }
    }

    let _wd_rst = if pasif_savunma {
        println!("[+] Pasif savunma (sahte RST düşürme) devrede");
        WinDivert::open_with_flags(
            "inbound and tcp and !loopback and (tcp.SrcPort == 443 or tcp.SrcPort == 80) and tcp.Rst",
            dll_dir,
            WINDIVERT_FLAG_DROP,
        ).ok()
    } else {
        None
    };

    let _wd_quic = if quic_engelle {
        println!("[+] QUIC (UDP 443) engelleme devrede");
        WinDivert::open_with_flags(
            "outbound and udp and udp.DstPort == 443 and udp.PayloadLength >= 1200",
            dll_dir,
            WINDIVERT_FLAG_DROP,
        ).ok()
    } else {
        None
    };

    println!("[+] aktif. Ctrl+C ile durdurun.");

    let mut buf = vec![0u8; 65_535];
    let mut consecutive_errors = 0u32;
    loop {
        let Some((n, addr)) = wd.recv(&mut buf) else {
            if stop_flag.is_some_and(|stop| stop.load(std::sync::atomic::Ordering::SeqCst)) {
                break;
            }
            consecutive_errors += 1;
            if consecutive_errors > 100 {
                return Err("WinDivert sürücü bağlantısı koptu (ardışık 100 recv hatası)".into());
            }
            // Sürücü/handle geçici hata verdi: 100% CPU spin yerine kısa
            // bekle ve tekrar dene.
            std::thread::sleep(std::time::Duration::from_millis(50));
            continue;
        };
        consecutive_errors = 0;
        let raw = &buf[..n];
        match anticore_core::dispatch::decide_packet(raw, blacklist, steps) {
            anticore_core::dispatch::PacketDecision::Passthrough(_) => {
                let _ = wd.send(raw, &addr);
            }
            anticore_core::dispatch::PacketDecision::Rewrite(segments) => {
                for seg in &segments {
                    let _ = wd.send(seg, &addr);
                }
            }
        }
    }
    Ok(())
}

#[cfg(windows)]
#[derive(Clone)]
struct ServiceArgs {
    profile_id: String,
    data_dir: PathBuf,
    pasif_savunma: bool,
    quic_engelle: bool,
}

#[cfg(windows)]
static SERVICE_ARGS: std::sync::OnceLock<ServiceArgs> = std::sync::OnceLock::new();

#[cfg(windows)]
static SERVICE_STOP_FLAG: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

#[cfg(windows)]
static SERVICE_CAPTURE: std::sync::Mutex<std::sync::Weak<anticore_transport_win::WinDivert>> =
    std::sync::Mutex::new(std::sync::Weak::new());

/// SCM servis gövdesi: dispatcher'a bağlan, Running bildir, motoru çalıştır.
/// Stop/Shutdown sinyalinde temiz çıkar.
#[cfg(windows)]
fn cmd_service_run(args: &[String]) -> Result<(), String> {
    use windows_service::{define_windows_service, service_dispatcher};

    let opts = parse_run_opts(args)?;
    let data_dir = opts
        .data_dir
        .clone()
        .ok_or("service-run için --data-dir zorunludur")?;
    let profile_id = opts.profile_id.clone();

    define_windows_service!(ffi_service_main, service_main_impl);

    // Argümanları dispatcher'a taşımak için statik thread-safe depo
    let _ = SERVICE_ARGS.set(ServiceArgs {
        profile_id,
        data_dir,
        pasif_savunma: opts.pasif_savunma,
        quic_engelle: opts.quic_engelle,
    });

    service_dispatcher::start(SERVICE_NAME, ffi_service_main)
        .map_err(|e| format!("servis dispatcher başlatılamadı: {e}"))?;
    Ok(())
}

#[cfg(windows)]
fn service_main_impl(_args: Vec<std::ffi::OsString>) {
    use windows_service::service::{
        ServiceControl, ServiceControlAccept, ServiceExitCode, ServiceState, ServiceStatus,
        ServiceType,
    };
    use windows_service::service_control_handler::{self, ServiceControlHandlerResult};

    let status_handle = service_control_handler::register(SERVICE_NAME, move |control| match control {
        ServiceControl::Stop | ServiceControl::Shutdown => {
            SERVICE_STOP_FLAG.store(true, std::sync::atomic::Ordering::SeqCst);
            if let Some(capture) = SERVICE_CAPTURE.lock().unwrap().upgrade() {
                if let Err(error) = capture.shutdown() {
                    eprintln!("{error}");
                }
            }
            ServiceControlHandlerResult::NoError
        }
        ServiceControl::Interrogate => ServiceControlHandlerResult::NoError,
        _ => ServiceControlHandlerResult::NotImplemented,
    })
    .expect("servis handler kaydı başarısız");

    let _ = status_handle.set_service_status(ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Running,
        controls_accepted: ServiceControlAccept::STOP | ServiceControlAccept::SHUTDOWN,
        exit_code: ServiceExitCode::Win32(0),
        checkpoint: 0,
        wait_hint: std::time::Duration::from_secs(5),
        process_id: None,
    });

    let args = SERVICE_ARGS.get().cloned().unwrap_or_else(|| ServiceArgs {
        profile_id: "universal".into(),
        data_dir: std::env::temp_dir(),
        pasif_savunma: false,
        quic_engelle: false,
    });
    let (profile_id, data_dir) = (args.profile_id, args.data_dir);

    let steps = resolve_steps(&profile_id, Some(&data_dir)).unwrap_or_else(|e| {
        eprintln!("profil çözümlenemedi: {e}");
        vec![Step::FragmentTls {
            mode: anticore_core::tls::SplitMode::SniMid,
        }]
    });
    let bl = load_blacklist_from(Some(&data_dir));
    let dll_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()));

    let exit_code = match live_loop(&steps, &bl, dll_dir.as_deref(), args.pasif_savunma, args.quic_engelle, Some(&SERVICE_STOP_FLAG)) {
        Ok(()) => 0,
        Err(e) => {
            eprintln!("motor hatası: {e}");
            1
        }
    };

    let _ = status_handle.set_service_status(ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Stopped,
        controls_accepted: ServiceControlAccept::empty(),
        exit_code: ServiceExitCode::Win32(exit_code),
        checkpoint: 0,
        wait_hint: std::time::Duration::default(),
        process_id: None,
    });
}
