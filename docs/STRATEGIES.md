# Teknik Kataloğu

Anticore'un kullandığı yöntemler, TCP/TLS/HTTP standartlarında tanımlı
meşru davranışlardan faydalanan paket düzeyi tekniklerdir. Bu doküman
motorun yetenek haritasını ve her tekniğin çalışma mantığını tutar.

## Bağlantı Kuruluşu Teknikleri (TLS/443)

### 1. SNI Parçalama (FragmentTls)
TLS ClientHello, sunucu adının (SNI) ortasından ikiye bölünerek iki ayrı
TCP segmenti olarak gönderilir. DPI cihazları tek pakette SNI beklediğinden
kural eşleşmesi yapılamaz; hedef sunucu ise TCP yeniden birleştirmeyle
veriyi eksiksiz alır.

Varyantlar:
- `SniMid`: hostname'in tam ortasından bölme
- `Fixed(n)`: kaydın ilk n baytını ayırma
- `Reverse(n)`: segmentleri ters sırada gönderme — bazı orta kutular
  parçalı ClientHello'yu birleştirip yeniden denetler; ters sıra bu
  birleştirmeyi boşa düşürür

### 2. Çoklu Parçalama (MultiSplit)
TLS ClientHello veya HTTP payload'ı, belirlenen birden fazla ofset noktasından
(örneğin 2, 5, 20 bayt) 3 veya daha fazla bağımsız TCP segmentine bölünür.
Karmaşık kural setlerine sahip DPI cihazlarının buffer ve state limitlerini
aşmak için kullanılır.

### 3. Sahte Paket Ön Yükleme (FakePacketBefore & AutoTtl)
Gerçek trafikten önce, hedefe ulaşamayacak düşük TTL'li ama GEÇERLİ
checksum'lı bir ClientHello kopyası gönderilir. Denetim cihazı bu kopyayı
gerçek sanıp kuralını uygular; hedef sunucu ise paketi TTL sona erdiği
için (ICMP Time Exceeded) hiç almaz. Checksum kasıtlı bozulmaz — bunu
yapmak yalnızca checksum doğrulayan (stateful) denetleyicilere karşı
tekniği zayıflatır; bozuk checksum ayrı bir teknik olarak
`FakeWrongChecksum`'da uygulanır.
- `FakePacketBefore`: Sabit TTL değeri uygular.
- `AutoTtl`: Taban TTL değeri + tolerans payı ile dinamik/kontrollü TTL uygular.

### 4. Sıra Numarası Yanıltması (FakeWrongSeq)
Sahte kopya, geçmişte kalmış bir TCP sequence numarasıyla gönderilir.
Sunucu pencere dışı veri sayıp düşürür; denetim cihazı ise kabul eder.

### 5. Bozuk Checksum Sahtesi (FakeWrongChecksum)
Kasıtlı olarak ters çevrilmiş TCP checksum içeren sahte paket gönderilir.
Checksum doğrulaması yapmayan basit DPI cihazları paketi kabul ederken,
hedef sunucu paketi kernel seviyesinde sessizce düşürür.

### 6. Özel İmzalı Sahte Paket (FakeFromHex)
Standart ClientHello yerine özel hex verisi (OOB baytları, garbled sahte
başlıklar) içeren sahte paket gönderilir. DPI state cache'ini yanıltır.

## Düz HTTP Teknikleri (80)

### 7. Host Parçalama (FragmentHttp)
GET isteği, Host başlığının ortasından bölünür (TLS tekniğinin HTTP karşılığı).

### 8. Harf Karışımı (HostCase)
`Host: Example.COM` → `Host: eXaMpLe.CoM` — HTTP 1.1'de alan adları
büyük/küçük harf duyarsızdır; kural eşleştiren sistemler düz metin arar.

### 9. Boşluk Kaldırma (HostSpace)
`Host: site.com` → `Host:site.com` — RFC 7230'a göre geçerli; imza
tabanlı eşleştirmeyi bozar.

## Trafik Koruma İlkeleri (hız garantisi)

- Yalnızca her TCP akışının İLK veri paketi işlenir; kalan trafik
  dokunulmadan geçer.
- 1400 bayt üstü payload (dosya transferi) hiç incelenmez.
- Hedef listesinde olmayan domainlere sıfır müdahale.
- Proxy/tünel yok: veri doğrudan hedefe gider, gecikme eklenmez.
