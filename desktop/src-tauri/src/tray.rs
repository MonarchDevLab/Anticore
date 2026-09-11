//! Sistem tepsisi (tray) + pencere kapatma davranışı.
//!
//! "Tray'e küçült" tercihi `<app_data>/tray_settings.json` içinde kalıcılaşır
//! — motor `config.json`'dan bilinçli olarak AYRI: bu bir arayüz tercihidir,
//! motor çalışırken de değiştirilebilmeli (motor config'i tersine, motor
//! durdurulmadan değiştirilemez).

use std::sync::atomic::Ordering;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Listener, Manager,
};

use crate::service::Engine;

#[derive(Serialize, Deserialize)]
struct TraySettings {
    minimize_to_tray: bool,
}

impl Default for TraySettings {
    fn default() -> Self {
        // Varsayılan AÇIK: bu tarz arka plan koruma araçlarında beklenen
        // davranış pencereyi kapatmanın korumayı durdurmaması.
        Self { minimize_to_tray: true }
    }
}

fn settings_path(app: &AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let _ = std::fs::create_dir_all(&dir);
    dir.join("tray_settings.json")
}

pub fn get_tray_minimize_pref(app: &AppHandle) -> bool {
    std::fs::read_to_string(settings_path(app))
        .ok()
        .and_then(|s| serde_json::from_str::<TraySettings>(&s).ok())
        .unwrap_or_default()
        .minimize_to_tray
}

fn save_tray_minimize_pref(app: &AppHandle, enabled: bool) -> Result<(), String> {
    let text = serde_json::to_string_pretty(&TraySettings {
        minimize_to_tray: enabled,
    })
    .map_err(|e| e.to_string())?;
    std::fs::write(settings_path(app), text).map_err(|e| e.to_string())
}

// ---------- IPC ----------

#[tauri::command]
pub fn get_tray_minimize(app: AppHandle) -> bool {
    get_tray_minimize_pref(&app)
}

#[tauri::command]
pub fn set_tray_minimize(app: AppHandle, enabled: bool) -> Result<(), String> {
    save_tray_minimize_pref(&app, enabled)
}

// ---------- Kurulum ----------

/// Tray simgesi + menü + olay dinleyicileri kurar. `app.manage()` ile
/// saklanan `TrayHandles`, motor durumu değiştikçe (status_changed olayı)
/// tepsi ipucu (tooltip) metnini ve menü öğesi etiketini günceller.
#[cfg(target_os = "macos")]
fn position_quick_panel(panel: &tauri::WebviewWindow, tray_rect: &tauri::Rect) {
    if let Ok(Some(monitor)) = panel.current_monitor() {
        let scale = monitor.scale_factor();
        let work_area = monitor.work_area();
        let panel_width = (340.0 * scale) as i32;

        let tray_pos = tray_rect.position.to_physical::<i32>(scale);
        let tray_size = tray_rect.size.to_physical::<u32>(scale);

        let target_x = if tray_size.width > 0 {
            tray_pos.x + (tray_size.width as i32 / 2) - (panel_width / 2)
        } else {
            work_area.position.x + work_area.size.width as i32 - panel_width - 12
        };

        let clamped_x = target_x.clamp(
            work_area.position.x + 8,
            work_area.position.x + work_area.size.width as i32 - panel_width - 8,
        );

        // macOS: Menü çubuğu ekranın en üstündedir; panel simgenin dikey altından (6px boşlukla) açılır
        let target_y = tray_pos.y + tray_size.height as i32 + (6.0 * scale) as i32;

        let _ = panel.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: clamped_x,
            y: target_y,
        }));
    }
}

#[cfg(not(target_os = "macos"))]
fn position_quick_panel(panel: &tauri::WebviewWindow, tray_rect: &tauri::Rect) {
    if let Ok(Some(monitor)) = panel.current_monitor() {
        let scale = monitor.scale_factor();
        let work_area = monitor.work_area();
        let panel_width = (340.0 * scale) as i32;
        let panel_height = (460.0 * scale) as i32;

        let tray_pos = tray_rect.position.to_physical::<i32>(scale);
        let tray_size = tray_rect.size.to_physical::<u32>(scale);

        let target_x = if tray_size.width > 0 {
            tray_pos.x + (tray_size.width as i32 / 2) - (panel_width / 2)
        } else {
            work_area.position.x + work_area.size.width as i32 - panel_width - 12
        };

        let clamped_x = target_x.clamp(
            work_area.position.x + 8,
            work_area.position.x + work_area.size.width as i32 - panel_width - 8,
        );

        let clamped_y = (work_area.position.y + work_area.size.height as i32 - panel_height - 8)
            .max(work_area.position.y + 8);

        let _ = panel.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: clamped_x,
            y: clamped_y,
        }));
    }
}

pub fn setup(app: &tauri::App) -> tauri::Result<()> {
    let engine = app.state::<Engine>();
    let is_running = engine.running.load(Ordering::SeqCst);

    let show_i = MenuItem::with_id(app, "show", "Aç", true, None::<&str>)?;
    let start_i = MenuItem::with_id(app, "start", "Başlat", !is_running, None::<&str>)?;
    let stop_i = MenuItem::with_id(app, "stop", "Durdur", is_running, None::<&str>)?;
    let update_i = MenuItem::with_id(app, "check_update", "Güncellemeleri Kontrol Et", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Kapat", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &PredefinedMenuItem::separator(app)?,
            &start_i,
            &stop_i,
            &PredefinedMenuItem::separator(app)?,
            &update_i,
            &PredefinedMenuItem::separator(app)?,
            &quit_i,
        ],
    )?;

    let icon_active = Some(tauri::include_image!("icons/32x32.png"));
    let icon_inactive = Some(tauri::include_image!("icons/32x32-inactive.png"));

    let mut builder = TrayIconBuilder::new()
        .tooltip(if is_running { "Anticore — Aktif" } else { "Anticore — Pasif" })
        .menu(&menu)
        .show_menu_on_left_click(false);
    if let Some(icon) = if is_running { icon_active.as_ref() } else { icon_inactive.as_ref() } {
        builder = builder.icon(icon.clone());
    }
    let click_count = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));
    let click_counter = click_count.clone();
    let last_double_click = std::sync::Arc::new(std::sync::Mutex::new(
        std::time::Instant::now() - std::time::Duration::from_secs(10),
    ));

    let tray = builder
        .on_tray_icon_event(move |tray, event| {
            match event {
                TrayIconEvent::DoubleClick {
                    button: MouseButton::Left,
                    ..
                } => {
                    *last_double_click.lock().unwrap() = std::time::Instant::now();
                    // Çift tıklama algılandı: bekleyen tek tık görevini iptal et ve ana pencereyi aç
                    click_counter.fetch_add(1, Ordering::SeqCst);
                    let app = tray.app_handle();
                    if let Some(panel) = app.get_webview_window("quick-panel") {
                        let _ = panel.hide();
                    }
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.unminimize();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    rect,
                    ..
                } => {
                    if last_double_click.lock().unwrap().elapsed() < std::time::Duration::from_millis(500) {
                        return;
                    }
                    let app = tray.app_handle().clone();
                    let current_gen = click_counter.fetch_add(1, Ordering::SeqCst) + 1;
                    let counter = click_counter.clone();

                    tauri::async_runtime::spawn(async move {
                        tokio::time::sleep(std::time::Duration::from_millis(220)).await;
                        // Eğer aradan geçen 220ms içinde çift tıklama veya yeni bir tık gelmediyse aç
                        if counter.load(Ordering::SeqCst) == current_gen {
                            if let Some(panel) = app.get_webview_window("quick-panel") {
                                let is_vis = panel.is_visible().unwrap_or(false);
                                if is_vis {
                                    let _ = panel.hide();
                                } else {
                                    position_quick_panel(&panel, &rect);
                                    let _ = panel.show();
                                    let _ = panel.set_focus();
                                }
                            } else if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    });
                }
                _ => {}
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(panel) = app.get_webview_window("quick-panel") {
                    let _ = panel.hide();
                }
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "start" => {
                let engine = app.state::<Engine>();
                if !engine.running.load(Ordering::SeqCst) {
                    let profile_id = engine.profile_id.lock().unwrap().clone();
                    let _ = crate::commands::start_engine(app.clone(), engine, profile_id);
                }
            }
            "stop" => {
                let engine = app.state::<Engine>();
                if engine.running.load(Ordering::SeqCst) {
                    let _ = crate::commands::stop_engine(app.clone(), engine);
                }
            }
            "check_update" => {
                if let Some(panel) = app.get_webview_window("quick-panel") {
                    let _ = panel.hide();
                }
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app.emit("open_update_modal", ());
            }
            "quit" => {
                let engine = app.state::<Engine>();
                let _ = crate::commands::prepare_for_update(app.clone(), engine);
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    app.manage(TrayHandles {
        tray: Mutex::new(tray),
        start_item: start_i,
        stop_item: stop_i,
    });

    let app_handle = app.handle().clone();
    let app_handle_for_listen = app_handle.clone();
    let active_icon_clone = icon_active.clone();
    let inactive_icon_clone = icon_inactive.clone();
    app_handle_for_listen.listen("status_changed", move |event| {
        let running: bool = serde_json::from_str(event.payload()).unwrap_or(false);
        if let Some(handles) = app_handle.try_state::<TrayHandles>() {
            let _ = handles.start_item.set_enabled(!running);
            let _ = handles.stop_item.set_enabled(running);
            if let Ok(tray) = handles.tray.lock() {
                let _ = tray.set_tooltip(Some(if running {
                    "Anticore — Aktif"
                } else {
                    "Anticore — Pasif"
                }));
                let target_icon = if running {
                    active_icon_clone.as_ref()
                } else {
                    inactive_icon_clone.as_ref()
                };
                if let Some(icon) = target_icon {
                    let _ = tray.set_icon(Some(icon.clone()));
                }
            }
        }
    });

    Ok(())
}

struct TrayHandles {
    tray: Mutex<TrayIcon>,
    start_item: MenuItem<tauri::Wry>,
    stop_item: MenuItem<tauri::Wry>,
}

/// Pencere `X` ile kapatılmak istendiğinde çağrılır. "Tray'e küçült" açıksa
/// pencereyi gizleyip kapatmayı iptal eder (motor arka planda çalışmaya
/// devam eder); kapalıysa olağan kapatma davranışına izin verilir.
pub fn handle_close_request(window: &tauri::WebviewWindow, api: &tauri::CloseRequestApi) {
    if get_tray_minimize_pref(window.app_handle()) {
        let _ = window.hide();
        api.prevent_close();
    } else {
        let engine = window.app_handle().state::<Engine>();
        if engine.running.load(Ordering::SeqCst) {
            let _ = engine.stop();
        }
    }
}
