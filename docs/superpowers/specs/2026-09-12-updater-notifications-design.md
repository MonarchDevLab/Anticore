# Mimari Spesifikasyon: Anticore Kesintisiz Güncelleme Bildirim Sistemi ve Arayüz Bildirim Bandı

**Tarih:** 2026-09-12  
**Durum:** Tasarım Onaylandı (Spec Ready)  
**Kapsam:** `desktop/src-tauri` (Rust Backend), `desktop/src` (React/TypeScript Frontend)

---

## 1. Problem Tanımı ve Kök Neden Analizi

Mevcut Anticore v0.3.2 mimarisinde kullanıcıların güncelleme bildirimlerini alamamasının üç temel kök nedeni tespit edilmiştir:

1. **PowerShell ve Windows AUMID Kısıtlaması:**  
   Windows işletim sisteminde bildirimler `silent_command("powershell")` ile `[Windows.UI.Notifications.ToastNotificationManager]` çağrısı yapılarak gönderilmektedir. Ancak PowerShell için hardcoded tanımlanan AppUserModelID (`{1AC14E77-...}`), Windows 10/11 Eylem Merkezi bildirim listesinde onaylı bir uygulama olarak yer almadığı ve arka planda sessiz çalıştırılan konsol alt süreçlerine bildirim izni verilmediği için Windows Bildirim Servisi tarafından sessizce engellenmektedir (silent drop).
2. **Arayüz İçi Görsel Bildirim Eksikliği:**  
   Yeni bir sürüm algılandığında yalnızca arka plan OS bildirimi ve tam ekran bir modal açılmaya çalışılmaktadır. Ancak uygulama tepside başladığında veya kullanıcı modalı kapattığında arayüzde kullanıcının güncellemeyi görebileceği kalıcı, dikkat çekici bir bildirim bandı (Banner) ya da başlık rozeti bulunmamaktadır.
3. **Canlı Sürüm Eşitliği ve Doğrulama Boşluğu:**  
   Depodaki sürüm `0.3.2` ve GitHub Releases üzerindeki son sürüm `v0.3.2` olduğundan, mevcut derlemede `has_update: false` çıkmakta; bildirim mekanizmasının çalıştığını anında teyit edecek yerel bir simülasyon/test aracı bulunmamaktadır.

---

## 2. Çözüm Mimarisi

### 2.1 Arka Uç: Tauri v2 Yerel Bildirim Motoru (`tauri-plugin-notification`)
- Kırılgan `powershell.exe` alt süreç çağırma kodu (`trigger_windows_toast` ve `send_system_notification`) tamamen iptal edilir.
- Tauri 2 resmi `tauri-plugin-notification = "2"` eklentisi projeye dahil edilir:
  - `desktop/src-tauri/Cargo.toml` -> `tauri-plugin-notification = "2"`
  - `desktop/package.json` -> `@tauri-apps/plugin-notification = "^2.0.0"`
  - `desktop/src-tauri/src/main.rs` -> `.plugin(tauri_plugin_notification::init())`
  - `desktop/src-tauri/capabilities/default.json` -> `"notification:default"` yetkisi.
- Bildirimler doğrudan işletim sisteminin yerel C/WinRT API'lerine bağlı olan `app.notification().builder().title(...).body(...).show()` ile iletilir.
- Windows'ta uygulamanın resmi `com.anticore.desktop` kimliğiyle doğrudan bildirim merkezine sesli ve interaktif olarak düşer; macOS üzerinde `UNUserNotificationCenter` devreye girer.

### 2.2 Ön Yüz: Sabit Bildirim Bandı (`UpdateBanner.tsx`) ve Başlık Rozeti
- **UpdateBanner Bileşeni:**
  - `Titlebar`'ın hemen altına, ana görünüm alanının tepesine yerleştirilir.
  - Tasarım: `bg-live/15 border-b border-live/30 text-live` (Monolith Works tasarım standartları ve sıfır emoji kuralı; Lucide `ArrowDownCircle` ve `X` SVG ikonları).
  - İçerik: `"Anticore vX.Y.Z hazır — Güvenlik ve performans güncellemelerini yükleyin."`
  - Butonlar: `[Yenilikleri Gör ve Güncelle]` (UpdateModal'ı açar) ve `[X]` (mevcut oturumda bandı gizler).
- **Titlebar Güncelleme Nabzı (Pulse Badge):**
  - Sürüm numarası (`v0.3.2`) yanında güncelleme varsa yeşil nabız animasyonlu bir rozet yer alır. Tıklandığında doğrudan güncelleme modalını açar.

### 2.3 Simülasyon & Doğrulama Katmanı
- **Ayarlar Ekranı (`SettingsView.tsx`):**
  - "Güncelleme Bildirimini Test Et" butonu eklenir.
  - Butona tıklandığında sahte bir sürüm (`v0.3.99 - Test Bildirimi`) parametresiyle hem yerel OS bildirimi patlatılır hem de arayüzde `UpdateBanner` anında görünür hale getirilir.
- **Sürüm v0.3.3:**
  - Tüm mimari `0.3.3` sürümüne hazırlanır; sürüm etiketleri, `tauri.conf.json`, `package.json` ve `commands.rs::APP_VERSION` v0.3.3'e yükseltilerek canlıda yayınlanacak paketler için hazır hale getirilir.

---

## 3. Bileşen ve Veri Akışı Şeması

```
[Uygulama Başlatıldı]
         │
         ▼ (1200ms sonra)
[api.checkUpdate()]
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
[GitHub Releases API]   ──(Hata/403)──>   [GitHub CDN latest.json]
    │                                              │
    └──────────────────────┬───────────────────────┘
                           ▼
                  [has_update == true?]
                  ├── Evet ────────────────────────────────────────┐
                  │                                                │
                  ▼                                                ▼
     [tauri-plugin-notification]                        [React State: updateInfo]
     (Yerel OS Toast Bildirimi)                                    │
                                                                   ▼
                                                          [UpdateBanner Görünür]
                                                          [Titlebar Rozeti Aktif]
                                                                   │
                                                   (Kullanıcı Bant'a Tıkladığında)
                                                                   ▼
                                                          [UpdateModal Açılır]
                                                                   │
                                                                   ▼
                                                   [Doğrudan İndirme ve Kurulum]
```

---

## 4. Etkilenecek Dosyalar

1. **`desktop/src-tauri/Cargo.toml`**: `tauri-plugin-notification = "2"` bağımlılığı.
2. **`desktop/src-tauri/src/main.rs`**: Bildirim plugin kurulumu ve IPC komutları.
3. **`desktop/src-tauri/src/commands.rs`**: PowerShell komutlarının temizlenmesi, yerel Tauri bildirim motorunun entegrasyonu, `trigger_update_notification` ve `send_system_notification` fonksiyonlarının yenilenmesi, `test_update_notification` IPC komutunun eklenmesi.
4. **`desktop/src-tauri/capabilities/default.json`**: `"notification:default"` izninin eklenmesi.
5. **`desktop/package.json`**: `@tauri-apps/plugin-notification` bağımlılığı.
6. **`desktop/src/components/UpdateBanner.tsx`**: Yeni arayüz bildirim bandı bileşeni.
7. **`desktop/src/components/Titlebar.tsx`**: Güncelleme mevcut rozeti ve tıklama kancası.
8. **`desktop/src/views/SettingsView.tsx`**: "Bildirimleri Test Et" simülasyon butonu.
9. **`desktop/src/lib/tauri.ts`**: `testUpdateNotification` API fonksiyonu.
10. **`desktop/src/App.tsx`**: `UpdateBanner` entegrasyonu ve güncelleme durumu yönetimi.

---

## 5. Doğrulama Planı

- **Birim & Tip Testleri:** `npm test` (Vitest - tüm testlerin yeşil olması).
- **Arka Uç Kontrolü:** `cargo check` (0 hata, 0 uyarı) ve motor testleri (`cargo test --workspace`).
- **Simülasyon Doğrulaması:** Arayüzden "Bildirimleri Test Et" butonuna basılarak Windows Bildirim Merkezi'nde sesli bildirim ve ekran üstünde yeşil bildirim bandının anında belirdiğinin gözlemlenmesi.
- **Canlı Paket Derlemesi:** `npm run build` ve `npm run tauri -- build` ile hatasız kurulum ve portable EXE üretimi.
