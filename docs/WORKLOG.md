# WORKLOG

## Aktif Oturum (Son Oturumun Detayları)
- **Tarih:** 2026-09-03
- **Gerçekleşenler:**
  1. UI/UX ve Hizalama/Ölçekleme Kapsamlı Revizyonu: Kaba 0px keskin ve 3px kalın beyaz çerçeveli neo-brutalist şablon kaldırıldı; modern **$10K Dark Monolith** tasarım sistemine geçildi (`globals.css`, `App.tsx`, `Dashboard.tsx`, `Sites.tsx`, `Profiles.tsx`, `ProfileEditor.tsx`, `TestCenter.tsx`, `NetworkRepair.tsx`, `SettingsView.tsx`, `LogsView.tsx`, `Setup.tsx`, `Wizard.tsx`).
  2. Scroll & Üst Çubuk Örtüşme Giderimi: Üst çubuk altına girerek başlığı ikiye bölen ve taşma yaratan kaydırma hatası içerik scroll padding'i ile çözüldü; sol gezinme menüsü 240px'e sabitlendi.
  3. Master Engine Hub & Korunan Hedefler: 128x128px dokunsal nabız halkalı güç butonu entegre edildi; Korunan Hedefler gridi esnek `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` yapısına uyarlandı, alan adı kırpılmaları (`...`) giderildi ve Türkçe büyük harf "İ" (`ENGİNE`, `SOCİAL`) bozulmaları düzeltildi.
  4. Taze Üretim Paketleri: Yeni arayüzle derlenen `anticore-desktop.exe` (15.1 MB), `Anticore_0.3.0_x64-setup.exe` (4.2 MB), `Anticore_0.3.0_x64_en-US.msi` (5.9 MB) ve `Anticore_0.3.0_x64-portable.zip` (6.1 MB) başarıyla üretildi.
  5. Doğrulama: `npm run build` (0 hata, 3.24s), `cargo check` (0 hata, 2.53s), `cargo test --workspace` (46/46 yeşil).

## Mimari Kararlar
- `[KARAR-001]` **Zero-Loss Passthrough (Sıfır Kayıplı Geçiş):** İnternetteki her paketi işlemek yerine, yalnızca `Sites.tsx` içerisinde (veya aktif paketteki) belirlenmiş alan adlarına giden trafik DPI Bypass motorundan geçirilecek. Böylece kullanıcının normal web gezintisi, bankacılık işlemleri, oyun ping değerleri asla etkilenmeyecek.
- `[KARAR-004]` **Portable Bundle Isolation:** WinDivert.dll/sys ve WebView2Loader.dll doğrudan uygulama köküne ve bin/ dizinine yerleştirilerek bağımlılık arama yolu güvenceye alındı; USB veya taşınabilir kullanımda harici kütüphane bağımlılığı sıfırlandı.
- `[KARAR-006]` **Sürüm Numarası Arındırma:** İlk sürümlerde kullanıcı arayüzü ve vitrin dökümanlarından açık versiyon numaraları (`v0.3.0` vb.) arındırıldı. Sürüm takibi arka planda DTO seviyesinde tutulup arayüzde temiz, odaklı marka kimliği sunuldu.
- `[KARAR-007]` **In-App Self-Update (Uygulama İçi Tek Tıkla Güncelleme):** Kullanıcıların GitHub sitesine gitmesine gerek kalmadan doğrudan üst çubuktaki `GÜNCELLEME` butonu veya ayarlar üzerinden `UpdateModal.tsx` ile güncelleme denetlemesi, canlı indirme ilerleme çubuğuyla paketi kurup otomatik yeniden başlatması (`downloadAndInstallUpdate`) sağlandı.
- `[KARAR-008]` **Geliştirici Kimliği & Telif Standardizasyonu:** Projenin resmi telif ve geliştirici kimliği **Monolith Works / MonarchDevLab** olarak tanımlandı (`LICENSE`, `Cargo.toml`, `package.json`, `tauri.conf.json`, `README`).
- `[KARAR-009]` **Kurumsal Gizlilik & Dokümantasyon Standardizasyonu:** P6 standardı gereği tüm mimari kayıtlar `docs/` dizininde merkezileştirildi, geçici geliştirici dizinleri arındırıldı, yerel loglar silindi ve Git geçmişindeki tüm commit diff'leri taranarak yerel yol ve kullanıcı adı ibareleri `git-filter-repo` ile tüm tarihten temizlendi.
- `[KARAR-010]` **Kurumsal Mimari Commit Rekonstrüksiyonu:** Git geçmişi, Monolith Works & MonarchDevLab ekibinin sıfırdan kurumsal mimari aşamalarla (Scaffolding, Kernel Core, Strategy Pipeline, WinDivert FFI, CLI/Blockcheck, Tauri Shell, Design System, UI, Release) inşa ettiği 9 mantıksal commit zincirine dönüştürüldü. Tarihler ve yazarlar resmi kurumsal kimliğe göre sabitlendi.
- `[KARAR-011]` **Monolith Works Mimari Standartları & Mülkiyet Hiyerarşisi (v1.4):** Proje kök dizini hijyeni (`.editorconfig`, `CONTRIBUTING.md`, `.github/CODEOWNERS`), mimari karar kayıtları (`docs/architecture/adr/`), API sözleşmeleri (`docs/architecture/specs/`), veri akış şemaları (`docs/architecture/blueprints/`) ve işletim kılavuzları (`docs/runbooks/`) tam kurumsal hiyerarşiyle yapılandırıldı. Kod mülkiyeti mutlak olarak Monolith Works'e bağlandı, MonarchDevLab dağıtım kanalı olarak tanımlandı.
- `[KARAR-012]` **Dark Monolith ($10K) Tasarım Mimarisi:** Göz yoran kaba 0px keskin köşeli ve 3px kalın beyaz çerçeveli neo-brutalist stil yerine, Linear, Raycast ve Cloudflare Zero Trust kalitesinde modern Obsidyen `#090B10`, kart yüzeyleri `#121724`, zarif 1px sınırlar, Zümrüt Yeşili `#10B981` vurgusu, dokunsal Master Engine Hub ve esnek kırpılmayan grid sistemine geçildi. Kaba kutular ve diyaloglar `rounded-2xl` ve `rounded-xl` bileşen sınıflarına bağlandı.

## Geçmiş Oturumlar
- 2026-09-02: Cyber-Brutalism UI migrasyonu, Dashboard basit/pro modları, `anticore-core` 46/46 test doğrulaması, v0.3.0 tag ve release pipeline kurulumu.
- 2026-09-03: Tek tıkla in-app self-update (`UpdateModal.tsx`), sürüm numarası arındırma, güvenlik/sızıntı koruması, Monolith Works / MonarchDevLab kimlik standardizasyonu, kurumsal mimari rekonstrüksiyonu.

## Dersler (GOTCHAS)
- *Semptom:* Windows NTFS üzerinde hem `Anticore.exe` hem `anticore.exe` kopyalandığında biri diğerinin üzerine yazılıyor. -> *Sebep:* Windows dosya sistemi büyük/küçük harf duyarsızdır (case-insensitive). -> *Çözüm:* Motor ikilisini `anticore-cli.exe` ve `bin/anticore.exe` olarak adlandır, `commands.rs::find_motor_exe` içerisine fallback ekle.
- *Semptom:* `App.tsx` ve diğer bileşenlerdeki 10-11px metinler ve düşük opaklıklı yazılar erişilebilirlik taramasında okunamaz bulunuyor. -> *Çözüm:* Proje genelinde minimum font boyutunu 12px (`text-xs`) olarak sabitle; `text-[10px]` ve `text-[11px]` kullanımını tamamen kaldır.
- *Semptom:* `tsconfig.json` dosyasında `noUnusedLocals: true` açık olduğu için kullanılmayan importlar derlemeyi kesiyor. -> *Çözüm:* Bileşen düzenlemelerinden sonra daima `npm run build` ile doğrula; kullanılmayan hook veya ikonları hemen temizle.
- *Semptom:* GitHub deposu `PRIVATE` iken unauthenticated `releases/latest` isteği `404 Not Found` dönüyor. -> *Sebep:* GitHub API yetkisiz isteklerde gizli repo release'lerini gizler. -> *Çözüm:* `commands.rs::check_update` içine `token_override` ve `GITHUB_TOKEN` environment desteği eklendi; repo public olduğunda ek ayara gerek kalmaksızın çalışır.
