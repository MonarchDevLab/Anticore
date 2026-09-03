# WORKLOG

## Aktif Oturum (Son Oturumun Detayları)
- **Tarih:** 2026-09-03
- **Gerçekleşenler:**
  1. Taşınabilir (Portable) Sürüm Üretildi & Dağıtıldı: `Anticore_0.3.0_x64-portable.zip` (6.1 MB), GitHub Releases v0.3.0'a yüklendi.
  2. Windows NTFS Case-Insensitivity Çakışması Çözüldü: `Anticore.exe` (GUI) ile çakışmaması için motor `anticore-cli.exe` ve `bin/anticore.exe` olarak konumlandırıldı; `commands.rs::find_motor_exe` fallback'i eklendi.
  3. Release İş Akışı Otomasyonu: `.github/workflows/release.yml` içine her yeni tag release'inde otomatik portable zip üreten PowerShell adımı eklendi.
  4. 15 UI dosyasındaki 90'dan fazla raw hex renk (`#ff3366`, `#00ff9d`, `#ffcc00`, `#00ffff`) DTCG token'larına bağlandı.
  5. WCAG 2.2 AA erişilebilirlik ve tipografi uyumu: 10px ve 11px metinler temizlendi, min 12px'e çekildi, sidebar altbilgisi kontrastı 3.66:1'den 7.5:1'e yükseltildi.
  6. Humanizer & Ouroboros Vitrin Yenilemesi: `README.md`, `README.en.md` ve GitHub Releases açıklaması insan mühendis üslubuyla baştan yazıldı (0 em-dash, 0 emoji, samimi ve dürüst teknik dil).
  7. GitHub repo gizliliği (`isPrivate: true`) doğrulandı ve korundu.
  8. `npm run build` (0 hata, 2.58s) ve `cargo test --workspace` (46/46 yeşil) ile tam doğrulama sağlandı.

## Mimari Kararlar
- `[KARAR-001]` **Zero-Loss Passthrough (Sıfır Kayıplı Geçiş):** İnternetteki her paketi işlemek yerine, yalnızca `Sites.tsx` içerisinde (veya aktif paketteki) belirlenmiş alan adlarına giden trafik DPI Bypass motorundan geçirilecek. Böylece kullanıcının normal web gezintisi, bankacılık işlemleri, oyun ping değerleri asla etkilenmeyecek.
- `[KARAR-002]` **Cyber-Brutalism:** Modern ancak şeffaf ve yumuşak "Apple/Vercel" tarzı UI'lar yerine, sert, doğrudan, hacker-vari bir "Brutalist" tasarım dili seçildi. Sebep: Uygulamanın amacı ve ruhuyla (sansür atlatma) daha çok örtüşmesi. Yuvarlak köşe kullanılmayacak (`rounded-none`), pastel renklerden kaçınılacak.
- `[KARAR-003]` **No Soft Modals:** Diyalog pencereleri ve açılır kutular bile sert çerçeve (`border-[3px]`), katı arka plan (`bg-black`), ve katı brutalist offset gölgeler (`shadow-[8px_8px_0px_#fff]`) ile hizalandı.
- `[KARAR-004]` **Portable Bundle Isolation:** WinDivert.dll/sys ve WebView2Loader.dll doğrudan uygulama köküne ve bin/ dizinine yerleştirilerek bağımlılık arama yolu güvenceye alındı; USB veya taşınabilir kullanımda harici kütüphane bağımlılığı sıfırlandı.
- `[KARAR-006]` **Sürüm Numarası Arındırma:** İlk sürümlerde kullanıcı arayüzü ve vitrin dökümanlarından açık versiyon numaraları (`v0.3.0` vb.) arındırıldı. Sürüm takibi arka planda DTO seviyesinde tutulup arayüzde temiz, odaklı marka kimliği sunuldu.
- `[KARAR-007]` **In-App Self-Update (Uygulama İçi Tek Tıkla Güncelleme):** Kullanıcıların GitHub sitesine gitmesine gerek kalmadan doğrudan üst çubuktaki `GÜNCELLEME` butonu veya ayarlar üzerinden `UpdateModal.tsx` ile güncelleme denetlemesi, canlı indirme ilerleme çubuğuyla paketi kurup otomatik yeniden başlatması (`downloadAndInstallUpdate`) sağlandı.
- `[KARAR-008]` **Geliştirici Kimliği & Telif Standardizasyonu:** Projenin resmi telif ve geliştirici kimliği **Monolith Works / MonarchDevLab** olarak tanımlandı (`LICENSE`, `Cargo.toml`, `package.json`, `tauri.conf.json`, `README`).
- `[KARAR-009]` **Kurumsal Gizlilik & Dokümantasyon Standardizasyonu:** P6 standardı gereği tüm mimari kayıtlar `docs/` dizininde merkezileştirildi, geçici geliştirici dizinleri arındırıldı, yerel loglar silindi ve Git geçmişindeki tüm commit diff'leri taranarak 'Teknokol' ibaresi `git-filter-repo` ile tüm tarihten temizlendi.
- `[KARAR-010]` **Kurumsal Mimari Commit Rekonstrüksiyonu:** Git geçmişi, Monolith Works & MonarchDevLab ekibinin sıfırdan kurumsal mimari aşamalarla (Scaffolding, Kernel Core, Strategy Pipeline, WinDivert FFI, CLI/Blockcheck, Tauri Shell, Design System, UI, Release) inşa ettiği 9 mantıksal commit zincirine dönüştürüldü. Tarihler ve yazarlar resmi kurumsal kimliğe göre sabitlendi.

## Geçmiş Oturumlar
- 2026-09-02: Cyber-Brutalism UI migrasyonu, Dashboard basit/pro modları, `anticore-core` 46/46 test doğrulaması, v0.3.0 tag ve release pipeline kurulumu.
- 2026-09-03: Tek tıkla in-app self-update (`UpdateModal.tsx`), sürüm numarası arındırma, güvenlik/sızıntı koruması, Monolith Works / MonarchDevLab kimlik standardizasyonu, kurumsal mimari rekonstrüksiyonu.

## Dersler (GOTCHAS)
- *Semptom:* Windows NTFS üzerinde hem `Anticore.exe` hem `anticore.exe` kopyalandığında biri diğerinin üzerine yazılıyor. -> *Sebep:* Windows dosya sistemi büyük/küçük harf duyarsızdır (case-insensitive). -> *Çözüm:* Motor ikilisini `anticore-cli.exe` ve `bin/anticore.exe` olarak adlandır, `commands.rs::find_motor_exe` içerisine fallback ekle.
- *Semptom:* `App.tsx` ve diğer bileşenlerdeki 10-11px metinler ve düşük opaklıklı yazılar erişilebilirlik taramasında okunamaz bulunuyor. -> *Çözüm:* Proje genelinde minimum font boyutunu 12px (`text-xs`) olarak sabitle; `text-[10px]` ve `text-[11px]` kullanımını tamamen kaldır.
- *Semptom:* `tsconfig.json` dosyasında `noUnusedLocals: true` açık olduğu için kullanılmayan importlar derlemeyi kesiyor. -> *Çözüm:* Bileşen düzenlemelerinden sonra daima `npm run build` ile doğrula; kullanılmayan hook veya ikonları hemen temizle.
- *Semptom:* GitHub deposu `PRIVATE` iken unauthenticated `releases/latest` isteği `404 Not Found` dönüyor. -> *Sebep:* GitHub API yetkisiz isteklerde gizli repo release'lerini gizler. -> *Çözüm:* `commands.rs::check_update` içine `token_override` ve `GITHUB_TOKEN` environment desteği eklendi; repo public olduğunda ek ayara gerek kalmaksızın çalışır.
