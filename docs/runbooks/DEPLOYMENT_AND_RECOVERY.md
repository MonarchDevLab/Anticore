# İşletim ve Dağıtım Kılavuzu (Runbook)

## 1. Sürüm Dağıtım Döngüsü (Production Release)

Tüm sürümler GitHub Actions (`.github/workflows/release.yml`) aracılığıyla otomatik olarak derlenir ve paketlenir.

### 1.1 Ön Koşullar
- `TAURI_SIGNING_PRIVATE_KEY` ve şifresi GitHub Secrets üzerinde tanımlı olmalıdır.
- Tüm birim testler (`cargo test --workspace`) ve frontend derlemesi (`npm run build`) yerel ortamda doğrulanmalıdır.

### 1.2 Yayınlama Adımları
1. Sürüm numarasını manifesto dosyalarında güncelle (`desktop/package.json`, `desktop/src-tauri/tauri.conf.json`, `desktop/src-tauri/Cargo.toml`, `engine/Cargo.toml`).
2. Değişiklikleri `main` dalına commit et ve pushla.
3. Yeni sürüm etiketi oluştur:
   ```bash
   git tag v0.3.0
   git push origin v0.3.0
   ```
4. GitHub Actions hattı NSIS (.exe), MSI (.msi) ve taşınabilir ZIP (.zip) paketlerini oluşturur, Minisign ile imzalar ve GitHub Releases üzerinde yayınlar.

## 2. Felaket Kurtarma ve Sorun Giderme

### 2.1 WinDivert Sürücü Çakışması
- **Semptom:** Uygulama açılışında `WinDivertOpen failed: 5` (Access Denied) veya `1058` hatası.
- **Çözüm:**
  1. Uygulamanın yönetici yetkisiyle (`Run as Administrator`) başlatıldığını doğrulayın.
  2. Eski veya takılı kalmış bir WinDivert servisini temizleyin:
     ```powershell
     sc.exe stop WinDivert
     sc.exe delete WinDivert
     ```
  3. Güvenlik yazılımlarının `WinDivert64.sys` sürücüsünü karantinaya almadığından emin olun.

### 2.2 Sürüm Güncelleme Döngüsü
- **Semptom:** Otomatik güncelleme indirildikten sonra uygulama yeniden başlamıyor.
- **Çözüm:** Kullanıcı veri dizinindeki geçici güncelleme kalıntılarını temizleyin:
  ```powershell
  Remove-Item -Path "$env:LOCALAPPDATA\com.anticore.desktop\updates" -Recurse -Force
  ```
