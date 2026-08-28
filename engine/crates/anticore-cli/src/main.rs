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
            "--quic-engelle" | "-q" => o.quic_engelle = true,
            other => return Err(format!("bilinmeyen seçenek: {other}")),
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
) -> Result<(), String> {
    use anticore_transport_win::{WinDivert, WINDIVERT_FLAG_DROP};

    println!("[*] WinDivert yükleniyor... (yönetici hakları gerekir)");
    let wd = WinDivert::open(
        "outbound and tcp and (tcp.DstPort == 443 or tcp.DstPort == 80)",
        dll_dir,
    )?;

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
    loop {
        let Some((n, addr)) = wd.recv(&mut buf) else {
            // Sürücü/handle geçici hata verdi: 100% CPU spin yerine kısa
            // bekle ve tekrar dene (masaüstü paneliyle aynı davranış).
            std::thread::sleep(std::time::Duration::from_millis(50));
            continue;
        };
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
}

/// SCM servis gövdesi: dispatcher'a bağlan, Running bildir, motoru çalıştır.
/// Stop/Shutdown sinyalinde anında çıkar (handle'lar OS'ta kapanır).
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

    // Argümanları dispatcher'a taşımak için statik depo
    SERVICE_ARGS.with(|cell| {
        cell.borrow_mut().replace((profile_id, data_dir));
    });

    service_dispatcher::start(SERVICE_NAME, ffi_service_main)
        .map_err(|e| format!("servis dispatcher başlatılamadı: {e}"))?;
    Ok(())
}

#[cfg(windows)]
thread_local! {
    static SERVICE_ARGS: std::cell::RefCell<Option<(String, PathBuf)>> =
        const { std::cell::RefCell::new(None) };
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
            // Handle'lar process çıkışında OS tarafından kapatılır.
            std::process::exit(0);
            #[allow(unreachable_code)]
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

    let (profile_id, data_dir) = SERVICE_ARGS
        .with(|cell| cell.borrow().clone())
        .unwrap_or_else(|| ("universal".into(), std::env::temp_dir()));

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

    if let Err(e) = live_loop(&steps, &bl, dll_dir.as_deref(), false, true) {
        eprintln!("motor hatası: {e}");
        let _ = status_handle.set_service_status(ServiceStatus {
            service_type: ServiceType::OWN_PROCESS,
            current_state: ServiceState::Stopped,
            controls_accepted: ServiceControlAccept::empty(),
            exit_code: ServiceExitCode::Win32(1),
            checkpoint: 0,
            wait_hint: std::time::Duration::default(),
            process_id: None,
        });
    }
}
