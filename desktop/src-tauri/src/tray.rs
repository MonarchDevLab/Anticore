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
    AppHandle, Listener, Manager,
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
pub fn setup(app: &tauri::App) -> tauri::Result<()> {
    let show_i = MenuItem::with_id(app, "show", "Aç", true, None::<&str>)?;
    let toggle_i = MenuItem::with_id(app, "toggle", "Başlat", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &toggle_i,
            &PredefinedMenuItem::separator(app)?,
            &quit_i,
        ],
    )?;

    // Tray ikonu uygulama ikonu olarak ayarlandı; duruma göre tooltip ve menü metni güncellenir.
    // İleride renkli durum varyantı gerekirse icons/ altına tray-active.png / tray-inactive.png
    // eklenip TrayIconBuilder::icon() çağrısı duruma göre güncellenebilir.
    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Anticore — Pasif")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "toggle" => {
                let engine = app.state::<Engine>();
                if engine.running.load(Ordering::SeqCst) {
                    let _ = crate::commands::stop_engine(app.clone(), engine);
                } else {
                    let profile_id = engine.profile_id.lock().unwrap().clone();
                    let _ = crate::commands::start_engine(app.clone(), engine, profile_id);
                }
            }
            "quit" => {
                let engine = app.state::<Engine>();
                if engine.running.load(Ordering::SeqCst) {
                    let _ = engine.stop();
                }
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    app.manage(TrayHandles {
        tray: Mutex::new(tray),
        toggle_item: toggle_i,
    });

    let app_handle = app.handle().clone();
    app.listen("status_changed", move |event| {
        let running: bool = serde_json::from_str(event.payload()).unwrap_or(false);
        if let Some(handles) = app_handle.try_state::<TrayHandles>() {
            let _ = handles
                .toggle_item
                .set_text(if running { "Durdur" } else { "Başlat" });
            if let Ok(tray) = handles.tray.lock() {
                let _ = tray.set_tooltip(Some(if running {
                    "Anticore — Aktif"
                } else {
                    "Anticore — Pasif"
                }));
            }
        }
    });

    Ok(())
}

struct TrayHandles {
    tray: Mutex<TrayIcon>,
    toggle_item: MenuItem<tauri::Wry>,
}

/// Pencere `X` ile kapatılmak istendiğinde çağrılır. "Tray'e küçült" açıksa
/// pencereyi gizleyip kapatmayı iptal eder (motor arka planda çalışmaya
/// devam eder); kapalıysa olağan kapatma davranışına izin verilir.
pub fn handle_close_request(window: &tauri::WebviewWindow, api: &tauri::CloseRequestApi) {
    if get_tray_minimize_pref(window.app_handle()) {
        let _ = window.hide();
        api.prevent_close();
    }
}
