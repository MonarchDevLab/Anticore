#!/usr/bin/env bash
# Anticore macOS Paketleme ve Ayrıştırılmış Mimari (Apple Silicon & Intel) Üretim Betiği
# Telif Sahibi: Monolith Works (c) 2026

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCH_CHOICE="${1:-auto}"

detect_host_arch() {
    local m
    m="$(uname -m)"
    if [[ "$m" == "arm64" ]]; then
        echo "arm64"
    else
        echo "x64"
    fi
}

if [[ "$ARCH_CHOICE" == "auto" ]]; then
    ARCH_CHOICE="$(detect_host_arch)"
fi

build_for_target() {
    local arch_label="$1"
    local rust_target="$2"
    local short_arch="$3"

    echo "=========================================================="
    echo "==> [$arch_label] Mimari Derlemesi Başlatılıyor: $rust_target"
    echo "=========================================================="

    echo "[1/5] Rust hedefi kontrol ediliyor ($rust_target)..."
    rustup target add "$rust_target" 2>/dev/null || true

    echo "[2/5] CLI Motoru derleniyor ($rust_target)..."
    cd "${ROOT_DIR}/engine"
    cargo build --release --target "$rust_target" --workspace

    mkdir -p "${ROOT_DIR}/engine/target/release"
    if [[ -f "target/${rust_target}/release/anticore" ]]; then
        cp "target/${rust_target}/release/anticore" "${ROOT_DIR}/engine/target/release/anticore.exe"
        cp "target/${rust_target}/release/anticore" "${ROOT_DIR}/engine/target/release/anticore"
    fi

    echo "[3/5] Frontend ve Tauri masaüstü paketi derleniyor ($rust_target)..."
    cd "${ROOT_DIR}/desktop"
    npm run build
    npm run tauri -- build --target "$rust_target" --bundles dmg,app

    echo "[4/5] macOS .pkg Kurulum Paketi Üretiliyor..."
    APP_PATH="${ROOT_DIR}/desktop/src-tauri/target/${rust_target}/release/bundle/macos/Anticore.app"
    if [[ ! -d "$APP_PATH" ]]; then
        APP_PATH="${ROOT_DIR}/desktop/src-tauri/target/release/bundle/macos/Anticore.app"
    fi

    if [[ -d "$APP_PATH" ]] && command -v pkgbuild &>/dev/null; then
        PKG_DIR="${ROOT_DIR}/desktop/src-tauri/target/${rust_target}/release/bundle/pkg"
        mkdir -p "$PKG_DIR"
        PKG_FILE="${PKG_DIR}/Anticore_${short_arch}.pkg"
        pkgbuild --component "$APP_PATH" \
                 --install-location /Applications \
                 --scripts "${ROOT_DIR}/scripts/pkg-scripts" \
                 "$PKG_FILE"
        echo "[+] PKG Çıktısı: $PKG_FILE"
    else
        echo "[!] pkgbuild bulunamadı veya .app dizini mevcut değil, .pkg atlanıyor."
    fi

    echo "[5/5] [$arch_label] Derleme tamamlandı!"
    echo "[+] DMG Çıktısı: ${ROOT_DIR}/desktop/src-tauri/target/${rust_target}/release/bundle/dmg/"
}

case "$ARCH_CHOICE" in
    arm64|aarch64)
        build_for_target "Apple Silicon (ARM64)" "aarch64-apple-darwin" "arm64"
        ;;
    x64|x86_64|intel)
        build_for_target "Intel (x86_64)" "x86_64-apple-darwin" "x64"
        ;;
    all)
        build_for_target "Apple Silicon (ARM64)" "aarch64-apple-darwin" "arm64"
        build_for_target "Intel (x86_64)" "x86_64-apple-darwin" "x64"
        ;;
    *)
        echo "Kullanım: $0 [arm64|x64|all]"
        exit 1
        ;;
esac

echo ""
echo "=== Tüm macOS paketleme işlemleri başarıyla tamamlandı ==="