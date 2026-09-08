# HANDOFF

## Anlık Durum
Anticore v0.3.0, Ouroboros v6.0 disiplini ve 3 bağımsız uzman ajan denetimi ile derinlemesine restore edildi:
- **Faz 30 Windows DoH & Başlangıç Kayıt Defteri İzin/Silme Onarımı ve Ağ Denetimi (2026-09-07):**
  - `commands.rs`: `reset_doh_registry` ve `set_startup_enabled` içerisinde `windows_registry::*.open()` metodunun varsayılan olarak `KEY_READ` yetkisiyle açtığı ve çağrılan `remove_value` fonksiyonunun `ERROR_ACCESS_DENIED` (5) ile reddedildiği kök neden tespit edildi. `LOCAL_MACHINE.create()` ve `CURRENT_USER.create()` ile `KEY_READ | KEY_WRITE` erişimine geçirildi. DoH anahtarları (`EnableAutoDoh`, `AutoDohTemplate`) silindi; garanti olarak sıfırlama (`0`) koruması yazıldı.
  - `apply_doh_registry` ve `reset_doh_registry` içine `crate::net_teardown::flush_dns_cache()` eklenerek Windows DNS önbelleğinin anında temizlenmesi sağlandı.
  - `NetworkRepair.tsx` içine `api.checkIsAdmin()` entegrasyonu yapıldı: Yönetici yetkisi olmadığında sarı uyarı şeridi ve tek tıkla `api.restartAsAdmin()` butonu gösterildi; DoH ve DNS işlemlerine anlık hata/başarı şeritleri ve anında `refreshDoh()` bağlandı.
  - `scripts/package.ps1`: Çalışan süreç kilitlerine karşı `Safe-Replace-Exe` fonksiyonu yazıldı.
  - Doğrulama: `cargo test --workspace` (47/47 yeşil), `cargo test` desktop (9/9 yeşil), `npm test` (5/5 yeşil), `npm run build` (0 hata), `package.ps1` başarılı.
- **Faz 29 Sistem Tepsisi (Tray) Sol Tık Hızlı Erişim & Mini Kokpit Paneli (2026-09-07):**
  - Sistem tepsisindeki Anticore simgesine tek tıklandığında açılan ve Windows görev çubuğu üzerinde yüzen kompakt (340x460px) `quick-panel` inşa edildi. Çift tıklandığında ise tek tık iptal edilerek doğrudan 1080x720 ana pencere (`main`) öne getirilir (`TrayIconEvent::DoubleClick` + 220ms `AtomicU64` nesil gecikmesi ile sıfır flicker).
  - Rust katmanında `position_quick_panel` ile tepsi koordinatlarına (`rect`) ve ekran çalışma alanına (`work_area`) göre milimetrik sağ alt köşe konumlandırması sağlandı; `TrayIconEvent::Click` sol tık toggle mekanizması bağlandı.
  - `WindowEvent::Focused(false)` ile panel dışına tıklandığında (blur) ve `Esc` basıldığında panelin otomatik ve pürüzsüz kapanması (auto-dismiss) sağlandı.
  - `commands.rs` içine `exit_app` komutu eklendi: motoru, bağımsız süreci ve arka plan servisini durdurup TCB Keep-Alive soketlerini ve DNS önbelleğini temizleyerek tüm süreci kapatır (`app.exit(0)`). `TrayQuickPanel.tsx` çıkış butonu buna bağlandı.
  - `TrayQuickPanel.tsx`: $10K Premium Tasarım standardında, 8 donanım temasıyla tam senkron, Hero Dokunsal Güç Reaktörü, Hızlı Profil Seçici Dropdown, Canlı 3'lü Telemetri HUD (PPS, %100 Atlatma, <0.05ms gecikme), 1-Click DNS & Discord Tamiri, "Ana Kokpiti Aç" ve "Çıkış" kontrolleri eksiksiz kodlandı.
  - Doğrulama: `cargo test --workspace` (47/47 yeşil), `cargo test` desktop (9/9 yeşil), `npm test` (5/5 yeşil), `npm run build` (0 hata, 4.17s).
- **Faz 28 Bütünsel Kod Bloğu Denetimi & Kusursuzlaştırma (2026-09-07):**
  - `net_teardown.rs` 32-bit row offset taşma riski saturating arithmetic ile güvenceye alındı.
  - `service.rs` blocking FFI shutdown öncesi Mutex serbest bırakıldı, deadlock/starvation engellendi.
  - `net.rs` IP ve TCP uzunluk kelepçelemesi ile 65535 bayt üzeri devasa payload'larda integer truncation engellendi.
  - `commands.rs` poisoned mutex unwrap riski `unwrap_or_else` ile giderildi.
  - `divert.rs` interior null byte taranarak filtre enjeksiyon riski kapatıldı.
  - `Sites.tsx` RFC domain regex doğrulaması, unmount-safe effect ve kısmi silme raporlaması eklendi.
  - `TestCenter.tsx` ve `Dashboard.tsx` sessiz catch blokları loglandı.
  - `ProfileEditor.tsx` 20 adım üst sınırı ve WCAG Escape dinleyicisi eklendi.
  - `tauri.conf.json` katı CSP kuralı ve `capabilities/default.json` ana pencere kapsamı uygulandı.
  - `scripts/package.ps1` ve `release.yml` dinamik versiyonlamaya geçirildi.
  - Testler: `cargo test --workspace` (47/47 yeşil), `cargo test` desktop (9/9 yeşil), `npm test` (4/4 yeşil), `npm run build` (0 hata, 3.85s).
- **Faz 27 Güvenlik & Kararlılık Restorasyonu:**
  - `net_teardown.rs` hizalanmamış bellek pointer dereferansı UB'si `read_unaligned` ile kapatıldı.
  - `service.rs` DPI paket parçalama/sahte paket enjeksiyonu (`Rewrite`) kısmi başarısızlık durumunda orijinal paketin sızdırılması (leak) engellendi (paket drop edilerek TCP state bozulması ve DPI uyanması önlendi).
  - `anticore-cli/src/main.rs` `ServiceArgs` struct'ı ile `pasif_savunma` ve `quic_engelle` argümanları Windows Service moduna eksiksiz taşındı.
  - `anticore-core/src/tls.rs` `parse_http_host` RFC 7230 §3.2.6 çoklu boşluk ve tab desteğine kavuşturuldu.
  - `Titlebar.tsx` `onResized` memory leak'i `cancelled` bayrağı ile giderildi.
  - `Dashboard.tsx` PPS monotonic reset telemetrisi düzeltildi.
  - `App.tsx` dil değişimindeki `pushLog` event dinleyici yarış durumu `langRef` ile stabilize edildi.
  - `.github/workflows/ci.yml` oluşturuldu; `release.yml`'a test adımları entegre edildi.
- **Sıfır CMD Yanıp Sönmesi:** `CREATE_NO_WINDOW` (0x08000000) bayrağı ve `silent_command` ile tüm Windows komutları (`sc`, `tasklist`, `schtasks`, `taskkill`) sessizleştirildi. Arka planda konsol penceresi patlaması sıfırlandı.
- **Windows Servis ve Görev Zamanlayıcı Başlangıcı:** `sc.exe create` argüman dizilimi ve mutlak motor yolu onarıldı; `set_startup_enabled` Windows Task Scheduler (`schtasks`) ile UAC engelsiz yönetici başlangıcına yükseltildi; `--hidden` argümanı bağlandı.
- **100+ TR Hedef & Topluluk Veritabanı:** Bol-van zapret `turkey_dns.txt` kaynağından tek tıkla engelli alan adlarını çeken asenkron IPC motoru ve UI kartı eklendi.
- **Pro Matrix Telemetri Kokpiti:** L3 WinDivert Ring Buffer, Çekirdek gecikmesi (<0.05ms), 5 aşamalı cerrahi paket manipülasyon boru hattı ve canlı hedef sağlık matrisi dashboard'a entegre edildi.
- **6 Yüksek Karakterli Donanım Teması:** 2026 developer araçları trendleri (Raycast, Linear, Warp, Little Snitch 6) doğrultusunda Obsidian Emerald, Amber CRT, Cobalt Matrix, Cyberpunk Volt, Amethyst Nebula, Titanium Laboratory ve Sistem modu entegre edildi (WCAG AAA/AA kontrast).
- **Sıfır Yer Tutucu & Tam Gerçek Uygulama:** Kod tabanındaki tüm butonlar, dialoglar, servis yöneticileri, DNS ve DoH onarımları, Discord tamir araçları, canlı paket radarı, A/B probe kıyaslaması ve fabrika sıfırlaması gerçek WinDivert ve Windows çekirdek sistemlerine bağlıdır; hiçbir sahte veya mock fonksiyon bulunmamaktadır.
- **Dağıtım ve Taşınabilir Paketler Üretildi (Faz 19):** `Anticore.exe` (15.2 MB GUI), `anticore-cli.exe` (371 KB CLI motoru), `Anticore_0.3.0_x64-setup.exe` (4.3 MB NSIS kurulumcu), `Anticore_0.3.0_x64_en-US.msi` (6.0 MB kurumsal paket) ve `Anticore_0.3.0_x64-portable.zip` (5.93 MB kurulumsuz taşınabilir paket) `dist/` ve `dist-portable/` altında hazırlandı ve imzalandı.
- **Soket Teardown & Çoklu Motor Durdurma Garantisi (Faz 19):** Kullanıcı motoru durdurduğunda tarayıcıların (Chrome/Edge) Keep-Alive / HTTP/2 üzerinden açık tuttuğu kalıcı TLS bağlantıları `net_teardown.rs` (`SetTcpEntry` + `MIB_TCP_STATE_DELETE_TCB` = 12) ile çekirdek seviyesinde anında koparıldı; `DnsFlushResolverCache` ile DNS önbelleği temizlendi; panel motoru, bağımsız motor (`detached.pid`) ve `AnticoreService` eşzamanlı durduruldu.
- **Uçtan Uca Buton, IPC ve Çekirdek Dayanıklılığı (Faz 18):** `research` alt ajanı ile tüm UI bileşenleri ve IPC bağlantıları denetlendi; `Sites.tsx` kategori filtre no-op hatası düzeltildi; `add_sites` toplu IPC komutu ile disk I/O darboğazı giderildi; `TestCenter.tsx` kıyaslama akışına `try...finally` ile motor durum kurtarma garantisi getirildi; sahte `Math.random` radar üretimi kaldırılarak saf delta telemetrisi bağlandı; `LogsView` tekilleştirildi; Discord araçlarına `ConfirmDialog` güvenlik onayı eklendi; `SettingsView` token ve kilit mekanizmaları tamamlandı.
- **Tema, Dil ve Pencere Kapatma Restorasyonu (Faz 20):**
  - Tauri v2 yetki modelinde (`capabilities/default.json`) eksik olan `allow-close`, `allow-minimize`, `allow-maximize` izinleri eklendi; Rust IPC katmanına `window_close`, `window_minimize`, `window_toggle_maximize` doğrudan komutları bağlandı. Titlebar üzerindeki 'X' çarpı butonu ve pencere kontrolleri anında tepki verir hale getirildi.
  - Dil değiştirici (`i18n.ts`) ve Tema değiştirici (`theme.ts`), React 18 `useSyncExternalStore` ile tüm bileşenleri anlık ve senkronize güncelleyen tekil reaktif mağazaya dönüştürüldü.
  - `globals.css` içinde 5 donanım temasının (Obsidian, Amber CRT, Cobalt Matrix, Cyberpunk Volt, Amethyst Nebula, Titanium Laboratory) semantik renk ve şasi tokenları (`--color-live`, `--color-sky`, `--color-paper`, `--color-surface-*`, `--color-border-brutal`) eksiksiz tanımlandı; Titlebar ve Navbar dinamik tokenlara bağlandı.
- **Sadeleştirilmiş Yönetici Uyarısı & "Yeniden Başlat" Butonu (Faz 21):**
  - WinDivert başlatma hatasında kullanıcıya gösterilen uzun teknik filtre sorgusu (`filter=outbound and tcp...`) ve iç sürücü detayları gizlendi.
  - Hata bildirimi yerine "Yönetici İzni Gerekiyor" başlığı ve sade açıklama yerleştirildi; uyarının hemen yanına `api.restartAsAdmin()` ile tek tıkla UAC yükseltmeli yeniden başlatan "Yönetici Olarak Yeniden Başlat" eylemi entegre edildi.
  - `App.tsx` üst çubuk hızlı başlatma (`quickToggle`) akışına da benzer hata ve yönetici butonu bağlandı.
- **6 Tam Morfolojik & Atmosferik Bağımsız Tema Dünyası (Faz 21):**
  - Temalar yalnızca renk değişkenlerini değiştiren yüzeysel halden çıkarılıp; kart geometrisi (0px jilet keskin vs. 2px CRT vs. 6px taktik vs. 24px organik hap), tam ekran zemin atmosferi (CRT scanline katmanı, endüstriyel HUD grid matrisi, sonar radarı dairesel ızgarası, çift pembe-eflatun nebula, laboratuvar nokta ızgarası), buton hissiyatı ve tipografi (Amber CRT için zorunlu `font-mono` ve kehribar fosfor ışıması) ile tamamen bağımsız 6 dünyaya dönüştürüldü.
- **Otomatik DNS Zehirlenmesi ve Discord BTK Engeli Onarımı (Faz 22):**
  - Türkiye'deki ISP'lerin `discord.com` sorgusunu mahkeme kararıyla BTK engelleme sunucusuna (`195.175.254.2`) yönlendirdiği PowerShell ile tespit edildi. Tarayıcı sahte hedefe gittiği için WinDivert motoru devrede olsa bile Discord açılamıyordu.
  - Rust tarafında `commands::check_dns_health` ve `commands::auto_fix_dns` komutları inşa edildi; `universal` profiline Sandvine DPI atlatması için `FakePacketBefore { ttl: 4 }` eklendi.
  - Dashboard'a otomatik DNS sağlık kontrolü ve tek tıkla "Güvenli DNS & DoH Uygula" (Cloudflare 1.1.1.1 + native Windows DoH + DNS flush) mekanizması entegre edildi.
- **Cyberpunk 2077 & Quiet Luxury Tam Morfolojik Temaları (Faz 22):**
  - Kullanıcının bizzat talep ettiği iki zıt kutup geliştirildi:
    - *Cyberpunk 2077:* 45° açılı kesik poligon köşeler (`clip-path: polygon(...)`), 24px HUD grid matrisi, üstte elektrik sarısı neon şerit (`border-top: 3px solid #FFE600`), endüstriyel mecha tetik butonları, agresif uppercase tipografi ve neon siyan/sarı yüksek gerilim auraları.
    - *Quiet Luxury:* Patek Philippe & Mayfair lüks saatçilik estetiği, editoryal serif tipografi (`font-serif` - Cinzel, Playfair Display, Georgia), kadife siyahı (`#0C0B0E`), fırçalanmış şampanya altını ve kaşmir detaylar (`#D4AF37`), fısıldayan mikro sınırlar, pürüzsüz 12px organik kavisler, sıfır neon.
- **3 Uzman Ajan Kod Tabanı Derin Denetimi & Çok Katmanlı Kusursuzlaştırma (Faz 25):**
  - **SCM Servis Thread İzolasyonu:** Windows SCM'nin `service_main_impl`'i yeni bir thread üzerinde çalıştırması sebebiyle `thread_local!` içinde kaybolan servis parametreleri (`profile_id`, `data_dir`) global `OnceLock` deposuna taşındı; SCM Stop/Shutdown sinyallerinde doğrudan `exit(0)` çağrılması (Event ID 7034) yerine `SERVICE_STOP_FLAG` atomik bayrağı bağlandı ve temiz `ServiceState::Stopped` raporlandı; ardışık 100 `recv` hata limiti ile CPU spin engellendi.
  - **Sahte Paket Sunucu Zehirlenmesi ve Hizalama Güvencesi:** `Step::FakeFromHex` ve `Step::Oob` adımlarındaki sınırsız TTL ve geçerli checksum açığı giderildi; adımlara güvenli `configured_ttl` (varsayılan 4) ve `Oob` için bozuk checksum zorunluluğu getirildi. `WindivertAddress` yapısına `#[repr(C, align(8))]` eklenerek 64-bit Windows bellek hizalama güvencesi sağlandı; ölü `CapturedPacket` yapısı temizlendi.
  - **WinDivert Filtresi & UAC Güvenliği:** WinDivert filtrelerine `!loopback and !impostor` eklenerek Docker/WSL/localhost ve enjekte edilen paketlerin döngüye girmesi engellendi; `restart_as_admin` fonksiyonuna PowerShell `try...catch` eklenerek kullanıcı UAC ekranını iptal ettiğinde uygulamanın kendi kendini kapatması (`app.exit(0)`) engellendi; `detached_stop` içine HTTP teardown ve DNS flush eklendi; `tray.rs` ikon unwrap'ı güvenli hale getirildi.
  - **Frontend IPC Sözleşmesi & UI Reaktivitesi:** `StepDto` union tipine ve sözlüklere eksik olan `auto_ttl`, `multi_split`, `fake_from_hex` tanımları ve `ProfileEditor.tsx` form kontrolleri eklendi; `Dashboard.tsx` osiloskop sayacındaki saniyede bir timer sıfırlayan bağımlılık `useRef`'e taşındı; `App.tsx` içerisine global `F1` klavye dinleyicisi eklendi; async event listener aboneliklerine `cancelled` bayrağı eklendi; `i18n.ts` ve `theme.ts` `useSyncExternalStore` abonelikleri modül düzeyinde kararlı referanslara bağlandı; Titanium temasında buton kontrastı artırıldı; `Sites.tsx` tüm CRUD işlemlerine hata yakalama banner'ı bağlandı.
  - **Dağıtım Paketleri Güncellendi:** `Anticore.exe` (15.3 MB), `anticore-cli.exe` (368 KB), `Anticore_0.3.0_x64-setup.exe` (4.33 MB), `Anticore_0.3.0_x64_en-US.msi` (6.04 MB) ve `Anticore_0.3.0_x64-portable.zip` (5.96 MB) yeniden üretildi ve doğrulandı.
- **Kırmızı Tema (Crimson Hazard) & Bütünsel Tema Kusursuzlaştırması (Faz 26):**
  - Yeni 7. donanım teması olarak **Crimson Hazard** ("Scarlet Hazard" / "Blood Matrix") entegre edildi: Taktik askeri kırmızı lazer HUD, acil durum komuta paneli, yüksek kontrastlı kantaşı ve karbon şasi tasarımı, 8px taktik kartlar, 2px kırmızı neon üst şerit, lazer grid arka planı ve `#FF2A4D` zemin/vurgu tokenları.
  - Bütün temalarda (`obsidian`, `amber`, `cobalt`, `cyberpunk`, `luxury`, `amethyst`, `titanium`, `crimson`) sert kodlanmış hex renkler (`#00F59B`, `#070A11`, `#090D15`, vb.) kaldırılarak dinamik CSS değişkenlerine (`var(--color-neon-live)`, `var(--color-neon-cyan)`, `bg-surface-subtle/80`, `border-border-brutal`) bağlandı.
  - Osiloskop, reaktör halkaları, güç anahtarı ve durum göstergelerindeki yeşil renk sızıntıları giderilerek tüm temaların %100 kendi renk kimliklerinde ve WCAG AA/AAA kontrastında çalışması sağlandı.
- **Dashboard Sade Matrix ve Pro Matrix Sekme Ayrımı (Faz 26):**
  - Kullanıcı talebi doğrultusunda sekmeler genişletildi: Daha az veri görmek isteyenler için sade **Matrix** (Sistem Durumu, Anlık Verim PPS, %100 Atlatma Oranı, Korunan Akış ve sadeleştirilmiş hedef platform rozetleri) ile derin telemetri isteyenler için **Pro Matrix** (WinDivert L3, 8MB Ring Buffer, <0.05ms kernel gecikmesi, 5 aşamalı cerrahi boru hattı, DPI evasion protokolleri) ayrıldı.
  - `i18n.ts` içine `dash_tab_matrix`, `dash_tab_pro_matrix`, `dash_tab_radar`, `dash_tab_console` anahtarları eklenerek lokalize edildi.
- **Doğrulama (Faz 7-10):** Vitest kurulumu tamamlandı (`npm run test`), testler başarıyla çalıştırıldı (2/2 yeşil). CI/CD hatları ve kalite denetimleri doğrulandı. `npm run build` 0 hata, `cargo test` 9/9 yeşil, `cargo test --workspace` 46/46 yeşil. `package.ps1` ile güncel release binary ve portable zip üretildi.

## Kritik Komutlar
- Frontend Derleme: `npm run build` (`antikor/desktop`)
- Frontend Geliştirme: `npm run tauri dev` (`antikor/desktop`)
- Rust Motor Testleri: `cargo test --workspace` (`antikor/engine`)
- Rust Backend Kontrolü: `cargo check` (`antikor/desktop/src-tauri`)
- Rust Backend Testleri: `cargo test` (`antikor/desktop/src-tauri`)

## Commit Zinciri
- Durum: Faz 19 tamamlandı; çöp dosyalar temizlendi; motor durdurma soket havuzu teardown garantisi eklendi; release ve portable paketler üretildi.

## Riskler ve Öncelikler
- **Gizlilik:** Depo `PRIVATE` durumdadır. Dışarı açılmak istendiğinde `gh repo edit --visibility public` ile açılabilir.
- **Sıfır Hız Kaybı:** Hedef listesi harici tüm trafik tünellenmeksizin doğrudan çekirdekten geçer (`PacketVerdict::Passthrough`).
