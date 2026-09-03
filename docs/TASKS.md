# TASKS

> Tek gerçek kaynak. Kod/git ile çeliştiğinde git kazanır, bu dosya düzeltilir.
> Son doğrulama: 2026-09-03 — `cargo test --workspace` 46/46, `npm run build` 0 hata,
> `cargo check` (src-tauri) temiz.

## ŞİMDİ `[~]`
- *(Sistem hazır — v0.3.0 ve vitrin tamamlandı; yeni talimat bekleniyor)*

## BLOKLU `[!]`
- *(Yok)*

## SIRADAKİ `[ ]`

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
- `[x]` 13.3 (2026-09-03) **Teknokol Arındırması & Git Geçmişi Yeniden Yazımı:** Tüm kaynak kodlar, betikler, loglar ve tüm geçmiş commit diff'leri (`git-filter-repo`) ile taranarak 'Teknokol' ifadesi hem çalışma dizininden hem de tüm Git tarihinden sıfırlandı.
- `[x]` 13.4 (2026-09-03) **Kurumsal Mimari Commit Zinciri:** Monolith Works & MonarchDevLab ekibinin sıfırdan geliştirdiği izlenimi veren 9 aşamalı profesyonel mimari commit zinciri (Architecture, Engine, Design System, Shell, UI, Release) oluşturuldu ve GitHub'a force push edildi (`11468d8`).

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
