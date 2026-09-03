# SYSTEM MAP

## Design Tokens (Kalıcı Mimari Kararlar — Cyber-Brutalism)
- **Tema & Felsefe:** Cyber-Brutalist 3-Tier DTCG Token Mimarisi.
- **Renk Paleti:**
  - Arka Plan: `--color-void: #000000` (`bg-black`, `bg-ink`)
  - Ana Metin: `--color-paper: #ffffff` (`text-white`), İkincil Metin: `text-white/70` (WCAG 2.2 AA kontrast garantili)
  - Neon Canlı/Aktif: `--color-neon-live: #00ff9d` (`border-live`, `text-live`, `bg-live`)
  - Neon Uyarı/Alarm: `--color-neon-alert: #ff3366` (`border-alert`, `text-alert`, `bg-alert`)
  - Neon İkaz/Filtre: `--color-neon-warn: #ffcc00` (`border-warn`, `text-warn`, `bg-warn`)
  - Neon Bilgi/Sistem: `--color-neon-cyan: #00ffff` (`text-cyan`, `border-cyan`)
- **Tipografi Standartları:** Fira Code ve Fira Sans tabanlı monospaced ağırlık. Minimum 12px font boyutu (`text-xs`), başlıklar `text-sm`/`text-base`/`text-xl`, mutlak büyük harf (`uppercase`), `tracking-wider`/`tracking-widest`. 10px ve 11px fontlar yasaktır.
- **Geometri:** Keskin köşeler KESİNLİKLE ZORUNLU (`rounded-none`). Kalın çerçeveler (`border-2`, `border-[3px]`), katı monokrom ve neon ofset gölgeler (`shadow-[3px_3px_0px_#fff]`, `shadow-[4px_4px_0px_#000]`). Blur ve glassmorphism artıkları yasaktır.

## Teknoloji Yığını
- **Arayüz (Frontend):** React 19, TypeScript 5.8, TailwindCSS 4 (@theme DTCG token'ları), Lucide-React.
- **Masaüstü İskeleti (Desktop Framework):** Tauri v2 (Rust).
- **Ağ Manipülasyon Çekirdeği:** `anticore-core` (Saf Rust, bellek güvenli paket manipülasyonu) + `WinDivert` (Windows L4/L7 kernel-level paket yönlendirme sürücüsü).
- **Paketleme & Güvenlik:** NSIS, MSI, Taşınabilir (Portable ZIP), Minisign dijital imzalama.

## Mimari ve Modül Sınırları
- **/src/views/Dashboard.tsx:** Çift modlu kontrol merkezi.
  - *Basit Mod:* Tek dokunuşla başlat/durdur butonu, ISS profil seçici, Discord/Roblox/YouTube yeşil durum rozetleri.
  - *Pro Matrix Modu:* Canlı Throughput (PPS) sparkline grafiği, aktif strateji zinciri (`[TTL=3] -> [SPLIT=SNI+2]`), 4 telemetri sayacı (Görülen, Bypass Edilen, Passthrough, Uptime) ve dahili terminal konsolu.
- **/src/views/Sites.tsx:** Sıfır Hız Kaybı garantisi sağlayan hedef listesi (whitelist). Yalnızca bu listedeki alan adlarının ilk el sıkışma paketi işlenir; geri kalan tüm veri akışı dokunulmadan (`PacketVerdict::Passthrough`) geçer.
- **/src/views/Profiles.tsx & ProfileEditor.tsx:** TT, Superonline, Kablonet ve mobil için hazırlanmış strateji zinciri yöneticisi.
- **/src/views/NetworkRepair.tsx:** Discord sonsuz güncelleme döngüsü ("Checking for updates") ve ses kanalı (RTC) kopması onarımı, Windows kayıt defteri düzeyinde DoH (Cloudflare, Google, Quad9, AdGuard) aktivatörü.
- **/src/views/TestCenter.tsx:** Otomatik sağlayıcı analizi (Blockcheck) ve DNS sızıntı denetimi.
- **/src-tauri/src/commands.rs:** Tauri IPC köprüsü. `find_motor_exe` ile GUI ve CLI ikililerinin (`anticore-cli.exe`, `bin/anticore.exe`) NTFS dosya sistemi çakışmasını önleyen çözümleyici.
- **/src/components/UpdateModal.tsx:** Tek tıkla uygulama içi güncelleme denetimi, indirme ilerleme çubuğu ve otomatik yeniden başlatma modalı.

## Geliştirici Kimliği & Mülkiyet
- **Mutlak Kod Sahibi & Telif:** Monolith Works.
- **Yayınlama & Dağıtım Kanalı:** MonarchDevLab (GitHub: `github.com/MonarchDevLab/Anticore`).
- **Telif Bildirimi:** Copyright (c) 2026 Monolith Works. All rights reserved. (MIT Lisansı).

## Dağıtım Paketleri (v0.3.0)
- `Anticore_0.3.0_x64-portable.zip`: Kurulumsuz taşınabilir paket.
- `Anticore_0.3.0_x64-setup.exe`: Standart Windows kurulum sihirbazı.
- `Anticore_0.3.0_x64_en-US.msi`: Kurumsal Active Directory / GPO paketi.
- `latest.json` + `*.sig`: Otomatik güncelleme manifestosu ve Minisign imzaları.

## Güvenlik & Yetki Modeli
- Windows ağ paketlerini filtrelemek için `WinDivert` sürücüsü yönetici yetkisi gerektirir. Standart kullanıcı açılışında otomatik UAC yükseltme (`runas`) tetiklenir.
- Sıfır telemetri ve sıfır veri kaydı (No-logs). Hiçbir kullanıcı verisi veya IP adresi dış sunuculara aktarılmaz.
