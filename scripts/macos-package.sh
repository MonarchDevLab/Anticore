#!/usr/bin/env bash
# Anticore macOS Paketleme ve Universal Binary Üretim Betiği
# Telif Sahibi: Monolith Works (c) 2026

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Anticore macOS Paketleme Başlatılıyor ==="

# 1. Rust CLI Motorunu Derle
echo "[1/3] macOS CLI Motoru Derleniyor..."
cd "${ROOT_DIR}/engine"
cargo build --release

# 2. Frontend ve Tauri Arayüzünü Derle
echo "[2/3] macOS Tauri Masaüstü Paketi (DMG / App) Derleniyor..."
cd "${ROOT_DIR}/desktop"
npm run build
npm run tauri -- build --bundles dmg,app

echo "[3/3] Derleme tamamlandı!"
echo "[+] Çıktılar: ${ROOT_DIR}/desktop/src-tauri/target/release/bundle/dmg/"
