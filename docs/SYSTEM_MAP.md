# SYSTEM MAP

## Design Tokens (Kalıcı Mimari Kararlar — Dark Monolith $10K)
- **Tema & Felsefe:** Modern Dark Monolith DTCG Token Mimarisi (Linear & Raycast zarafeti, Cloudflare Zero Trust sağlamlığı).
- **Renk Paleti:**
  - Derin Zemin: `--color-void: #090B10` (`bg-void`)
  - Kart ve Yüzeyler: `--color-surface-card: #121724`, `--color-surface-elevated: #181F30`, `--color-surface-subtle: #0D111A`
  - Ana Metin: `--color-paper: #F8FAFC`, `--color-paper-bright: #FFFFFF`, İkincil Metin: `--color-paper-muted: #94A3B8`, Soluk: `--color-paper-faint: #64748B` (WCAG 2.2 AA kontrast garantili)
  - Canlı / Koruma Devrede: `--color-live: #10B981` (`border-live`, `text-live`, `bg-live`)
  - Alarm / Hata: `--color-alert: #EF4444` (`border-alert`, `text-alert`, `bg-alert`)
  - Uyarı / Dikkat: `--color-warn: #F59E0B` (`border-warn`, `text-warn`, `bg-warn`)
  - Bilgi / Vurgu: `--color-cyan: #06B6D4` (`text-cyan`, `border-cyan`)
- **Tipografi Standartları:** Fira Sans birincil arayüz fontu, Fira Code telemetri ve teknik veriler için monospaced font. Minimum 12px font boyutu (`text-xs`), başlıklar `text-sm`/`text-base`/`text-xl`/`text-2xl`, doğal hiyerarşi ve okunaklı satır aralıkları.
- **Geometri:** Dokunsal kavisler (`rounded-2xl` kartlar, `rounded-xl` butonlar, `rounded-lg` çipler). 1px ince zarif sınırlar (`border-white/[0.08]`), yumuşak gölgeler (`shadow-xl`) ve aktif durumlarda fısıldayan ambient nabız halkaları (`ring-pulse`). Göz yoran neo-brutalist kaba 0px keskinlik ve 3px kalın beyaz çerçeveler tamamen kaldırılmıştır.

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
