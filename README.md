<div align="center">

```diff
+  █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗ ██████╗ ███████╗
+ ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
+ ███████║██╔██╗ ██║   ██║   ██║██║     ██║   ██║██████╔╝█████╗  
+ ██╔══██║██║╚██╗██║   ██║   ██║██║     ██║   ██║██╔══██╗██╔════╝  
+ ██║  ██║██║ ╚████║   ██║   ██║╚██████╗╚██████╔╝██║  ██║███████╗
+ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

# <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/MonarchDevLab/Anticore/main/desktop/src-tauri/icons/32x32.png"><img alt="Anticore" src="desktop/src-tauri/icons/32x32.png" width="28" height="28" align="center" /></picture> ANTICORE

### Windows İçin Sıfır Hız Kayıplı Açık Kaynak DPI Aşma ve Ağ Özgürlüğü Motoru

[![Sürüm](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=00FF9D&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-00E5FF?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Çekirdek](https://img.shields.io/badge/Çekirdek-Rust%20%2B%20WinDivert-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Arayüz](https://img.shields.io/badge/Arayüz-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Lisans](https://img.shields.io/badge/Lisans-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)
[![Doğrulama](https://img.shields.io/badge/İmza-Minisign%20Doğrulamalı-00FF9D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)

**Türkiye internet servis sağlayıcılarının sansür ve engelleme altyapılarına karşı geliştirilmiş; trafiği üçüncü taraf uzak sunuculara yönlendirmeden, internet hızınızı ve ping değerinizi %100 koruyarak çalışan yeni nesil paket manipülasyon yazılımı.**

[İndirme Seçenekleri](#indirme-seçenekleri-v030) • [Anticore Nedir?](#anticore-nedir-ve-ne-değildir) • [Öne Çıkan Özellikler](#öne-çıkan-yetenekler) • [Nasıl Çalışır?](#nasıl-çalışır) • [Karşılaştırma](#goodbyedpi-splitwire-ve-vpn-karşılaştırması) • [Güvenlik & Doğrulama](#güvenlik-ve-bütünlük-doğrulama) • [English](README.en.md)

</div>

---

## İndirme Seçenekleri (v0.3.0)

Tüm ikili dosyalar derleme aşamasında yerel geliştirici yollarından arındırılmış olup dijital olarak imzalanmıştır.

| Paket Türü | Dosya Adı | Boyut | İndirme | Kullanım Amacı |
|---|---|:---:|:---:|---|
| **Taşınabilir (Portable)** | `Anticore_0.3.0_x64-portable.zip` | ~6.2 MB | [İndir (.zip)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64-portable.zip) | **Kurulumsuz.** Klasöre veya USB belleğe çıkartıp doğrudan `Anticore.exe` dosyasını yönetici olarak çalıştırın. Sistemde artık bırakmaz. |
| **Kurulumlu (Setup EXE)** | `Anticore_0.3.0_x64-setup.exe` | ~4.3 MB | [İndir (.exe)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64-setup.exe) | Masaüstü kısayolu, Başlat menüsü entegrasyonu ve dahili otomatik güncelleme desteği isteyen son kullanıcılar içindir. |
| **Kurumsal Dağıtım (MSI)** | `Anticore_0.3.0_x64_en-US.msi` | ~6.0 MB | [İndir (.msi)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64_en-US.msi) | Active Directory, Intune veya GPO üzerinden çoklu bilgisayara sessiz kurulum yapacak sistem yöneticileri içindir. |

> **Sistem Gereksinimi & Yönetici İzni:** Windows ağ kartından geçen ham paketleri çekirdek katmanında dinleyip düzenleyebilmek için `WinDivert` sürücüsü kullanılır. Bu nedenle uygulamanın **Yönetici Olarak Çalıştırılması** teknik bir zorunluluktur. Standart kullanıcı olarak başlatıldığında uygulama sizi uyarır ve tek tıkla kendini yönetici yetkisiyle yeniden başlatabilir.

---

## Anticore Nedir ve Ne Değildir?

Discord kapatıldığında, Roblox engellendiğinde veya bilgiye erişim sınırlandığında akla ilk gelen çözüm bir VPN açmaktır. Ancak VPN kullanmak günlük deneyimi ciddi şekilde bozar:

- İnternet trafiğiniz yurt dışındaki bir sunucuya tünellendiği için indirme ve yükleme hızınız **%50 ile %80 arasında düşer**.
- Oyunlarda veya sesli iletişimde ping süreniz **30 ms'den 120+ ms'ye** fırlar.
- Bankacılık veya e-Devlet siteleri yurt dışı IP gördüğü anda güvenlik doğrulaması ister ya da hesabınızı askıya alır.
- Tüm özel verileriniz üçüncü parti bir VPN sağlayıcısının sunucularından geçer.

### Anticore Bir VPN veya Proxy Değildir

Anticore trafiğinizi hiçbir uzak sunucuya yönlendirmez. Türkiye'deki servis sağlayıcılar (Türk Telekom, Superonline, Kablonet, Vodafone vb.) engellemeyi genellikle ilk bağlantı kurulurken giden paketin içindeki alan adı etiketine (**TLS ClientHello SNI**) bakarak gerçekleştirir.

Anticore yalnızca bu ilk el sıkışma anında devreye girer:
1. Paketi hedef sunucunun anlayabileceği ancak sağlayıcının DPI (Derin Paket İnceleme) kutusunun okuyamayacağı şekilde ufak parçalara böler veya düşük TTL değerli sahte bir paketle denetim kutusunu atlatır.
2. Karşı sunucu ile bilgisayarınız el sıkıştığı anda filtre aradan çekilir.
3. Bundan sonraki tüm indirme, yükleme ve canlı yayın trafiği doğrudan kendi internet sağlayıcınız üzerinden tam hat hızıyla akar. **1000 Mbps internetiniz varsa, 1000 Mbps almaya devam edersiniz.**

---

## Öne Çıkan Yetenekler

### 1. Çift Modlu Arayüz Mimarisi
- **Basit Mod (Son Kullanıcı):** Karmaşık ağ parametreleriyle uğraşmadan tek tıkla büyük güç reaktörüne basarak korumayı başlatın. Discord, Roblox, Ekşi Sözlük ve hedef sitelerin durumunu tek bakışta görün.
- **Pro Matrix Operasyon Konsolu (Uzmanlar):** WinDivert L3 çekirdek halka tamponu, mikrosaniye gecikme telemetrisi, canlı milisaniyelik Throughput (PPS) sparkline grafiği, aktif strateji zinciri ve terminal log konsolu.

### 2. Sistem Tepsisi (Tray) Hızlı Erişim Paneli
- Görev çubuğundaki simgeye tek tıklandığında ekranın sağ alt köşesinde kompakt (340x460px) yüzen kokpit açılır.
- Ana pencereyi açmaya gerek kalmadan tek tıkla motoru açıp kapatabilir, profil değiştirebilir veya DNS onarımı yapabilirsiniz.
- Çift tıklama ana pencereyi öne getirir.

### 3. Otomatik DNS Zehirlenmesi ve Discord Onarımı
- Türkiye'deki ISP'lerin `discord.com` sorgusunu mahkeme kararıyla BTK engelleme sunucusuna (`195.175.254.2`) yönlendirmesini otomatik olarak tespit eder.
- Tek tıkla güvenli Cloudflare DNS ve yerel Windows DoH (DNS-over-HTTPS) kaydı oluşturarak ses kanalı kopmalarını ("RTC Connecting") ve sonsuz güncelleme döngüsünü çözer.

### 4. 8 Tam Morfolojik Donanım Teması
Standart renk değiştirmenin ötesinde köşe geometrisi, kart dokusu, scanline atmosferi ve tipografisiyle 8 bağımsız dünya:
- **Obsidian Emerald:** Cyber-hardware koyu şasi, neon zümrüt telemetri (Varsayılan).
- **Amber CRT:** Kehribar fosfor ışıması, tam ekran scanline katmanı ve monospace terminal tipografisi.
- **Cobalt Matrix:** Taktik denizaltı C2 muharebe konsolu, derin okyanus mavisi.
- **Cyberpunk Volt:** Endüstriyel HUD grid matrisi, 45° agresif kesimler ve yüksek gerilim sarısı.
- **Quiet Luxury:** Editoryal serif tipografi, kadife siyahı ve şampanya altını.
- **Crimson Hazard:** Taktik askeri kırmızı lazer HUD ve acil durum komuta paneli.
- **Amethyst Nebula:** Yumuşak buzlu cam derinliği ve spektral mor nebula.
- **Titanium Laboratory:** Klinik açık mod, CNC işlenmiş açık gri cerrahi lab.

---

## Nasıl Çalışır?

```text
[ Tarayıcı ya da Oyun ]
           │
           │ 1. TLS ClientHello (Hedef: discord.com)
           ▼
┌─────────────────────────────────────────────────────────────┐
│  ANTICORE MOTORU (Rust + WinDivert Sürücüsü)                │
│                                                             │
│  - Yalnızca hedef listedeki alan adlarının paketini yakalar.│
│  - Düşük TTL değerli sahte bir paket üretir.                │
│  - Gerçek ClientHello paketini SNI etiketinin ortasından    │
│    iki ayrı TCP parçasına böler.                            │
└─────────────────────────────────────────────────────────────┘
           │
     ┌─────┴──────────────────────────────┐
     │ 2. Sahte Paket (TTL=3)             │ 3. Bölünmüş Gerçek Paketler
     ▼                                    ▼
[ ISS DPI Sansür Kutusu ]         [ Hedef Sunucu (Discord) ]
(Sahte paketle meşgul olur)       (TCP parçalarını birleştirir)
                                          │
                                          │ 4. Güvenli Bağlantı Kuruldu!
                                          ▼
                      [ Kalan TÜM indirme verisi %100 hızla akar ]
```

1. **Sahte Paket Enjeksiyonu (Fake Packet with TTL):** ISS omurgasındaki filtre kutusuna kadar gidebilecek ancak ana internet düğümlerini geçemeden ömrü tükenecek sahte bir paket yollanır. Filtre cihazı bu sahte veriyi işlerken arkadan gelen gerçek paketi kaçırır.
2. **Paket Bölme (SNI Splitting):** Alan adını taşıyan ilk paket küçük parçalara bölünür. Basit sansür cihazları bu parçaları belleğinde birleştirip denetleyemediği için engelleme uygulayamaz.
3. **Pasif Savunma (RST Drop):** Sağlayıcı tarafından bağlantıyı zorla koparmak için gönderilen sahte TCP RST paketleri işletim sistemine ulaşmadan düşürülür.
4. **QUIC / HTTP3 Düşürme:** UDP tabanlı QUIC bağlantıları TLS'e düşürülür; böylece tarayıcılarda paket atlatma kuralları kesintisiz devrede kalır.

---

## GoodbyeDPI, SplitWire ve VPN Karşılaştırması

| Kriter | Standart VPN | GoodbyeDPI | SplitWire | ANTICORE |
|---|:---:|:---:|:---:|:---:|
| **Hız Kaybı** | %50 ila %80 Düşüş | Sıfır Kayıp | Sıfır Kayıp | **Sıfır Kayıp (Tam Hat Hızı)** |
| **Ping Artışı** | +50 ms ila 200 ms | 0 ms | 0 ms | **0 ms (Doğrudan Bağlantı)** |
| **Kullanıcı Arayüzü** | Standart SaaS | Yok (.cmd / Siyah Ekran) | Temel GUI | **Çift Modlu Cyber-Hardware Panel** |
| **Sistem Tepsisi (Tray)** | Var | Yok | Kısmi | **Flyout Hızlı Kokpit & Arka Plan Modu** |
| **Windows Hizmet (Service) Modu** | Kısmi | Manuel `sc` komutu | Yok | **Entegre Windows Servis Yöneticisi** |
| **Otomatik DNS & Discord Tamiri** | Yok | Yok | Yok | **Tek Tıkla Zehirlenme ve RTC Tamiri** |
| **Bellek Tüketimi** | 150 - 300 MB | ~10 MB | ~80 MB | **~25 MB (Rust + WebView2)** |
| **Otomatik Güncelleme** | Var | Manuel | Manuel | **Tauri İmzalı Otomatik Güncelleyici** |

---

## Güvenlik ve Bütünlük Doğrulama

Resmi GitHub Releases sayfasından indirdiğiniz kurulum ve taşınabilir paketleri aşağıdaki açık anahtar ile Minisign kullanarak doğrulayabilirsiniz:

```text
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDE1QTRFREEwMDFGNDFFNTMKUldSVEh2UUJvTzJrRmE3UGFDdG81YWtnYUdYSkhFdWQxVGJ0V2VVdHFKNDJvaGZRWS90TWx3ejMK
```

Doğrulama komutu:
```powershell
minisign -Vm Anticore_0.3.0_x64-setup.exe -p anticore.key.pub
```

Güvenlik politikamız ve güvenlik açığı bildirim süreçlerimiz için [SECURITY.md](SECURITY.md) belgesine bakabilirsiniz.

---

## Kaynak Koddan Derleme

Kendi ikili dosyalarınızı kaynak koddan üretmek isterseniz:

### Gereksinimler
- Rust 1.80+ (`rustup`)
- Node.js 20+ (`npm`)
- Visual Studio 2022 C++ Derleme Araçları (MSVC x64)

```powershell
# 1. Depoyu klonlayın
git clone https://github.com/MonarchDevLab/Anticore.git
cd Anticore/antikor

# 2. Rust testlerini çalıştırın (48 test paketi)
cd engine
cargo test --workspace

# 3. Bağımsız motoru derleyin
cargo build --release --workspace

# 4. Masaüstü arayüz bağımlılıklarını kurun ve derleyin
cd ../desktop
npm install
npm test
npm run tauri build
```

---

## Lisans ve Telif

Bu yazılım [MIT Lisansı](LICENSE) kapsamında dağıtılmaktadır.

- **WinDivert:** [LGPLv3](https://reqrypt.org/windivert.html) lisansına sahip bağımsız açık kaynak ağ filtreleme sürücüsüdür; değiştirilmeden dinamik olarak yüklenir.
- **WebView2:** Microsoft Corporation mülkiyetindedir.
- **Yasal Sorumluluk:** Anticore; ağ analizi, kişisel gizlilik ve sansürsüz bilgiye erişim amacıyla geliştirilmiştir. Kullanıcıların yerel yasalara uygun hareket etmesi kendi sorumluluğundadır.

<div align="center">
  <sub>Kod sahibi ve tüm haklar <b>Monolith Works</b>'e aittir. Dağıtım resmi kanalı <b>MonarchDevLab</b>'dir.</sub>
</div>
