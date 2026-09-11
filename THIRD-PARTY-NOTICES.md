# Üçüncü Taraf Bildirimleri (Third-Party Notices)

Anticore uygulamasının kendi kaynak kodu [MIT Lisansı](LICENSE) altındadır.
Uygulama, çalışması için aşağıdaki üçüncü taraf ikili bileşenleri
**değiştirilmeden** dağıtır. Bu dosya, o bileşenlerin lisans koşullarını
ve kaynaklarını belgeler.

---

## WinDivert (`vendor/windows/WinDivert.dll`, `vendor/windows/WinDivert64.sys`)

- **Ne için kullanılır:** Windows çekirdek katmanında paket yakalama/yeniden
  enjeksiyon sürücüsü — Anticore'un DPI bypass motorunun temel bağımlılığı.
- **Kaynak:** <https://github.com/basil00/Divert> (proje sayfası:
  <https://reqrypt.org/windivert.html>)
- **Lisans:** WinDivert, kullanıcının **seçimine bağlı** olarak iki
  lisanstan biri altında çift lisanslıdır:
  - [GNU Lesser General Public License (LGPL) v3](https://www.gnu.org/licenses/lgpl-3.0.txt), veya
  - [GNU General Public License (GPL) v2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
- **Değişiklik:** Anticore, resmi WinDivert dağıtımından derlenmiş
  `WinDivert.dll`/`WinDivert64.sys` ikili dosyalarını (`vendor/windows/`) **hiçbir kaynak
  değişikliği yapmadan** kullanır; bu dosyalar çalışma zamanında dinamik
  olarak yüklenir (`LoadLibrary`), Anticore'un kendi koduna statik olarak
  bağlanmaz. Kaynak kodu yukarıdaki depoda herkese açıktır.
- Tam lisans metni için yukarıdaki bağlantılara bakınız.

## WebView2 Runtime (`vendor/windows/WebView2Loader.dll`)

- **Ne için kullanılır:** Tauri masaüstü kabuğunun arayüzü render ettiği
  Microsoft Edge WebView2 çalışma zamanına bağlanan yükleyici kütüphanesi.
- **Sahibi:** Microsoft Corporation — kapalı kaynak, Microsoft'un kendi
  yeniden dağıtım koşullarına tabidir (bu proje tarafından değil).
- **Lisans/Koşullar:** <https://developer.microsoft.com/en-us/microsoft-edge/webview2/>
  sayfasındaki resmi WebView2 SDK/Runtime dağıtım koşulları geçerlidir.
- **Değişiklik:** Değiştirilmemiş, resmi olarak dağıtılan yükleyici ikilisi.

---

## Rust Bağımlılıkları

`engine/` ve `desktop/src-tauri/` altındaki Rust crate bağımlılıklarının
(Tauri, tokio, serde, ureq, semver, vb.) tam listesi ve lisansları
`Cargo.lock` dosyalarında sabitlenmiştir; hepsi MIT/Apache-2.0 ikili
lisanslı yaygın açık kaynak crate'lerdir. Belirli bir crate'in lisansını
doğrulamak için:

```bash
cargo license --manifest-path engine/Cargo.toml
cargo license --manifest-path desktop/src-tauri/Cargo.toml
```

## JavaScript Bağımlılıkları

`desktop/package.json` altındaki npm bağımlılıklarının (React,
Tailwind CSS, Lucide, Tauri JS API'leri vb.) lisansları için
`desktop/package-lock.json` ve ilgili paketlerin kendi `LICENSE`
dosyalarına bakınız.
