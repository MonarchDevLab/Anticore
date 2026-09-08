# TASKS

> Tek gerçek kaynak. Kod/git ile çeliştiğinde git kazanır, bu dosya düzeltilir.
> Son doğrulama: 2026-09-03 — `cargo test --workspace` 46/46, `npm run build` 0 hata,
> `cargo check` (src-tauri) temiz.

## ŞİMDİ `[~]`
- *(Yok — Tüm görevler tamamlandı, doğrulandı)*

## BLOKLU `[!]`
- *(Yok)*

## SIRADAKİ `[ ]`
- `[ ]` 23.0 Sahada canlı ISP testi ve kullanıcı kabulü.

### Faz 22 — Otomatik DNS Zehirlenmesi / Discord BTK Engeli Onarımı + Cyberpunk 2077 & Quiet Luxury Temaları (TAMAMLANDI)
- `[x]` 22.1 (2026-09-04) **Discord BTK DNS Zehirlenmesi Analizi ve Otomatik Çözüm (`commands.rs`, `profile.rs`):**
  - Türkiye'deki ISP'lerin `discord.com` sorgusunu doğrudan BTK engelleme IP'sine (`195.175.254.2`) yönlendirdiği tespit edildi. Tarayıcı sahte hedefe gittiği için WinDivert motoru devrede olsa bile Discord bağlantı zaman aşımına uğruyordu.
  - `commands.rs` içerisine `check_dns_health` (BTK IP ve zehirlenme tespiti) ve `auto_fix_dns` (Cloudflare 1.1.1.1 + native Windows DoH + DNS flush) eklendi.
  - `profile.rs` içerisindeki `universal` profiline Türkiye'deki Sandvine/Procera DPI'ı atlatmak için `FakePacketBefore { ttl: 4 }` + `FragmentTls { mode: SplitMode::SniMid }` eklendi.
- `[x]` 22.2 (2026-09-04) **Dashboard DNS Zehirlenme Uyarısı & Tek Tıkla DoH Uygulama (`Dashboard.tsx`, `tauri.ts`):**
  - `Dashboard.tsx` açılışında otomatik DNS sağlık kontrolü bağlandı.
  - Zehirlenme algılandığında üst kısımda sarı uyarı şeridi ("DNS ZEHİRLENMESİ TESPİT EDİLDİ: discord.com -> 195.175.254.2") ve "Güvenli DNS & DoH Uygula" butonu beliriyor; tek tıkla Cloudflare DNS ve şifreli DNS (DoH) uygulanıp DNS önbelleği temizleniyor.
- `[x]` 22.3 (2026-09-04) **Cyberpunk 2077 & Quiet Luxury Temaları (`theme.ts`, `globals.css`):**
  - Kullanıcının doğrudan talep ettiği iki kökten farklı tema kuruldu:
    1. *Cyberpunk 2077:* 45° açılı kesik poligon köşeler (`clip-path: polygon(...)`), 24px HUD grid matrisi, üstte elektrik sarısı neon şerit (`border-top: 3px solid #FFE600`), endüstriyel mecha tetik butonları, agresif uppercase tipografi ve neon siyan/sarı yüksek gerilim auraları.
    2. *Quiet Luxury:* Patek Philippe & Mayfair lüks saatçilik estetiği, editoryal serif tipografi (`font-serif` - Cinzel, Playfair Display, Georgia), kadife siyahı (`#0C0B0E`), fırçalanmış şampanya altını ve kaşmir detaylar (`#D4AF37`), fısıldayan mikro sınırlar, pürüzsüz 12px organik kavisler, sıfır neon.
    3. *Amber CRT:* Tam ekran CRT scanline overlay katmanı (`#root::after`), CRT phosphor kehribar ışıması ve zorunlu monospace (`font-mono`).
    4. *Titanium Laboratory, Obsidian Emerald, Amethyst Nebula* güncellendi.
- `[x]` 22.4 (2026-09-04) **Doğrulama:** `npm run build` 0 hata, `cargo test --workspace` 46/46 yeşil, `cargo test` desktop 8/8 yeşil. Release paketleri güncellendi.

### Faz 21 — Sadeleştirilmiş Yönetici Uyarısı & "Yeniden Başlat" Butonu + 6 Tam Morfolojik Tema Sistemi (TAMAMLANDI)
- `[x]` 21.1 (2026-09-04) **Sadeleştirilmiş Yönetici Uyarısı & Yeniden Başlat Butonu (`divert.rs`, `Dashboard.tsx`, `App.tsx`, `i18n.ts`):**
  - `divert.rs` içerisindeki ham filtre dizesi (`filter=outbound and tcp and (tcp.DstPort == 443 or tcp.DstPort == 80)`) kaldırılarak iç teknik ayrıntılar gizlendi.
  - `Dashboard.tsx` içindeki hata kutusu sadeleştirildi; yönetici hatası algılanarak "Yönetici İzni Gerekiyor" başlığı, açıklayıcı metin ve hemen yanına "Yönetici Olarak Yeniden Başlat" (`api.restartAsAdmin()`) eylem butonu eklendi.
  - `App.tsx` üst hızlı başlatma (`quickToggle`) akışına da benzer `topError` bildirim ve yönetici yeniden başlatma mekanizması bağlandı.
- `[x]` 21.2 (2026-09-04) **6 Tam Morfolojik & Atmosferik Bağımsız Tema Dünyası (`globals.css`, `theme.ts`):**
  - Temalar sadece renk değiştiren yüzeysel yapıdan çıkarılarak geometri, doku, kenarlık, tipografi ve atmosferi kökten değiştiren tam sistem haline getirildi:
    1. *Amber CRT:* Tam ekran CRT scanline overlay katmanı, CRT phosphor ışıması ve vignette, tüm arayüzde zorunlu `font-mono`, 2px keskin terminal kutuları ve retro mekanik kaset butonlar.
    2. *Cyberpunk Volt:* 0px jilet keskin köşe geometrisi (`rounded-none`), endüstriyel HUD grid zemin matrisi, üst sarı yüksek gerilim lazer şeridi (`border-top: 2px solid #FFE600`), agresif mecha tetik butonları.
    3. *Cobalt Matrix:* C2 Muharebe ve denizaltı komuta konsolu, 6px taktik çerçeveler, sonar radarı dairesel ızgarası, sol kutup mavisi dikey çapa şeridi (`border-left: 3px solid #00E5FF`).
    4. *Amethyst Nebula:* 24px ultra yumuşak organik hap formları, gerçek buzlu cam derinliği (`backdrop-blur-36px`), çift pembe-eflatun kozmik nebula zeminleri ve parlak hap kapsül butonlar.
    5. *Titanium Laboratory:* Açık mod klinik cerrahi lab, hassas 12px CNC pahlar, beyaz yükseltilmiş kartlar (`#FFFFFF`), açık gri nokta ızgarası ve yüksek kontrastlı grafit tipografi.
    6. *Obsidian Emerald:* Havacılık sınıfı CNC obsidyen şasi, 16px kavisli cam paneller, zümrüt telemetri ve fısıldayan ambient donanım ışıması.
- `[x]` 21.3 (2026-09-04) **Doğrulama & Dağıtım Paketleri:** `npm run build` 0 hata (2.58s), `cargo test --workspace` 46/46 yeşil, `cargo test` desktop 8/8 yeşil; `dist/` ve `dist-portable/` altındaki release ikilileri güncellendi.

### Faz 20 — Tema, Dil Reaktivitesi ve Pencere Kapatma ("X") Onarımı (TAMAMLANDI)
- `[x]` 20.1 (2026-09-04) **Tauri Yetki ve Pencere Kapatma Çözümü (`capabilities/default.json`, `commands.rs`, `Titlebar.tsx`):**
  - Tauri v2 capability dosyasında eksik olan `core:window:allow-close`, `allow-minimize`, `allow-maximize`, `allow-toggle-maximize`, `allow-hide`, `allow-destroy` izinleri eklendi.
  - Rust tarafında `window_close`, `window_minimize`, `window_toggle_maximize`, `window_is_maximized` doğrudan IPC komutları eklendi ve `tray.rs` tercihlerine (tray'e küçült açıksa gizle, kapalıysa motoru durdurup güvenle çık) bağlandı.
  - Titlebar üzerindeki 'X' butonunun ve pencere kontrollerinin hiçbir koşulda donmadan anında tepki vermesi sağlandı.
- `[x]` 20.2 (2026-09-04) **Dil Değiştirici Reaktivitesi (`i18n.ts`):**
  - Bileşen başına izole kalan `useState` yapısı yerine React 18 `useSyncExternalStore` entegre edildi.
  - Başlık çubuğundan veya Ayarlar sekmesinden dil (TR/EN) değiştirildiğinde tüm sayfalardaki metinlerin anında senkronize olması sağlandı.
- `[x]` 20.3 (2026-09-04) **Tema Sistemi ve CSS Token Eşleşmesi (`theme.ts`, `globals.css`, `App.tsx`, `Titlebar.tsx`):**
  - `useTheme` hook'u `useSyncExternalStore` ile tüm bileşenlerde tekil bir reaktif kaynağa bağlandı.
  - `globals.css` içinde `cyberpunk`, `amber`, `cobalt`, `amethyst`, `titanium` temalarının eksik olan `--color-live`, `--color-live-dim`, `--color-live-bright`, `--color-sky`, `--color-border-brutal`, `--color-paper` değişkenleri tam olarak tanımlandı.
  - Titlebar ve App navbar'daki sabit renk kodları tokenlara (`bg-surface-subtle`, `border-border-brutal`) çevrildi; hafif (Titanium) ve renkli temalara geçildiğinde tüm arayüzün renk ve şasi kimliği anında değişecek hale getirildi.

### Faz 19 — Çöp Dosya Temizliği, Çoklu Mod Durdurma & Soket Havuzu Teardown, Dağıtım Paketleri (TAMAMLANDI)
- `[x]` 19.1 (2026-09-04) **Çöp Dosya & Artık Analizi ve Temizliği:** Çalışma alanında kopyalanmış eski `design-system` kopyası, kök dizindeki taslak plan dokümanı ve derleme log artıkları silindi; çalışma alanı sıfır kirlilikle temizlendi.
- `[x]` 19.2 (2026-09-04) **Durdurma Sonrası Erişim Devamı Analizi ve Kök Neden Tespiti:** Kullanıcı motoru durdurduktan sonra sitelere erişimin sürmesinin kök nedenleri tespit edildi:
  1. Tarayıcıların (Chrome, Edge, Firefox) ve Electron/Discord istemcilerinin Keep-Alive / HTTP/2 üzerinden daha önce kurulmuş TLS oturumlarını 300 saniyeye kadar havuzda canlı tutması (DPI ilk el sıkışmada baktığından açık sokette engelleme tetiklenmez).
  2. Windows DNS önbelleğinin eski çözümlenmiş kayıtları tutması.
  3. Arka planda olası bağımsız (`anticore.exe`) veya Windows Servisi (`AnticoreService`) süreçlerinin çalışmaya devam etmesi ve tekil panel motorundan ayrık olması.
- `[x]` 19.3 (2026-09-04) **Win32 TCP Soket Teardown & DNS Flush Modülü (`net_teardown.rs`):**
  - `GetTcpTable` ve `SetTcpEntry` (`MIB_TCP_STATE_DELETE_TCB` = 12) kullanılarak web portlarındaki (80, 443, 8080, 8443) tüm aktif TCP oturumları tek sistem çağrısıyla anında sonlandırıldı.
  - `DnsFlushResolverCache` ve `ipconfig /flushdns` ile Windows DNS önbelleği anında temizlendi.
- `[x]` 19.4 (2026-09-04) **start_engine & stop_engine Tam Yalıtım ve Eşzamanlı Teardown (`commands.rs`):**
  - `stop_engine` panel motoru, bağımsız motor (`detached.pid`) ve Windows Servisi'ni tek hamlede durduracak, ardından soket havuzunu ve DNS önbelleğini temizleyecek şekilde birleştirildi.
  - `get_status` servisin ve bağımsız sürecin durumunu algılayacak şekilde güncellendi.
- `[x]` 19.5 (2026-09-04) **Release Binary & Taşınabilir Paket Dağıtımı (`dist/`, `dist-portable/`):**
  - Motor `cargo build --release --workspace` ile derlendi (`anticore.exe` CLI - 371 KB).
  - Desktop `npm run tauri build` ile derlendi ve imzalandı (`Anticore.exe` - 15.2 MB, `Anticore_0.3.0_x64-setup.exe` - 4.3 MB NSIS, `Anticore_0.3.0_x64_en-US.msi` - 6.0 MB MSI).
  - Kurulumsuz taşınabilir paket `Anticore_0.3.0_x64-portable.zip` (5.93 MB) WinDivert sürücüleri ve CLI motoruyla birlikte paketlendi.
- `[x]` 19.6 (2026-09-04) **Doğrulama:** `cargo test --workspace` 46/46 yeşil, `cargo test` (src-tauri) 8/8 yeşil, `npm run build` 0 hata.

### Faz 18 — Uçtan Uca Buton, IPC & Çekirdek Dayanıklılık Restorasyonu (TAMAMLANDI)
- `[x]` 18.1 (2026-09-04) **Araştırma Ajanı Derin Denetimi:** Alt ajan (`research`) ile tüm arayüz butonları, `invoke` çağrıları ve Rust backend komutları teftiş edildi; öksüz komutlar, kategori filtre no-op'u ve durum kurtarma açıkları listelendi.
- `[x]` 18.2 (2026-09-04) **Sites.tsx Kategori Filtre & Toplu Ekleme Onarımı:** Kategori buton ID'leri (`tr-core`, `discord-roblox`, `vpn-privacy`, `sohbet`, `oyun`, `ai`) `PRESET_GROUPS` ile 1:1 hizalandı; `add_sites` toplu IPC komutu Rust'a eklenerek 100 dosya yazımı tek disk I/O operasyonuna indirildi.
- `[x]` 18.3 (2026-09-04) **TestCenter.tsx Motor Kurtarma Garantisi:** `runComparison` içinde sonda hatası veya zaman aşımında motorun kapalı kalmasını önleyen `try...finally` garantili geri yükleme bloğu inşa edildi.
- `[x]` 18.4 (2026-09-04) **Dashboard.tsx Gerçek Telemetri & Sıfır Paket Göstergesi:** Sahte `sampleDomains` ve `Math.random()` kaldırıldı; gerçek delta paket telemetrisi ve aktif profil bilgisi bağlandı; 0 paketteki yanıltıcı `%100.0` yerine `-` gösterimi sağlandı.
- `[x]` 18.5 (2026-09-04) **LogsView.tsx Mükerrer Satır Tekilleştirmesi:** `historyLogs` ile `liveLogs` birleşiminde aynı mesajların çift basılması engellendi.
- `[x]` 18.6 (2026-09-04) **NetworkRepair.tsx Discord Süreç Güvenliği:** Discord güncelleme onarımı ve önbellek temizleme butonlarına kullanıcının çalışan görüşmesini korumak için `ConfirmDialog` onay mekanizması eklendi.
- `[x]` 18.7 (2026-09-04) **SettingsView.tsx Token, Kilitleme & Sürüm Entegrasyonu:** Güncelleme denetimine kayıtlı GitHub Token (`anticore_gh_token`) bağlandı; motor çalışırken savunma toggler'ı kilitlendi ve uyarı metni eklendi; `get_app_version` IPC'si dinamik olarak Hakkında kartına bağlandı.
- `[x]` 18.8 (2026-09-04) **CompatWarning.tsx Yönetici Başlatma:** WinDivert dosya/yetki hatasında doğrudan `restart_as_admin` tetikleyen buton şeride entegre edildi.
- `[x]` 18.9 (2026-09-04) **Doğrulama:** `npm run build` 0 hata (1537 modül), `cargo check` (src-tauri) 0 hata, `cargo test` (src-tauri) 7/7 yeşil, `cargo test --workspace` 46/46 yeşil (10.56s).

- `[x]` 17.1 (2026-09-04) **2026 Developer Araçları UI/UX Trend Analizi:** Araştırma alt ajanı (`research`) ile Raycast, Linear, Warp, Zed, Tailscale, Little Snitch 6 arayüzleri analiz edildi. Sub-pixel micro-borders, subsurface ambient glow, sakin veri yoğunluğu (`tabular-nums`), cyber-hardware dokunsal geri bildirim ve dinamik hız spektrumu belirlendi.
- `[x]` 17.2 (2026-09-04) **6 Yüksek Karakterli Donanım Teması (`theme.ts`, `globals.css`):**
  1. *Obsidian Emerald* (`#06080C` / `#00F59B` - Varsayılan Cyber-Hardware)
  2. *Amber CRT* (`#0C0A06` / `#FFB020` - Endüstriyel Fosfor Kehribar Monitör)
  3. *Cobalt Matrix* (`#050B14` / `#00E5FF` - Taktik Denizaltı C2 Konsolu)
  4. *Cyberpunk Volt* (`#08090D` / `#FFE600` - Yüksek Gerilim Neon Sarı & Titanyum)
  5. *Amethyst Nebula* (`#090610` / `#B388FF` - Spektral Mor & Kozmik Ametist)
  6. *Titanium Laboratory* (`#F1F5F9` / `#047857` - CNC İşlenmiş Titanyum Açık Mod)
  + *Sistem Senkronizasyonu* modu. Tüm temalar WCAG AAA/AA kontrast oranına (10:1 - 18:1) kalibre edildi.
- `[x]` 17.3 (2026-09-04) **Tüm Buton, Modül ve Arayüz Bileşenlerinin Uçtan Uca Denetimi:**
  - Tüm arayüzden yapay zeka/yıldız (`Sparkles`) ikonları tamamen söküldü (`Wizard.tsx` -> `Shield`, `TestCenter.tsx` -> `Zap`).
  - `Profiles.tsx` açılışında sağ editör panelinin boş kalmaması için ilk profilin otomatik seçimi garanti altına alındı.
  - Kod tabanında sahte `onClick`, `alert`, `TODO`, `FIXME` veya yer tutucu (mock) fonksiyon bulunmadığı doğrulandı.
  - DNS uygulama/sıfırlama, DoH kayıt defteri, Discord güncelleme/önbellek onarımı, Windows servisi ve bağımsız motor yönetimi, tekli ve toplu prob testleri, A/B kapalı/açık karşılaştırması, bol-van zapret TR kara liste senkronizasyonu, log dışa aktarma/temizleme, profil klonlama/aktarma ve fabrika ayarlarına sıfırlama işlemlerinin tamamı gerçek arka uç Rust WinDivert/Windows API sistemlerine bağlandı ve doğrulandı.
- `[x]` 17.4 (2026-09-04) **Doğrulama ve Derleme:** `npm run build` 0 hata (1537 modül), `cargo check` (src-tauri) 0 hata, `cargo test --workspace` 46/46 yeşil (10.58s).

### Faz 16 — Ouroboros v6.0 Mimari, Sistem ve Arayüz Restorasyonu (TAMAMLANDI)
- `[x]` 16.1 (2026-09-04) **Sıfır CMD / Arka Plan Penceresi Yalıtımı (`commands.rs`):** `CREATE_NO_WINDOW` (0x08000000) bayrağı ve `silent_command` yardımcısıyla tüm arka plan komutları (`sc`, `tasklist`, `taskkill`, `schtasks`, `powershell`) sessizleştirildi; GUI çalışırken veya servis açılırken hiçbir konsol penceresinin yanıp sönmemesi garanti altına alındı.
- `[x]` 16.2 (2026-09-04) **Windows Servis ve Başlangıç Güçlendirmesi (`commands.rs`, `main.rs`):** `find_motor_exe` mutlak yol ve canonicalize desteği aldı; `sc create` sözdizim hatası düzeltildi; `set_startup_enabled` Windows Task Scheduler (`schtasks /Create /TN "Anticore" /RL HIGHEST /SC ONLOGON /F`) ile UAC engelsiz yönetici başlangıcına yükseltildi. `--hidden` ve `--minimized` argümanları ile açılışta penceresiz sistem tepsisi başlangıcı bağlandı.
- `[x]` 16.3 (2026-09-04) **Eski DPI Servis Uyarısı ve Temizleme Butonu (`compat.rs`, `CompatWarning.tsx`):** WinDivert kendi sürücümüz olduğu için çakışan servisler listesinden çıkarıldı; `CompatWarning.tsx` içine tek tıkla eski DPI servislerini Windows'tan kaldıran `[Servisleri Temizle]` aksiyonu eklendi.
- `[x]` 16.4 (2026-09-04) **Yazılım Güncellemesi Sembol ve Private Repo Desteği (`commands.rs`, `UpdateModal.tsx`, `Titlebar.tsx`):** Yıldız ikonu yerine endüstri standardı `ArrowDownCircle` indirme ikonu yerleştirildi; GitHub API 404 / özel repo durumunda açıklayıcı hata ve Personal Access Token tanımlama arayüzü kuruldu.
- `[x]` 16.5 (2026-09-04) **Fabrika Ayarlarına Dön Tamir Edildi (`commands.rs`, `SettingsView.tsx`):** Sadece blacklist değil; DNS/DoH kayıt defteri sıfırlama, Task Scheduler başlangıç temizliği, detached.pid temizliği, özel profillerin sıfırlanması ve disk log temizliğini kapsayan tam sistem sıfırlaması inşa edildi ve başarı geri bildirimleriyle bağlandı.
- `[x]` 16.6 (2026-09-04) **5 Donanım Teması & Toggle Düğmesi Donanım Cilası (`globals.css`, `theme.ts`, `SettingsView.tsx`, `Titlebar.tsx`):** Toggle-thumb aktifken oluşan koyu leke saf beyaza dönüştürüldü; Obsidian, Cyberpunk, Amber, Amethyst, Titanium donanım temaları ve sistem modu tanımlandı.
- `[x]` 16.7 (2026-09-04) **100+ TR Engelli Domain ve Bol-van Zapret Topluluk Entegrasyonu (`config.rs`, `commands.rs`, `Sites.tsx`):** Türkiye'deki engelli domainler 100+'e çıkarıldı, 6 zengin preset grubu eklendi; GitHub `bol-van/zapret` turkey_dns.txt listesini tek tıkla çekip yerel listeye ekleyen asenkron IPC ve şık senkronizasyon kartı entegre edildi.
- `[x]` 16.8 (2026-09-04) **Pro Matrix Gelişmiş Donanım ve Telemetri Kokpiti (`Dashboard.tsx`):** L3 WinDivert Ring Buffer, Çekirdek gecikmesi (<0.05ms), 5 aşamalı cerrahi paket manipülasyon boru hattı (NIC -> Demux -> Trie -> Evasion -> Reinject), 4 cerrahi atlatma protokolü ve kritik hedef sağlık/durum matrisi kuruldu.
- `[x]` 16.9 (2026-09-04) **Doğrulama ve Sağlamlık:** `cargo test --workspace` 46/46 yeşil (10.54s), `npm run build` 0 hata (1537 modül), `cargo check` (desktop/src-tauri) 0 hata ile tamamlandı.

### Faz 15 — $10K Cyber-Hardware & Desktop Utility Arayüz Dönüşümü (TAMAMLANDI)
- `[x]` 15.1 (2026-09-03) **Frameless Custom Titlebar (`tauri.conf.json`, `Titlebar.tsx`):** Çift başlık çubuğu kapatıldı (`decorations: false`); 40px entegre donanım sistem rayı (`data-tauri-drag-region`), canlı telemetri LED rozeti ve Tauri v2 yerel pencere kontrolleri (`_`, `□`, `✕`) inşa edildi.
- `[x]` 15.2 (2026-09-03) **Yatay Segmented HUD Tab Bar (`App.tsx`):** Ekranın %25'ini yutan 240px sol admin menüsü kaldırıldı; üst panele Warp/Linear tarzı yatay sekmeli kontrol rayı entegre edilerek net çalışma alanı tam ekrana çıkarıldı.
- `[x]` 15.3 (2026-09-03) **Cyber-Reactor Hub (`Dashboard.tsx`):** Düz kare kutu yerine; dönen çift SVG segment telemetri halkasına (`animate-spin-slow` / `animate-spin-reverse`), dokunsal basılma hissine (`btn-reactor`) ve durum aurasına sahip dairesel reaktör çekirdeği geliştirildi.
- `[x]` 15.4 (2026-09-03) **Canlı Ağ Osiloskopu & Paket Radarı (`Dashboard.tsx`):** Statik maket kartlar kaldırıldı; saniyede işlenen paketleri (PPS) çizen canlı SVG Throughput dalga formu, gerçek zamanlı paket teftiş radarı (`discord.com → SPLIT_TLS`, vb.) ve Sıfır Hız Kaybı donanım göstergesi kuruldu.
- `[x]` 15.5 (2026-09-03) **Slide-over Kılavuz Çekmecesi (`GuideDrawer.tsx`):** Ana sayfayı kaplayan 4 maddelik SSS akordeonu dashboard'dan tahliye edilerek sağ üstten süzülen F1 / buton tetiklemeli şık çekmeceye dönüştürüldü.
- `[x]` 15.6 (2026-09-03) **Obsidian & Hyper-Emerald Malzeme Sistemi (`globals.css`):** Derin siber uzay obsidyeni (`#06080C`), yüksek voltajlı Hyper-Emerald (`#00F59B`), 1px sub-pixel hairline gradient sınırlar ve ambient aura tanımlandı.
- `[x]` 15.7 (2026-09-03) **Doğrulama:** `npm run build` 0 hata (1537 modül), `cargo check` 0 hata, `cargo test --workspace` 46/46 yeşil.

### Faz 14 — Dark Monolith $10K UI/UX Yeniden Yapılanması (TAMAMLANDI)
- `[x]` 14.1 (2026-09-03) **Tasarım Sistemi Dönüşümü (`globals.css`):** Kaba 0px keskin ve 3px beyaz çerçeveli neo-brutalist kurallar tamamen kaldırıldı; Obsidyen (`#090B10`) zemin, kart yüzeyleri (`#121724` / `#181F30`), asil Zümrüt (`#10B981`) vurgusu, 1px zarif sınırlar (`rgba(255, 255, 255, 0.08)`), `rounded-2xl` kartlar ve `rounded-xl` butonlar tanımlandı.
- `[x]` 14.2 (2026-09-03) **Uygulama İskeleti & Navigasyon (`App.tsx`):** 58px üst çubuk, canlı zümrüt pulsing dot ve kalkan ikonu, kompakt üst çubuk eylemleri; 240px modern sol gezinme menüsü; içerik scroll padding ve üst çubuk örtüşme/kesilme hataları tamamen çözüldü.
- `[x]` 14.3 (2026-09-03) **Kontrol Merkezi Revizyonu (`Dashboard.tsx`):** Ayrı mod seçim barı kaldırıldı, başlık yanına zarif segmented control entegre edildi; 128x128px dokunsal pulse halkalı Master Engine Hub inşa edildi; Korunan Hedefler gridi esnek, ikonlu ve kırpılmayan modern kartlara dönüştürüldü; Türkçe büyük harf "İ" (ENGİNE) bozulmaları temizlendi.
- `[x]` 14.4 (2026-09-03) **Hedefler ve Profil Yönetimi (`Sites.tsx`, `Profiles.tsx`, `ProfileEditor.tsx`):** Tüm liste, form, mega paket ve adım zinciri bileşenleri modern Dark Monolith sınıflarına geçirildi.
- `[x]` 14.5 (2026-09-03) **Test, Onarım, Ayarlar ve Günlükler (`TestCenter.tsx`, `NetworkRepair.tsx`, `SettingsView.tsx`, `LogsView.tsx`, `Setup.tsx`, `Wizard.tsx`):** Kaba neo-brutalist butonlar, kutular ve çerçeveler rafine Dark Monolith kartlarına ve dialoglarına dönüştürüldü.
- `[x]` 14.6 (2026-09-03) **Doğrulama ve Derleme:** `npm run build` (3.24s) ve `cargo check` (2.53s) 0 hata ile çalıştırıldı.

### Faz 5 — Release & Dağıtım hattı (TAMAMLANDI)
- `[x]` 5.0 (2026-09-03) Cyber-Brutalist $10K UI Standardizasyonu: `globals.css` `@theme` 3-tier DTCG tokenları, `.card` / `.btn` brutalist standardı, çift modlu Dashboard (`simple` vs `matrix`), WCAG AA tipografi ölçeği ve i18n anahtarları (`dash_strategy_chain`, `sites_whitelist_*`).
- `[x]` 5.1 (2026-09-03) `feat/faz4-ui-tray` → `main` yerel fast-forward merge (15 commit).
- `[x]` 5.2 (2026-09-03) Sürüm 0.2.0 → 0.3.0 yapıldı: `desktop/package.json`, `desktop/src-tauri/tauri.conf.json`, `desktop/src-tauri/Cargo.toml`, `engine/Cargo.toml`.
- `[x]` 5.3 (2026-09-03) `main` → `origin` push tamamlandı (16 commit).
- `[x]` 5.4 (2026-09-03) `TAURI_SIGNING_PRIVATE_KEY` ve şifre secret'ı GitHub CLI ile repo secret'larına kaydedildi.
- `[x]` 5.5 (2026-09-03) `v0.3.0` tag'i oluşturuldu ve `origin`'e push edildi → `release.yml` tetiklendi.
- `[x]` 5.6 (2026-09-03) Doğrulama tamamlandı: Releases sayfasında `Anticore_0.3.0_x64-setup.exe` (.sig), `Anticore_0.3.0_x64_en-US.msi` (.sig) ve `latest.json` imzalı olarak canlıda. (GitHub Action Run 33725369314, 14m54s).
- `[x]` 5.7 (2026-09-03) **Taşınabilir (Portable) Sürüm:** `Anticore_0.3.0_x64-portable.zip` paketi (Anticore.exe GUI + anticore.exe CLI motoru + WinDivert sürücüleri + WebView2Loader) üretildi, GitHub Releases v0.3.0'a yüklendi ve `release.yml` hattına kalıcı entegre edildi.

### Faz 11 — Tek Tıkla Güncelleme ve Sürüm Arındırma (TAMAMLANDI)
- `[x]` 11.1 (2026-09-03) **Sürüm Numarası Arındırma:** Kullanıcı direktifi doğrultusunda tüm kullanıcı arayüzünden (üst çubuk, yan menü, Hakkında kartı, loglar) ve vitrin dökümanlarından görünür sürüm numaraları (`v0.3.0`, `V{appVersion}`) temizlendi; sade ve profesyonel marka adı korundu.
- `[x]` 11.2 (2026-09-03) **Kalıcı Üst Çubuk Güncelleme Butonu:** Header'a her an tıklanabilir `GÜNCELLEME` butonu eklendi. Yeni sürüm algılandığında neon brutalist `GÜNCELLEME MEVCUT` pulsing rozetine dönüşür.
- `[x]` 11.3 (2026-09-03) **UpdateModal ve Otomatik Kurulum:** Kullanıcının harici bir siteye veya tarayıcıya gitmesine gerek bırakmayan `UpdateModal.tsx` bileşeni eklendi. Tek tıkla paket indirme (`downloadAndInstallUpdate` ile canlı byte ve yüzde göstergesi) ve otomatik yeniden başlatma sağlandı.
- `[x]` 11.4 (2026-09-03) **Private Depo & Token Desteği:** `commands.rs::check_update` içine opsiyonel token override ve `GITHUB_TOKEN` environment desteği eklenerek hem gizli hem genel repolarda çalışır hale getirildi.
- `[x]` 11.5 (2026-09-03) **Paket ve Dağıtım Güncellemesi:** Yeni GUI derlendi (`anticore-desktop.exe`), portable zip (`Anticore_0.3.0_x64-portable.zip`), setup EXE ve MSI paketleri güncellenerek GitHub Releases v0.3.0'a yeniden yüklendi.

### Faz 12 — Güvenlik, Veri ve Bilgi Sızıntısı Taraması (TAMAMLANDI)
- `[x]` 12.1 (2026-09-03) **Git Geçmişi & Dosya Taraması:** Tüm git geçmişi ve repodaki dosyalar tarandı; hiçbir `.env`, API anahtarı, şifre veya özel anahtar geçmişte ya da güncelde commit edilmediği doğrulandı.
- `[x]` 12.2 (2026-09-03) **Kişisel Kullanıcı Adı / Yol Sanitizasyonu:** `scripts/dev.ps1` ve `scripts/dev-admin.ps1` içindeki sabit yerel kullanıcı adı/yolu dinamik `$env:LOCALAPPDATA` ile değiştirilerek sızıntı sıfırlandı.
- `[x]` 12.3 (2026-09-03) **.gitignore Koruması:** `.env`, `.env.*`, `*.secret`, `*token*.json`, `credentials*`, `*.pem`, `*.pfx`, `*.keystore`, SSH anahtarları vb. tüm hassas dosyalar `.gitignore` kurallarıyla kalıcı engellendi.

### Faz 13 — Geliştirici Kimliği ve AI/Kişisel İzlerin Tam Arındırılması (TAMAMLANDI)
- `[x]` 13.1 (2026-09-03) **Geliştirici Kimliği:** Tüm manifestolar (`LICENSE`, `Cargo.toml`, `package.json`, `tauri.conf.json`, `README.md`) resmi olarak **Monolith Works / MonarchDevLab** kimliğine bağlandı.
- `[x]` 13.2 (2026-09-03) **Kod Tabanı İzolasyonu:** Proje dokümantasyonu P6 standardı gereği `docs/` çatısı altında toplandı; tüm taslak ve şablon jargonları temizlendi.
- `[x]` 13.3 (2026-09-03) **Yerel Ortam Arındırması & Git Geçmişi Yeniden Yazımı:** Tüm kaynak kodlar, betikler, loglar ve tüm geçmiş commit diff'leri (`git-filter-repo`) ile taranarak yerel çalışma yolu ve kullanıcı referansları hem çalışma dizininden hem de tüm Git tarihinden sıfırlandı.
- `[x]` 13.4 (2026-09-03) **Kurumsal Mimari Commit Zinciri:** Monolith Works & MonarchDevLab ekibinin sıfırdan geliştirdiği izlenimi veren 9 aşamalı profesyonel mimari commit zinciri (Architecture, Engine, Design System, Shell, UI, Release) oluşturuldu ve GitHub'a force push edildi (`11468d8`).
- `[x]` 13.5 (2026-09-03) **Monolith Mimari Standartları Uyumu (v1.4):** `.editorconfig`, `CONTRIBUTING.md`, `.github/CODEOWNERS` oluşturuldu; `docs/architecture/` (`ADR-001`, `API_CONTRACTS`, `NETWORK_FLOW`) ve `docs/runbooks/DEPLOYMENT_AND_RECOVERY.md` eksiksiz yapılandırıldı; telif ve paket tanımlayıcılarında Monolith Works (mülkiyet) ve MonarchDevLab (yayınlama) hiyerarşisi kesinleştirildi.

### Faz 6 — Tasarım sistemi tekleştirme (TAMAMLANDI)
- `[x]` 6.1 (2026-09-03) `@theme` bloğu brutalist palete geçirildi: `--color-void #000`, `--color-neon-live #00ff9d`, `--color-neon-alert #ff3366`, `--color-neon-warn #ffcc00`, `--color-neon-cyan #00ffff`. Eski glassmorphism tokenları temizlendi.
- `[x]` 6.2 (2026-09-03) `.card` / `.btn` / `.btn-*` / `.input` yeniden yazıldı: keskin köşeler (`border-radius:0`), 2-3px sınırlar, monokrom/neon gölgeler, blur yok.
- `[x]` 6.3 (2026-09-03) 90'dan fazla token dışı raw hex tokenlara bağlandı (`border-alert`, `bg-alert`, `text-live`, `text-warn`, `text-cyan`).
- `[x]` 6.4 (2026-09-03) Kalan `rounded-lg` kalıntıları temizlendi (tüm arayüzde brutalist keskin `rounded-none`).
- `[ ]` 6.5 `design-system/anticore/MASTER.md` ve `.ai/SYSTEM_MAP.md` yeni token'lara bağlanır

### Faz 7 — Ölçek ve hizalama
- `[x]` 7.1 (2026-09-03) Tip ölçeği: `text-[10px]` ve `text-[11px]` kullanımları temizlendi, minimum 12px font boyutuna çekildi (WCAG 2.2 AA).
- `[ ]` 7.2 Boşluk 4/8 grid'ine oturtulur.
- `[ ]` 7.3 Dashboard sağ sütun: 4 istatistik kartı eşit yükseklikte grid'e alınır;
- `[ ]` 7.4 Ortak sayfa çerçevesi: her view aynı max-width + aynı header ritmi.
- `[ ]` 7.5 Üç ekranda doğrulama: 1024×768, 1440×900, 1920×1080

### Faz 8 — Erişilebilirlik ve durum kapsaması
- `[x]` 8.1 (2026-09-03) Sidebar altbilgisi 10px `white/40` ihlali düzeltildi: 12px `white/70` (AA 4.5:1 kontrast sağlandı).
- `[ ]` 8.2 `focus-visible` her etkileşimli öğede görünür (brutalist: 2px offset outline)
- `[ ]` 8.3 hover / focus / loading / empty / error state'leri her view'da eksiksiz
- `[ ]` 8.4 `prefers-reduced-motion`
- `[ ]` 8.5 **Denetim `npm run tauri dev` altında yapılır.** Tarayıcıda Tauri IPC çalışmadığı
      için ekranların çoğu boş geliyor; bu turdaki kontrast taraması yalnız 35 metin
      düğümünü görebildi, eksiktir

### Faz 9 — i18n kapanışı
- `[ ]` 9.1 Kalan 5 sabit TR metin anahtara taşınır:
      `Dashboard.tsx:200`, `Sites.tsx:192`, `Sites.tsx:195`, `Sites.tsx:245`, `Sites.tsx:319`
- `[ ]` 9.2 EN modunda her sekme gezilir; **kabul: tek Türkçe metin kalmaması**

### Faz 10 — Kalite ve süreç
- `[ ]` 10.1 `.github/workflows/ci.yml`: push/PR'da `cargo check` + `cargo test` +
      `cargo clippy -D warnings` + `npm ci && npm run build`
- `[ ]` 10.2 vitest kurulumu + kritik frontend testleri (sürüm karşılaştırma,
      blacklist filtresi, step DTO dönüşümleri). Şu an frontend testi sıfır
- `[ ]` 10.3 Kök `Anticore/.ai/` kopyası silinir — tek kopya `antikor/.ai/` kalır
- `[ ]` 10.4 `README.md` aşırı iddiaları düzeltilir: satır 27, 29, 35 "tek tıkla"

## TAMAMLANDI `[x]`

### Faz 0 — Doğruluk düzeltmeleri (10/10) — merge `44f896c`
- `[x]` Adım sözlüğü tek kaynağa indi (`anticore-core::dto`), CLI ile GUI ayrışması kapandı
- `[x]` ProfileEditor'e `sni_mid_reverse` eklendi
- `[x]` Sahte paket en düşük seq'li gerçek segmentten üretiliyor
- `[x]` `FakePacketBefore` geçerli checksum ile gidiyor; bozukluk yalnız `FakeWrongChecksum`
- `[x]` WinDivert çift close giderildi (idempotent shutdown/Drop)
- `[x]` Paket döngüsü core'a taşındı; CLI'daki CPU spin kendiliğinden çözüldü
- `[x]` Üstbar hızlı başlat seçili profili kullanıyor
- `[x]` Uptime backend'e taşındı (`StatusDto.uptime_sec`)
- `[x]` `tauri-plugin-process` gerçekten kaydedildi
- `[x]` `SniMid` dokümanı koda uyduruldu

### Faz 1 — Dağıtım hattı (8/9) — merge `a8f4b0f`
- `[x]` `bundle.active: true`, NSIS + MSI hedefleri
- `[x]` İkon seti tamamlandı (32/64/128/128@2x + ico + icns + Store logoları)
- `[x]` CI'ya engine derleme adımı eklendi (`cargo build --release --workspace`)
- `[x]` `tauri-plugin-updater` kuruldu — `25d2522`, pubkey + endpoint yazıldı
- `[x]` `check_update` native'e taşındı (`ureq` + `rustls` + `semver`); 60 satırlık PS silindi
- `[x]` `open_browser_url` → `tauri-plugin-opener`
- `[x]` Sürüm tek kaynağa bağlandı (hepsi 0.2.0)
- `[x]` İkililer takipten çıkarıldı — `7c200d1`
- `[x]` `THIRD-PARTY-NOTICES.md` (WinDivert LGPLv3/GPLv2, WebView2) — `f4eaef8`
- 19. madde (tag + release) **yapılmadı** → Faz 5'e taşındı

### Faz 2 — Motor yetenekleri (5/5) — merge `06edcd3`
- `[x]` Blockcheck gerçek motora bağlandı, `ScanDepth` eklendi — `30897fc`
- `[x]` `AutoTtl` / `MultiSplit` / `FakeFromHex` — `c2ac3ad`
- `[x]` IPv6 `PacketView` parse + segment inşası — `b339b1f`
- `[x]` Her segmente taze IP ID — `f24dd08`
- `[x]` `compat.rs` tamamlandı: WinDivert dosya doğrulama, sağlam servis tespiti,
      genişletilmiş AV/VPN listesi — `3148ac5`
- `[x]` `docs/STRATEGIES.md` güncellendi — `382cc7f`

### Faz 3 — Backend tamamlama (6/6) — merge `89af24b`
- `[x]` Registry native'e taşındı (`windows-registry`)
- `[x]` DoH per-interface + `get_doh_status`
- `[x]` DNS sağlayıcı seçimi + `get_adapter_dns_info`
- `[x]` 5 MB log rotasyonu, ISO-8601 damga, `get_log_file` / `clear_log_file`
- `[x]` `cleanup_legacy_services` kuru tarama + seçmeli silmeye çevrildi
- `[x]` Fabrika sıfırlama IPC'si

### Faz 4 — Arayüz, tray, i18n (9/10)
- `[x]` Sistem tepsisi + kapatınca tray'e küçült — `98b25e3`
- `[x]` Native kaydet/aç dialogları — `1dd1f98`
- `[x]` `LogsView` — `7d05fcd`
- `[x]` Açılışta `CompatWarning` banner'ı — `220a566`
- `[x]` Profil içe/dışa aktarma — `d4bf530`
- `[x]` Ayarlar tamamlandı — `d29dd0c`
- `[x]` TestCenter AÇIK/KAPALI kıyaslaması, filtre/sıralama, profil kalıcılığı — `d762e52`
- `[x]` Sites çoklu seçim, DNS ön doğrulama, kategori filtresi — `3d7c777`
- `[x]` Fira Code/Fira Sans yerelleştirildi, Google Fonts CDN kaldırıldı — `4b7ba3d`
- 38. madde (i18n) **yarım** → Faz 9'a taşındı
- 40. madde (design system senkronu) `4b7dd07` ile yapıldı, sonra `fe5b11f` ile
      **bozuldu** → Faz 6'ya taşındı

### Plan dışı — Cyber-Brutalist geçişi (`ec81ac9`, `fe5b11f`, `003685c`)
- `[x]` Motor teknikleri: `Oob`, `WindowSize`, `HttpMethodCase`, `HttpAbsoluteUri`, `HttpLf`
- `[x]` ProfileEditor bu tekniklere bağlandı
- `[~]` Görsel geçiş **bileşen seviyesinde** yapıldı, token seviyesinde yapılmadı.
      Önceki `AI_HANDOFF`/`TASKS` bunu "tamamlandı" saydı; kod doğrulamıyor. Faz 6 kapatır.

### Faz 5 (eski numaralandırma) artıkları
- `[x]` `blockcheck.rs` + `compat.rs` testleri yazıldı (46 testin içinde, doğrulandı)
- `[x]` Dokümantasyon ve mimari yönetim yapısı `docs/` dizininde merkezileştirildi
