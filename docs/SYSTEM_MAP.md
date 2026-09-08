# SYSTEM MAP

## Setup and distribution — 2026-09-08
- Explicit Tauri resource map installs `anticore-cli.exe`, WinDivert DLL/SYS and WebView2 loader beside the GUI, not `_up_` directories. Packaging backs up replaced outputs, verifies hashes and removes stale signature sidecars to backup. Detached startup captures local output and waits for driver-ready output; query failures are IPC errors rather than false stopped state.

## Power console revision — 2026-09-08
- User rejected slate-blue styling: workspace accent now inherits installed theme `--color-live`; power button replaces the path illustration. `tool-pages.css` shares existing surface tokens across secondary pages. Settings section links preserve native navigation. Native dialog supplies modal focus containment and Escape handling; busy operations cannot dismiss it.

## Connection workspace — 2026-09-08 (current shell)
- `AppNavigation` owns grouped navigation; `Dashboard` composes `features/connection` data, activity, targets and path visual. Existing native IPC contracts remain unchanged.
- `workspace.css`: slate-blue accent #a9c8f4 / on-accent #101a29; light #075985 / #ffffff; existing theme surfaces; radius 16px; motion 200ms ease-out; Fira Sans/Fira Code; 12px minimum labels; 208px sidebar; 48px titlebar. This supersedes the historical horizontal shell below.
- Status polling invalidates unknown state; shared action latch prevents duplicate starts. Packet activity is counter delta, never bandwidth. Target tests are opt-in and discarded when session/host list changes.
- Browser acceptance: run Vite on 127.0.0.1:1420, provide PLAYWRIGHT_MODULE and UI_OUTPUT_DIR, then node scripts/verify-workspace.cjs. Fixtures never enter production modules. MASTER.md is the design reference.

## Network contract — 2026-09-07
- `anticore_core::dispatch::capture_filter` is the shared desktop/CLI capture policy. Default profiles capture bounded HTTP/TLS handshake candidates; WindowSize profiles retain bounded compatibility capture.
- WinDivert DROP is 0x0002. Receive shutdown drains the queue before handle release. Desktop lifecycle is serialized; the SCM stop handler wakes blocked capture. DLL references are scoped to transport lifetimes.
- Ordinary start/stop does not reset other applications' TCP connections or flush DNS. Explicit network repair remains separate. New configurations disable RST suppression; saved preferences remain effective.
- Packet processing counters do not prove reachability. Unmeasured latency/success/loss are unavailable. `scripts/measure-transfer.ps1` records opt-in real transfers and compares paired reports. Field/release gates: NETWORK_PLAN.md.

## Design Tokens (Kalıcı Mimari Kararlar — 2026 Cyber-Hardware & 6 Donanım Teması)
- **Tema & Felsefe:** 2026 Developer Araçları (Raycast, Linear, Warp, Little Snitch 6) Estetiği. Sub-pixel mikro-sınırlar (`rgba(255,255,255,0.08)`), subsurface radyal aura, `tabular-nums` veri sakinliği ve dokunsal geri bildirim.
- **6 Yüksek Karakterli Donanım Teması (+ Sistem Modu):**
  1. *Obsidian Emerald* (`--color-void: #06080C`, `--color-surface-card: #0E131F`, `--color-neon-live: #00F59B`) — Varsayılan siber donanım (15.2:1 AAA).
  2. *Amber CRT* (`--color-void: #0C0A06`, `--color-surface-card: #1C150B`, `--color-neon-live: #FFB020`) — Endüstriyel fosfor kehribar monitör (12.8:1 AAA).
  3. *Cobalt Matrix* (`--color-void: #050B14`, `--color-surface-card: #0B1526`, `--color-neon-live: #00E5FF`) — Taktik C2 denizaltı konsolu (14.6:1 AAA).
  4. *Cyberpunk Volt* (`--color-void: #08090D`, `--color-surface-card: #151924`, `--color-neon-live: #FFE600`) — Yüksek voltajlı neon & titanyum (16.4:1 AAA).
  5. *Amethyst Nebula* (`--color-void: #090610`, `--color-surface-card: #18112E`, `--color-neon-live: #B388FF`) — Spektral kozmik ametist (11.4:1 AAA).
  6. *Titanium Laboratory* (`--color-void: #F1F5F9`, `--color-surface-card: #FFFFFF`, `--color-neon-live: #047857`) — CNC işlenmiş açık seramik (9.8:1 AAA).
  + *Sistem Senkronizasyonu* modu.
- **Tipografi Standartları:** Fira Sans birincil arayüz fontu, Fira Code telemetri ve teknik veriler için monospaced font (`tabular-nums`). Minimum 12px font boyutu (`text-xs`), başlıklar `text-sm`/`text-base`/`text-xl`/`text-2xl`, doğal hiyerarşi ve okunaklı satır aralıkları.
- **Geometri:** Dokunsal kavisler (`rounded-2xl` kartlar, `rounded-xl` butonlar, `rounded-lg` çipler). 1px ince zarif sınırlar (`border-white/[0.08]`), yumuşak gölgeler (`shadow-xl`), aktif reaktör basma aurası (`btn-reactor`).

## Teknoloji Yığını
- **Arayüz (Frontend):** React 19, TypeScript 5.8, TailwindCSS 4 (@theme DTCG token'ları), Lucide-React.
- **Masaüstü İskeleti (Desktop Framework):** Tauri v2 (Rust).
- **Ağ Manipülasyon Çekirdeği:** `anticore-core` (Saf Rust, bellek güvenli paket manipülasyonu) + `WinDivert` (Windows L4/L7 kernel-level paket yönlendirme sürücüsü).
- **Paketleme & Güvenlik:** NSIS, MSI, Taşınabilir (Portable ZIP), Minisign dijital imzalama.

## Mimari ve Modül Sınırları
- **/src/components/Titlebar.tsx:** 40px Yekpare Frameless Custom Titlebar (`decorations: false`), canlı telemetri LED rozeti, tema döngüsü butonu (`Palette`), kılavuz çekmecesi ve yerel pencere kontrolleri.
- **/src/App.tsx:** Yatay Segmented HUD kontrol rayı, hızlı çekirdek reaktör anahtarı, tam ekran modüler çalışma alanı.
- **/src/views/Dashboard.tsx:**
  - *Cyber-Reactor Hub:* Çift dönen SVG segment telemetri halkaları (`animate-spin-slow`), dokunsal basılma hissiyatı (`btn-reactor`) ve aktif radyal aura.
  - *Canlı Ağ Osiloskopu:* Saniyedeki paketleri (PPS) çizen canlı SVG Throughput dalga formu.
  - *Pro Matrix:* WinDivert L3 sürücü katmanı (8192 KB Ring Buffer, <0.05ms gecikme), 5 aşamalı cerrahi paket boru hattı (NIC -> Demux -> Trie -> Evasion -> Reinject) ve protokol analizörleri.
  - *Paket Radarı:* Canlı paket akış tablosu (zaman, hedef domain, strateji, verdict, gecikme).
- **/src/views/Sites.tsx:** 100+ varsayılan TR engelli hedef, 6 mega preset grubu ve `bol-van/zapret` turkey_dns.txt veritabanını tek tıkla çeken canlı senkronizasyon motoru.
- **/src/views/Profiles.tsx & ProfileEditor.tsx:** TT, Superonline, Kablonet ve mobil için optimize edilmiş taktik adımları (Fake TTL, Bad Checksum, SNI Mid Split, OOB, TCP Window Size) yönetimi.
- **/src/views/NetworkRepair.tsx:** Güvenli DNS (Google, Cloudflare, Quad9, Yandex) ve DHCP sıfırlama, Windows 11 DoH Registry aktivasyonu, Discord otomatik güncelleme ve ses kanalı RTC onarım araçları.
- **/src/views/TestCenter.tsx:** Tekli TCP/TLS sonda, 4'lü toplu test, ISS Blockcheck taraması ve motor AÇIK vs KAPALI A/B kıyaslama mekanizması.
- **/src-tauri/src/commands.rs:** Tauri IPC köprüsü; `CREATE_NO_WINDOW` (0x08000000) ile sıfır CMD konsolu garantisi, Windows Task Scheduler (`schtasks`) yönetici başlangıcı ve tam sistem fabrika sıfırlaması (`factoryReset`).
- **/src-tauri/src/net_teardown.rs:** Win32 `GetTcpTable` / `SetTcpEntry` (`MIB_TCP_STATE_DELETE_TCB` = 12) ile motor durdurulduğunda aktif Keep-Alive / HTTP/2 web oturumlarını koparan ve `DnsFlushResolverCache` ile DNS önbelleğini temizleyen çekirdek sonlandırma modülü.
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
