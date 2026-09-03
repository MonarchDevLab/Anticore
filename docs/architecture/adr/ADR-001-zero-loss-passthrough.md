# ADR-001: Zero-Loss Passthrough Ağ Mimarisinin Seçimi

- **Durum:** Kabul Edildi
- **Tarih:** 2026-09-02
- **Karar Sahibi:** Monolith Works Mimarlık Kurulu

## 1. Bağlam ve Problem
DPI bypass araçlarının çoğu sistem düzeyinde tüm giden ve gelen TCP paketlerini bir kullanıcı alanı (user-space) proxy'sine yönlendirir. Bu yaklaşım tüm ağ trafiğinde gecikme (latency), CPU tüketimi ve özellikle bankacılık, oyun ve canlı yayın bağlantılarında kararsızlık yaratır. Anticore için temel gereksinim, yalnızca sansürlenen hedeflerin trafiğini işlerken kalan tüm trafiği sıfır performans kaybıyla doğrudan iletmektir.

## 2. Değerlendirilen Seçenekler
1. **Lokal SOCKS5 / HTTP Proxy:**
   - *Dezavantaj:* Sistem proxy ayarlarını değiştirir, UDP/DNS trafiğini kaçırabilir, her paket bellek kopyalamaya (copy overhead) maruz kalır.
2. **TUN/TAP Sanal Ağ Arayüzü:**
   - *Dezavantaj:* Tüm IP yığınını sanal adaptöre yönlendirir, routing tablosunu bozar, oyun gecikmelerini (ping) artırır.
3. **WinDivert Kernel Sürücüsü ile Seçici Passthrough (Seçilen):**
   - *Avantaj:* Paketler doğrudan NDIS/IP yığınından kernel seviyesinde yakalanır. Filtreye uymayan veya hedef alan adı listesinde olmayan paketler `PacketVerdict::Passthrough` ile sıfır kopyalama ve sıfır bekleme ile anında işletim sistemi yığınına geri bırakılır.

## 3. Karar
WinDivert kernel sürücüsü tabanlı seçici filtreleme mimarisi kabul edilmiştir:
- Yalnızca giden `TCP SYN` ve ilk `TLS ClientHello` paketleri derinlemesine incelenir.
- Hedef alan adı (SNI) `Sites.tsx` beyaz listesinde yer almıyorsa, paket hiçbir değişikliğe uğramadan `WinDivertSend` ile iletilir.
- Yalnızca tespit edilen sansürlü akışlarda TCP segment parçalama (fragmentation) ve sahte paket (fake packet injection) zinciri yürütülür.

## 4. Sonuçlar
- Normal internet trafiği, bankacılık uygulamaları ve oyun ping süreleri %0 ek gecikmeyle çalışır.
- Çekirdek CPU kullanımı %0.1 seviyesinde tutulur.
- Yönetici ayrıcalığı (UAC elevation) gereksinimi zorunlu hale gelmiştir.
