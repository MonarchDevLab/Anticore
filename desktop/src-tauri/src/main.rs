// Konsol penceresi kapalı (Sadece saf GUI)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    anticore_desktop_lib::run();
}
