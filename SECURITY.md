# Güvenlik ve Gizlilik Politikası (Security Policy)

Anticore, kullanıcı gizliliğini ve veri güvenliğini en yüksek öncelik olarak kabul eder. Bu belge, uygulamanın güvenlik modelini, sürücü çalışma ilkelerini ve güvenlik açığı bildirim süreçlerini açıklar.

---

## 1. Gizlilik İlkeleri (Privacy by Design)

- **Sıfır Telemetri (Zero Telemetry):** Uygulama hiçbir analitik servisi, kullanıcı takibi, çerez veya telemetri kodu içermez.
- **Sıfır Günlük Kaydı (Zero Logging to Remote):** Uygulamanın ürettiği loglar yalnızca yerel bellek oturumunda tutulur; hiçbir uzak sunucuya iletilmez.
- **Tünelsiz İletişim (Direct Connection):** Anticore bir VPN veya proxy sunucusu işletmez. İndirme ve yükleme verileriniz sizin bilgisayarınız ile hedef sunucu arasında doğrudan şifreli (HTTPS / TLS) olarak akar.

---

## 2. Ağ Sürücüsü ve Sistem Güvenliği (`WinDivert`)

Anticore, paket manipülasyonu için açık kaynaklı ve denetlenmiş **WinDivert** (`WinDivert64.sys`) paket yakalama sürücüsünü kullanır.

- **Kapsam:** Yalnızca yerel ağ katmanında (L4/L7) hedef listenizde tanımlı alan adlarının ilk el sıkışma paketlerini yakalar.
- **Yönetici Yetkisi:** Windows çekirdek sürücülerinin (`.sys`) işletim sistemine yüklenebilmesi için Yönetici (UAC) yetkisi zorunludur. Anticore bu yetkiyi yalnızca sürücüyü başlatmak ve DNS ayarlarını yönetmek için kullanır.
- **Antivirüs Yanlış Pozitifleri (False Positives):** Bazı antivirüs yazılımları (ör. Kaspersky, ESET), düşük seviyeli paket sürücüsü kullanan açık kaynaklı araçları (GoodbyeDPI, Zapret, Wireshark, Anticore) şüpheli davranış heuristiğiyle işaretleyebilir. Kaynak kodlarımız tamamen açık olup denetime açıktır.
- **Lisans:** WinDivert, Anticore'un kendi MIT lisansından bağımsız olarak LGPLv3/GPLv2 çift lisanslıdır ve değiştirilmeden dağıtılır — ayrıntılar için [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

---

## 3. Bellek Güvenliği (Memory Safety)

Anticore'un tüm ağ motoru (`anticore-core`), bellek sızıntılarını, arabellek taşmalarını (buffer overflow) ve use-after-free açıklarını derleme zamanında önleyen **Rust** diliyle yazılmıştır.

---

## 4. Güvenlik Açığı Bildirimi (Vulnerability Disclosure)

Eğer Anticore uygulamasında veya çekirdek motorunda bir güvenlik açığı tespit ederseniz:

1. Lütfen açığı herkese açık GitHub Issues üzerinden paylaşmayınız.
2. Açık detaylarını ve yeniden üretme adımlarını GitHub **Private Vulnerability Reporting** sekmesinden veya proje yöneticilerine özel olarak iletiniz.
3. Bildirilen güvenlik açıkları en geç 48 saat içinde incelenir ve yamalanır.
