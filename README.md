<div align="center">

```
   █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ███████║██╔██╗ ██║   ██║   ██║██║     ██║   ██║██████╔╝█████╗  
  ██╔══██║██║╚██╗██║   ██║   ██║██║     ██║   ██║██╔══██╗██╔════╝  
  ██║  ██║██║ ╚████║   ██║   ██║╚██████╗╚██████╔╝██║  ██║███████╗
  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

### Windows için Sıfır Hız Kayıplı DPI Aşma Aracı
**Türkiye internet servis sağlayıcılarının engelleme kutularına karşı geliştirilmiş, trafiği tünellemeden çalışan açık kaynaklı paket manipülasyon motoru.**

[![Sürüm](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=flat-square&color=00FF9D&labelColor=000000)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-00FFFF?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Çekirdek](https://img.shields.io/badge/Çekirdek-Rust%20%2B%20WinDivert-FF3366?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore)
[![Arayüz](https://img.shields.io/badge/Arayüz-Tauri%202.0%20%2B%20React%2019-FFCC00?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore)
[![Lisans](https://img.shields.io/badge/Lisans-MIT-FFFFFF?style=flat-square&labelColor=000000)](LICENSE)
[![Doğrulama](https://img.shields.io/badge/İmza-Minisign%20Doğrulamalı-00FF9D?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore/releases/latest)

[İndirme Seçenekleri](#indirme-secenekleri-v030) | [Anticore Nedir ve Ne Değildir?](#anticore-nedir-ve-ne-degildir) | [GoodbyeDPI ve SplitWire ile Karşılaştırma](#goodbyedpi-ve-splitwire-ile-karsilastirma) | [Nasıl Çalışır?](#nasil-calisir) | [Sık Sorulan Sorular](#sik-sorulan-sorular-ve-bilinen-durumlar) | [English Version](README.en.md)

</div>

---

## İndirme Seçenekleri

İhtiyacınıza göre iki farklı sürüm hazırlanmıştır. Her iki sürüm de aynı Rust çekirdeğini ve aynı ağ motorunu kullanır. Tüm dosyalar derleme sunucusunda Minisign ile imzalanır.

| Paket Türü | Dosya Adı | Boyut | İndirme | Ne Zaman Tercih Edilmeli? |
|---|---|---|:---:|---|
| **Taşınabilir (Portable)** | `Anticore_x64-portable.zip` | 6.1 MB | [İndir (.zip)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64-portable.zip) | Kurulum istemiyorsanız, USB bellekten çalıştıracaksanız veya sisteme dosya bırakmak istemiyorsanız bunu indirin. Zipten çıkarıp doğrudan `Anticore.exe` dosyasını yönetici olarak başlatmanız yeterlidir. |
| **Kurulumlu (Setup EXE)** | `Anticore_x64-setup.exe` | 14.8 MB | [İndir (.exe)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64-setup.exe) | Masaüstü kısayolu, Başlat menüsü simgesi ve uygulama içi tek tıkla otomatik güncelleme bildirimleri istiyorsanız kurulumlu sürümü tercih edin. |
| **Kurumsal (MSI)** | `Anticore_x64_en-US.msi` | 16.5 MB | [İndir (.msi)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64_en-US.msi) | Active Directory veya grup ilkeleri (GPO) üzerinden birden fazla bilgisayara sessiz kurulum yapacak sistem yöneticileri içindir. |

> **Önemli Not:** Windows ağ kartından geçen paketleri çekirdek seviyesinde yakalayabilmek için `WinDivert` sürücüsü kullanılır. Bu nedenle uygulamanın **Yönetici Olarak Çalıştırılması** zorunludur. Standart kullanıcı olarak açarsanız uygulama sizi uyarır ve tek tıkla kendini yönetici yetkisiyle yeniden başlatır.

---

## Anticore Nedir ve Ne Değildir?

Discord kapatıldığında, Roblox engellendiğinde ya da bazı platformlara erişim kısıtlandığında akla ilk gelen çözüm bir VPN açmaktır. Ancak VPN kullanmanın günlük kullanımda ciddi bedelleri vardır:

- Tüm internet trafiğiniz yurt dışındaki bir sunucuya tünellendiği için indirme hızınız yüzde 50 ile 80 arasında düşer.
- Rekabetçi oyunlarda veya sesli görüşmelerde ping süreniz 30 milisaniyeden 120 milisaniyeye fırlar.
- Banka veya e-Devlet siteleri yurt dışı IP adresi gördüğü an güvenlik doğrulaması ister ya da hesabınızı kilitler.
- Tüm özel verileriniz üçüncü parti bir VPN şirketinin sunucularından geçer.

**Anticore bir VPN veya Proxy değildir.**

Trafiğinizi hiçbir uzak sunucuya yönlendirmez. Türkiye'deki servis sağlayıcılar (Türk Telekom, Superonline, Kablonet, Vodafone vb.) engellemeyi genellikle ilk bağlantı kurulurken giden paketin içindeki alan adı etiketine (TLS ClientHello SNI) bakarak yapar. 

Anticore sadece bu ilk el sıkışma anında devreye girer:
1. Paketi hedef sunucunun anlayabileceği ancak sağlayıcının DPI kutusunun okuyamayacağı şekilde ufak parçalara böler veya düşük TTL değerli sahte bir paketle denetim kutusunu atlatır.
2. Karşı sunucu ile bilgisayarınız el sıkıştığı anda filtre aradan çekilir.
3. Bundan sonraki tüm indirme, yükleme ve canlı yayın trafiği doğrudan kendi internet sağlayıcınız üzerinden tam hızla akar. İnternet hattınız 1000 Mbps ise, 1000 Mbps hız almaya devam edersiniz.

---

## GoodbyeDPI ve SplitWire ile Karşılaştırma

Türkiye'de bu alanda daha önce geliştirilmiş değerli araçlar mevcuttur. Anticore, bu araçların tecrübelerinden yararlanarak ve eksik kalan taraflarını tamamlayarak tasarlandı:

| Karşılaştırma Kriteri | Geleneksel VPN | GoodbyeDPI | SplitWire | Anticore |
|---|:---:|:---:|:---:|:---:|
| **Hız Kaybı** | Yüzde 50 - 80 Düşüş | Sıfır Kayıp | Sıfır Kayıp | **Sıfır Kayıp (Tam Hat Hızı)** |
| **Ping Artışı** | +50ms ila 200ms | 0 ms | 0 ms | **0 ms (Doğrudan Bağlantı)** |
| **Kullanıcı Arayüzü** | Tipik SaaS Menüsü | Yok (Komut Satırı / .cmd) | Temel Arayüz | **Çift Modlu Cyber-Brutalist Panel** |
| **Kullanım Zorluğu** | Kolay | Karmaşık parametreler | Basit | **Tek Tık Başlat veya İleri Düzey Konsol** |
| **Windows Servis Modu** | Kısmi | Manuel `sc` komutları | Yok | **Yerleşik Windows Hizmet Yöneticisi** |
| **Otomatik Keşif (Blockcheck)** | Yok | Var (Python/CLI gerektirir) | Yok | **Tek Tıkla Görsel Teşhis Akışı** |
| **Discord Özel Onarımı** | Yok | Yok | Yok | **Ses Kopması ve Güncelleme Döngüsü Çözümü** |
| **Sistem Tepsisi (Tray) Desteği** | Var | Yok | Kısmi | **Pencere Kapanınca Arka Planda Sessiz Çalışma** |
| **Otomatik Güncelleme** | Var | Manuel dosya takibi | Manuel indirme | **İmzalı Tauri Otomatik Güncelleyici** |
| **Bellek ve Kaynak Tüketimi** | 150 - 300 MB | ~10 MB | ~80 MB | **~25 MB (Rust Motoru + WebView2)** |

GoodbyeDPI yıllardır bu konseptin teknik temelini oluşturmaktadır; fakat siyah bir konsol penceresi, onlarca karmaşık komut satırı parametresi ve çöken servislerle uğraşmak sıradan kullanıcılar için zordur. SplitWire bu duruma grafik arayüz kazandırmış olsa da Windows hizmet entegrasyonu, Discord güncelleme kilitlenmeleri ve derin analiz ekranları konusunda sınırlı kalmıştır. 

Anticore, bu iki dünyanın güçlü yanlarını bir araya getirir: Rust ile sıfırdan yazılmış hafif bir çekirdek, modern bir masaüstü kontrol paneli ve Türkiye ağlarına göre ayarlanmış hazır stratejiler.

---

## İki Farklı Çalışma Modu

Anticore arayüzünde kullanıcıyı iki farklı deneyim karşılar:

### 1. Basit Mod (Son Kullanıcılar İçin)
Karmaşık ağ terimleriyle uğraşmak istemiyorsanız Basit Mod tam size göredir:
- Ortadaki büyük güç butonuna basarak korumayı başlatabilirsiniz.
- İnternet servis sağlayıcınızı (Türk Telekom, Superonline, Kablonet, Vodafone) listeden seçtiğinizde arka plandaki tüm TTL ve paket bölme parametreleri otomatik olarak en kararlı ayarlara getirilir.
- Discord, Roblox, YouTube 4K, Twitch ve diğer popüler platformların erişim durumunu yeşil durum rozetleriyle doğrudan teyit edebilirsiniz.

### 2. Pro Matrix Konsolu (Meraklılar ve Ağ Uzmanları İçin)
Arka planda ne olup bittiğini görmek isteyenler için teknik bir gösterge paneli bulunur:
- **Canlı Throughput (PPS) Grafiği:** Ağ kartınızdan geçen paket sıklığını anlık milisaniyelik sparkline grafiğiyle çizer.
- **Aktif Strateji Zinciri:** Hangi paket bölme yönteminin devrede olduğunu adım adım gösterir (örneğin: `[TTL=3] -> [SPLIT=SNI+2]`).
- **Dörtlü Sayaç:** Görülen hedef paketler, başarıyla atlatılan el sıkışmalar, doğrudan geçirilen normal trafik ve uygulamanın açık kalma süresi.
- **Terminal Log Konsolu:** Hata, bilgi ve başarı mesajlarını filtreleyebileceğiniz, arama yapabileceğiniz ve panoya kopyalayabileceğiniz canlı log alanı.

---

## Nasıl Çalışır?

Servis sağlayıcıların DPI (Derin Paket İnceleme) cihazları, kullanıcıların hangi siteye gittiğini anlamak için TLS bağlantısının henüz şifrelenmemiş olan ilk paketine bakar. Bu paketin içinde sitenin açık adı (SNI: Server Name Indication) yer alır.

```
[ Tarayıcı ya da Oyun ]
           │
           │ 1. TLS ClientHello (Hedef: discord.com)
           ▼
┌─────────────────────────────────────────────────────────────┐
│  ANTICORE MOTORU (Rust + WinDivert Sürücüsü)                │
│                                                             │
│  - Yalnızca hedef listedeki sitelerin paketlerini dinler.   │
│  - Düşük TTL değerli sahte bir paket üretir.                │
│  - Gerçek ClientHello paketini SNI etiketinin ortasından    │
│    iki ayrı TCP parçasına böler.                            │
└─────────────────────────────────────────────────────────────┘
           │
     ┌─────┴──────────────────────────────┐
     │ 2. Sahte Paket (TTL=3)             │ 3. Bölünmüş Gerçek Paketler
     ▼                                    ▼
[ ISS DPI Filtre Kutusu ]         [ Hedef Sunucu (Discord) ]
(Sahte paketle meşgul olur)       (TCP parçalarını birleştirir)
                                          │
                                          │ 4. Güvenli Bağlantı Kuruldu!
                                          ▼
                      [ Kalan TÜM indirme verisi %100 hızla akar ]
```

1. **Sahte Paket Enjeksiyonu (Fake Packet with TTL):** ISS omurgasındaki filtre kutusuna kadar gidebilecek ancak ana internet düğümlerini geçemeden ömrü tükenecek (Time-to-Live süresi bitmiş) sahte bir paket yollanır. Filtreleme cihazı bu sahte veriyi işlerken arkadan gelen gerçek paketi kaçırır.
2. **Paket Bölme (SNI Splitting):** Alan adını taşıyan ilk paket küçük parçalara bölünür. Basit sansür cihazları bu parçaları belleğinde birleştirip denetleyemediği için engelleme uygulayamaz.
3. **Pasif Savunma (RST Drop):** Sağlayıcı tarafından bağlantıyı zorla kapatmak için gönderilen sahte TCP RST paketleri işletim sistemine ulaşmadan düşürülür.
4. **QUIC / HTTP3 Engelleme:** UDP tabanlı QUIC bağlantıları TLS'e düşürülür; böylece paket atlatma kuralları tarayıcılarda kesintisiz çalışır.

---

## Dahili Ağ Onarım Araçları

- **Discord Kurtarma Aracı:** Discord açılırken oluşan sonsuz "Checking for updates" döngüsünü, ses kanallarında (RTC) yaşanan bağlantı kopmalarını ve önbellek kilitlenmelerini çözer.
- **Windows DoH (DNS-over-HTTPS) Entegrasyonu:** Servis sağlayıcıların DNS zehirleme yöntemlerini engellemek için Cloudflare, Google, Quad9 veya AdGuard DoH adreslerini doğrudan Windows kayıt defterine tanımlar.
- **DNS Sızıntı Testi:** DNS sorgularınızın yerel operatörünüze açık metin olarak gidip gitmediğini otomatik olarak test eder.

---

## Sık Sorulan Sorular ve Bilinen Durumlar

#### 1. Neden Yönetici İzni Gerekiyor?
Windows, ağ kartı üzerinden geçen ham TCP/IP paketlerini okuma ve değiştirme iznini yalnızca sistem yöneticilerine verir. WinDivert sürücüsünün yüklenebilmesi ve paketlerin manipüle edilebilmesi için yönetici yetkisi teknik bir zorunluluktur.

#### 2. Antivirüs Yazılımım Uyarı Verir mi?
WinDivert, tüm dünyada ağ analiz ve güvenlik araçlarında kullanılan meşru bir açık kaynak sürücüdür. Ancak bazı antivirüsler derin paket sürücülerini tanımadığı için genel bir uyarı verebilir. Anticore'un kaynak kodları tamamen açıktır; hiçbir zararlı yazılım, reklam veya gizli veri toplama modülü barındırmaz. İkili dosyalarımız Minisign ile imzalanmıştır.

#### 3. Tek Başına DPI Aşmak Neden Bazen Yetmez?
Eğer internet sağlayıcınız engellemeyi DPI yerine doğrudan DNS düzeyinde yapıyorsa (yani discord.com sorgusuna yanlış bir IP adresi döndürüyorsa), DPI motoru doğru sunucuya ulaşamaz. Bu nedenle arayüzdeki Ağ Onarımı bölümünden DoH (DNS-over-HTTPS) özelliğini açmanız tavsiye edilir.

---

## Kaynak Koddan Derleme

Kendi ikili dosyalarınızı kendiniz derlemek isterseniz aşağıdaki adımları izleyebilirsiniz:

### Gereksinimler
- Rust 1.80 veya üzeri (`rustup`)
- Node.js 18 veya üzeri (`npm`)
- Visual Studio 2022 C++ Derleme Araçları (MSVC x64)

### Derleme Adımları

```powershell
# 1. Projeyi bilgisayarınıza klonlayın
git clone https://github.com/MonarchDevLab/Anticore.git
cd Anticore/antikor

# 2. Rust motor testlerini çalıştırın (46 test paketi)
cargo test --workspace

# 3. Bağımsız motoru derleyin
cargo build --release --workspace

# 4. Masaüstü arayüz bağımlılıklarını yükleyin
cd desktop
npm install

# 5. Geliştirici modunda arayüzü başlatın
npm run tauri dev

# 6. Üretim paketlerini (EXE, MSI, Portable) üretin
npm run tauri build
```

---

## Güvenlik ve Doğrulama

Resmi GitHub Releases sayfasından indirdiğiniz dosyaları aşağıdaki açık anahtar ile doğrulayabilirsiniz:

```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDAzNkNDN0QyQzUzRDU1RTYKUldSUE9pWld3bXN5aGZ1N1N6T2I0SldhZEU2S2h2dDVlOGJld2Y3bEZoT0x4MGlpSEI1ZmdQdkIK
```

Doğrulama komutu:
```powershell
minisign -Vm Anticore_x64-setup.exe -p anticore.key.pub
```

Güvenlik politikamız ve güvenlik açığı bildirim süreçlerimiz için [SECURITY.md](SECURITY.md) belgesine bakabilirsiniz.

---

## Lisans

Bu yazılım [MIT Lisansı](LICENSE) kapsamında dağıtılmaktadır.

- **WinDivert:** [LGPLv3](https://reqrypt.org/windivert.html) lisansına sahip bağımsız ağ filtreleme sürücüsüdür.
- **WebView2:** Microsoft Corporation mülkiyetindedir.
- **Yasal Sorumluluk:** Anticore, ağ analizi, kişisel gizlilik ve sansürsüz bilgiye erişim amacıyla geliştirilmiştir. Kullanıcıların yerel yasalara ve servis kullanım şartlarına uygun hareket etmesi kendi sorumluluğundadır.

<div align="center">
  <sub>Monolith Works tarafından geliştirilmekte, MonarchDevLab üzerinden dağıtılmaktadır. Türkiye'deki tüm kullanıcılara hızlı, güvenli ve bağımsız bir internet deneyimi sunmak amacıyla açık kaynak olarak paylaşılmıştır.</sub>
</div>
