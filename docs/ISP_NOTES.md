# Türkiye ISP Gözlemleri (Canlı Doküman)

> Bu doküman canlı test bulgularıyla güncellenir. Faz 3 otomatik test motoru
> bu tabloyu veriyle besleyecek.

| ISP | DPI davranışı | Çalışan başlangıç profili | Not |
|---|---|---|---|
| Türknet | TLS SNI bazlı, orta agresif | fake-ttl(4) + SniMid fragment | Doğrulanacak |
| Superonline | SNI + olası aktif probing | fake-ttl(8) + SniMid | Reverse-frag gerekebilir |
| Türk Telekom | SNI, record-başı denetimi | fake-ttl(3) + Fixed(1) fragment | |
| Turkcell | SNI bazlı | fake-ttl(5) + SniMid | |
| Vodafone | SNI bazlı | fake-ttl(5) + SniMid | |

## Test Prosedürü (elle)
1. `anticore --profile <x> --dry-run` ile motor çıktısını doğrula.
2. Yönetici terminalde `anticore --profile <x> --run`.
3. Hedef siteleri aç; tarayıcıda Secure DNS (DoH) AÇIK olsun (DNS poisoning bypass).
4. Sonucu bu tabloya işle: site / profil / sonuç / tarih.
