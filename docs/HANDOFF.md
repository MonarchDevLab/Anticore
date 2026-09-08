# HANDOFF

## Anlık Durum
Anticore v0.3.0, Ouroboros v6.0 disiplini ile derinlemesine restore edildi:
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
    - *Amber CRT:* Tam ekran CRT scanline overlay katmanı (`#root::after`), CRT phosphor kehribar ışıması ve zorunlu monospace (`font-mono`).
- **Doğrulama:** `npm run build` 0 hata (1537 modül, 2.53s), `cargo check` (desktop/src-tauri) 0 hata, `cargo test` (src-tauri) 8/8 yeşil, `cargo test --workspace` 46/46 yeşil (10.59s). Dağıtım ikilileri (`dist/`, `dist-portable/`, `Anticore.exe`) güncellendi.

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
