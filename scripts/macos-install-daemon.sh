#!/usr/bin/env bash
# Anticore macOS LaunchDaemon Kurulum Betiği
# Telif Sahibi: Monolith Works (c) 2026

set -euo pipefail

PLIST_PATH="/Library/LaunchDaemons/com.monolithworks.anticore.plist"
BIN_DIR="/Applications/Anticore.app/Contents/MacOS"
CLI_PATH="${BIN_DIR}/anticore-cli"

if [[ $EUID -ne 0 ]]; then
   echo "[-] Bu betik root (sudo) yetkisiyle çalıştırılmalıdır."
   exit 1
fi

echo "[*] Anticore macOS LaunchDaemon kurulumu başlatılıyor..."

# Binary kontrolü
if [[ ! -f "$CLI_PATH" ]]; then
    # Geliştirici veya fallback konumu kontrol et
    if command -v anticore >/dev/null 2>&1; then
        CLI_PATH=$(command -v anticore)
    else
        CLI_PATH="/usr/local/bin/anticore"
    fi
fi

# Plist dosyasını oluştur
cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.monolithworks.anticore</string>
    <key>ProgramArguments</key>
    <array>
        <string>${CLI_PATH}</string>
        <string>run</string>
        <string>--profile</string>
        <string>universal</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/var/log/anticore.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/anticore.err</string>
</dict>
</plist>
EOF

chmod 644 "$PLIST_PATH"
chown root:wheel "$PLIST_PATH"

echo "[+] ${PLIST_PATH} başarıyla oluşturuldu."
echo "[+] Servisi başlatmak için: sudo launchctl load -w ${PLIST_PATH}"
echo "[+] Servisi durdurmak için: sudo launchctl unload -w ${PLIST_PATH}"
