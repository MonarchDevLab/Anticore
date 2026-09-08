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
- **Doğrulama:** `npm run build` 0 hata (1537 modül), `cargo check` (desktop/src-tauri) 0 hata, `cargo test` (src-tauri) 8/8 yeşil, `cargo test --workspace` 46/46 yeşil.

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
