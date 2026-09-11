// Konsol penceresi kapalı (Sadece saf GUI)
#![windows_subsystem = "windows"]

mod commands;
pub mod lan_share;
pub mod net_teardown;
mod service;
mod tray;

use service::Engine;

fn main() {
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC: {info}\n");
        let _ = std::fs::write("panic.log", &msg);
    }));

    // Windows altında yönetici hakları zorunluluğu: uygulama standart
    // kullanıcı olarak başlatıldıysa kendini UAC ile otomatik yükseltir.
    #[cfg(windows)]
    if !commands::is_running_as_admin() {
        let args: Vec<String> = std::env::args().collect();
        if !args.iter().any(|a| a == "--no-elevate") {
            if let Ok(exe) = std::env::current_exe() {
                let exe_str = exe.to_string_lossy().replace('\'', "''");
                let forwarded_args: Vec<String> = args
                    .iter()
                    .skip(1)
                    .map(|a| format!("'{}'", a.replace('\'', "''")))
                    .collect();
                let arg_list = if forwarded_args.is_empty() {
                    String::new()
                } else {
                    format!("-ArgumentList @({})", forwarded_args.join(", "))
                };
                let script = format!(
                    "try {{ Start-Process -FilePath '{}' {} -Verb RunAs -ErrorAction Stop }} catch {{ exit 1 }}",
                    exe_str, arg_list
                );
                let status = std::process::Command::new("powershell")
                    .args(["-NoProfile", "-NonInteractive", "-Command", &script])
                    .status();
                if let Ok(st) = status {
                    if st.success() {
                        // Yeni yönetici örneği tetiklendi; mevcut standart örneği sonlandır.
                        std::process::exit(0);
                    }
                }
            }
        }
    }

    match tauri::Builder::default()
        .manage(Engine::new())
        .manage(lan_share::LanProxyState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            use tauri::Manager;
            // Güncelleme indir/kur/yeniden başlat akışını yönetir; sürüm
            // kontrolü ve bildirim katmanı hâlâ `commands::check_update`.
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            tray::setup(app)?;
            let args: Vec<String> = std::env::args().collect();
            let start_hidden = args.iter().any(|a| a == "--hidden" || a == "--minimized" || a == "-m");

            if let Some(window) = app.get_webview_window("main") {
                let window_for_close = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        tray::handle_close_request(&window_for_close, api);
                    }
                });
                if !start_hidden {
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _ = window.hide();
                }
            }
            if let Some(panel) = app.get_webview_window("quick-panel") {
                let panel_clone = panel.clone();
                panel.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = panel_clone.hide();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_status,
            commands::list_profiles,
            commands::save_profile,
            commands::delete_profile,
            commands::get_blacklist,
            commands::add_site,
            commands::add_sites,
            commands::remove_site,
            commands::resolve_domain,
            commands::export_sites_to_file,
            commands::start_engine,
            commands::stop_engine,
            commands::check_is_admin,
            commands::restart_as_admin,
            commands::probe_target,
            commands::get_dns_servers,
            commands::check_dns_health,
            commands::auto_fix_dns,
            commands::apply_secure_dns,
            commands::reset_dns,
            commands::get_engine_config,
            commands::set_engine_config,
            commands::get_setup_status,
            commands::install_service,
            commands::uninstall_service,
            commands::detached_start,
            commands::detached_stop,
            commands::check_compatibility,
            commands::auto_discover_profile,
            commands::cleanup_legacy_services,
            commands::get_startup_enabled,
            commands::set_startup_enabled,
            commands::apply_doh_registry,
            commands::reset_doh_registry,
            commands::dns_leak_test,
            commands::repair_discord_updates,
            commands::clear_discord_cache,
            commands::flush_dns_and_renew_adapters,
            commands::reset_network_stack,
            commands::get_adapter_dns_info,
            commands::get_log_file,
            commands::clear_log_file,
            commands::export_log_to_file,
            commands::export_profiles_to_file,
            commands::import_profiles_from_file,
            commands::scan_legacy_services,
            commands::get_doh_status,
            commands::factory_reset,
            commands::check_update,
            commands::send_system_notification,
            commands::fetch_community_blacklist,
            commands::get_app_version,
            commands::open_browser_url,
            commands::window_close,
            commands::window_minimize,
            commands::window_toggle_maximize,
            commands::window_is_maximized,
            commands::show_main_window,
            commands::hide_quick_panel,
            commands::exit_app,
            tray::get_tray_minimize,
            tray::set_tray_minimize,
            lan_share::get_lan_info,
            lan_share::start_lan_proxy,
            lan_share::stop_lan_proxy,
            lan_share::open_hotspot_settings,
            lan_share::set_lan_share_hotspot_mode,
        ])
        .run(tauri::generate_context!())
    {
        Ok(_) => {}
        Err(e) => {
            let msg = format!("TAURI HATA: {e:?}\n");
            let _ = std::fs::write("tauri_error.log", &msg);
        }
    }
}
