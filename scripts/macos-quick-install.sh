#!/usr/bin/env bash
# Anticore macOS Tek Satir Hizli Kurulum Motoru
# Monolith Works (c) 2026
# Kullanici icin mimari algilama, indirme, karantina temizligi ve kurulumu otomatik gerceklestirir.

set -euo pipefail

REPO="MonarchDevLab/Anticore"
FALLBACK_TAG="v0.3.3"

echo "=========================================================="
echo "    ANTICORE - macOS Hizli Kurulum Motoru"
echo "    Sifir Hiz Kaybi ile Yuksek Performansli DPI Atlatma"
echo "=========================================================="

ARCH="$(uname -m)"
if [[ "$ARCH" == "arm64" ]]; then
    PKG_ARCH="arm64"
    echo "[+] Mimari algilandi: Apple Silicon ($ARCH)"
else
    PKG_ARCH="x64"
    echo "[+] Mimari algilandi: Intel ($ARCH)"
fi

echo "[1/4] En guncel surum kontrol ediliyor..."
LATEST_TAG=$(curl -sSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' || true)
if [[ -z "$LATEST_TAG" ]]; then
    LATEST_TAG="$FALLBACK_TAG"
fi
VERSION="${LATEST_TAG#v}"
echo "[+] Hedef Surum: ${LATEST_TAG}"

TMP_DIR=$(mktemp -d /tmp/anticore-install.XXXXXX)
trap 'rm -rf "$TMP_DIR"' EXIT

PKG_NAME="Anticore_${VERSION}_${PKG_ARCH}.pkg"
PKG_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${PKG_NAME}"
DMG_NAME="Anticore_${VERSION}_${PKG_ARCH}.dmg"
if [[ "$PKG_ARCH" == "arm64" ]]; then
    DMG_NAME="Anticore_${VERSION}_aarch64.dmg"
fi
DMG_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${DMG_NAME}"

echo "[2/4] Paket indiriliyor (${PKG_NAME})..."
if curl -fL --progress-bar "$PKG_URL" -o "$TMP_DIR/$PKG_NAME" 2>/dev/null; then
    echo "[3/4] macOS Installer ile sisteme kuruluyor (Yonetici yetkisi gerektirebilir)..."
    sudo installer -pkg "$TMP_DIR/$PKG_NAME" -target /
else
    echo "[!] .pkg bulunamadi, DMG uzerinden kuruluyor..."
    curl -fL --progress-bar "$DMG_URL" -o "$TMP_DIR/$DMG_NAME"
    MOUNT_POINT="$TMP_DIR/mount"
    mkdir -p "$MOUNT_POINT"
    hdiutil attach "$TMP_DIR/$DMG_NAME" -mountpoint "$MOUNT_POINT" -nobrowse -quiet
    echo "[3/4] Uygulama /Applications dizinine kopyalaniyor..."
    sudo rm -rf "/Applications/Anticore.app"
    sudo cp -R "$MOUNT_POINT/Anticore.app" /Applications/
    hdiutil detach "$MOUNT_POINT" -quiet || true
fi

echo "[4/4] Gatekeeper karantinasi kaldiriliyor ve izinler ayarlaniyor..."
sudo xattr -cr /Applications/Anticore.app 2>/dev/null || true
sudo chmod -R 755 /Applications/Anticore.app 2>/dev/null || true

echo "=========================================================="
echo "    Kurulum Basariyla Tamamlandi!"
echo "=========================================================="
echo "[+] macOS Ag Motoru (utun/pfctl) paketleri yonlendirmek icin root yetkisi gerektirir."
echo "[+] Uygulama acildiginda ekranda beliren 'Yonetici Olarak Baslat' butonunu onaylayabilir,"
echo "[+] veya dogrudan Terminal'den su komutla baslatabilirsiniz:"
echo "    sudo /Applications/Anticore.app/Contents/MacOS/Anticore &"
echo "=========================================================="
open /Applications/Anticore.app