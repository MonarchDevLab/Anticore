// Konsol penceresi kapalı (Sadece saf GUI)
#![windows_subsystem = "windows"]

mod commands;
pub mod net_teardown;
mod service;
mod tray;

use service::Engine;

fn main() {
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC: {info}\n");
        let _ = std::fs::write("panic.log", &msg);
    }));

    match tauri::Builder::default()
        .manage(Engine::new())
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
            commands::restart_as_admin,
            commands::probe_target,
            commands::get_dns_servers,
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
            commands::fetch_community_blacklist,
            commands::get_app_version,
            commands::open_browser_url,
            commands::window_close,
            commands::window_minimize,
            commands::window_toggle_maximize,
            commands::window_is_maximized,
            tray::get_tray_minimize,
            tray::set_tray_minimize,
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
