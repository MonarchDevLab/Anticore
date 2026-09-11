# Anticore Çoklu Platform (Linux ve macOS) Motor ve Hızlı Panel Mimari Şartnamesi

- **Doküman Kodu:** MW-SPEC-ANTICORE-CROSSPLATFORM-001
- **Telif Sahibi:** Monolith Works
- **Tarih:** 2026-09-11
- **Durum:** Onaylandı / Mimari Şartname

---

## 1. Amaç ve Kapsam

Bu şartname, Windows platformunda `WinDivert` sürücüsüyle çalışan Anticore DPI baypas ve paket manipülasyon motorunun Linux ve macOS işletim sistemlerinde tam işlevsel, yüksek performanslı ve yerel olarak çalıştırılması için gerekli alt sistemleri, süreç mimarisini ve arayüz entegrasyonunu tanımlar.

### 1.1 Temel Hedefler
1. **Çekirdek Bütünlüğü:** `anticore-core` içinde yer alan L4/L7 analiz (TLS ClientHello SNI tespiti, HTTP Host parsing) ve manipülasyon (segment bölme, sahte TTL, bozuk sağlama toplamı, sıra kaydırma) algoritmalarının hiçbir platform bağımlılığı olmadan %100 yeniden kullanımı.
2. **Sürücüsüz Çalışma:** Linux ve macOS ortamlarında hiçbir harici üçüncü taraf çekirdek sürücüsü (`.sys`, `.kext`) yüklemeden işletim sistemlerinin yerel çekirdek ağ yeteneklerini kullanmak.
3. **macOS Menü Çubuğu Hızlı Paneli:** macOS ortamında ekranın sağ üst menü çubuğuna (Status Bar / NSStatusItem) doğrudan kenetli, odak kaybında otomatik kapanan şık ve yerel Hızlı Panel (`quick-panel`) deneyiminin eksiksiz sağlanması.
4. **Güvenli Yetki Ayrımı:** Arayüzün (Tauri GUI) standart kullanıcı yetkisinde çalıştırılması; çekirdek paket yakalama ve yönlendirme işlemlerinin hafif bir arka plan servisi (LaunchDaemon / systemd) veya izinli ikili (`setcap`) üzerinden yürütülmesi.

---

## 2. Mimari Katmanlar ve Taşıyıcı Soyutlaması

Mevcut monolitik `WinDivert` bağımlılığı kaldırılarak `anticore-core` üzerinde ortak bir taşıyıcı arayüzü tanımlanır:

```
┌─────────────────────────────────────────────────────────────┐
│                 anticore-core (Saf Rust)                    │
│   - TLS ClientHello & HTTP Parser                           │
│   - Karar Mekanizması: decide_packet(raw, bl, steps)        │
│   - Strateji Yürütücü: apply_steps()                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    trait PacketTransport                    │
│   + open(config: &TransportConfig) -> Result<Self>          │
│   + recv(&self, buf: &mut [u8]) -> Option<(usize, Meta)>    │
│   + send(&self, raw: &[u8], meta: &Meta) -> Result<()>      │
│   + set_verdict(&self, id: u64, verdict: Verdict)           │
│   + close(&mut self)                                        │
└──────┬───────────────────────┼───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌───────────────┐       ┌───────────────┐
│transport-win │       │transport-linux│       │transport-macos│
│ (WinDivert)  │       │   (NFQUEUE)   │       │  (utun + pf)  │
└──────────────┘       └───────────────┘       └───────────────┘
```

### 2.1 Trait Kontratı
* `recv`: Gelen ham IP paketini tahsis edilmemiş tampona (`&mut [u8]`) yazar. Sıfır kopyalama (`zero-copy`) prensibi korunur.
* `send`: `anticore-core` tarafından üretilen sahte veya bölünmüş paketleri doğrudan ağ kartına basar.
* `set_verdict`: Yakalanan orijinal paketin çekirdekteki akıbetini belirler (`Accept` veya `Drop`).

---

## 3. Linux Motoru (`anticore-transport-linux`)

Linux ortamında paket yakalama, çekirdek seviyesindeki **NFQUEUE (`libnetfilter_queue`)** altyapısıyla gerçekleştirilir.

### 3.1 Ağ Filtreleme Kuralları (`iptables` / `nftables`)
Motor başlatıldığında mangle tablosunun `OUTPUT` zincirine şu kurallar işlenir:

```bash
# 1. Hedef portları NFQUEUE kuyruğuna (kuyruk: 200) yönlendir
iptables -t mangle -I OUTPUT -p tcp -m multiport --dports 80,443 -m mark ! --mark 0x40 -j NFQUEUE --queue-num 200 --queue-bypass

# 2. Pasif Savunma: Sahte RST paketlerini çekirdekte düşür
iptables -t mangle -I INPUT -p tcp -m multiport --sports 80,443 --tcp-flags RST RST -j DROP

# 3. QUIC Engelleme: UDP/443 trafiğini düşür (tarayıcılar TCP TLS'e döner)
iptables -I OUTPUT -p udp --dport 443 -j DROP
```

### 3.2 Kritik Güvenlik ve Kararlılık Parametreleri
1. **`--queue-bypass` Bayrağı:** Kullanıcı alanındaki Anticore süreci çökerse veya durursa, Linux çekirdeği paketleri engellemez; doğrudan hatta iletir. İnternet bağlantısının kilitlenmesi kesin olarak önlenir.
2. **`SO_MARK 0x40` Damgası:** Anticore tarafından `SOCK_RAW` soketiyle dışarı basılan sahte ve parçalanmış paketler `0x40` ile etiketlenir. `-m mark ! --mark 0x40` filtresi sayesinde motorun kendi enjekte ettiği paketler kuyruğa tekrar girmez; sonsuz döngü engellenir.
3. **Ham Enjeksiyon Soketi:** `socket(AF_INET, SOCK_RAW, IPPROTO_RAW)` açılır ve `IP_HDRINCL` bayrağı aktif edilir. Bu sayede özel TTL, sahte sıra numarası (Seq/Ack) ve bozuk sağlama toplamları (bad checksum) çekirdek engeline takılmadan üretilir.
4. **Çıkış Temizliği (RAII Cleanup):** Süreç sonlanırken (`SIGINT`, `SIGTERM`, panik durumu) açılan tüm iptables kuralları otomatik olarak kaldırılır.

---

## 4. macOS Motoru (`anticore-transport-macos`)

Modern macOS sürümlerinde (Catalina sonrası) üçüncü taraf çekirdek sürücüleri (KEXT) yasaklanmıştır. Apple sertifikası veya ücretli geliştirici hesabı gerektirmeden tam çalışan mimari **Sürücüsüz `utun` + Paket Filtresi (`pf`)** entegrasyonudur.

### 4.1 Arabirim Kurulumu (`utun`)
1. Çekirdek kontrol soketi açılır: `socket(PF_SYSTEM, SOCK_DGRAM, SYSPROTO_CONTROL)`.
2. `ioctl(fd, CTLIOCGINFO, &ctl_info)` ile `com.apple.net.utun_control` tanıtıcısı alınır.
3. Soket bağlandığında işletim sistemi yeni bir `utunX` (örneğin `utun3`) arabirimi tahsis eder.
4. Arabirime MTU (1500) ve yerel IP yönlendirmesi atanır.

### 4.2 Paket Yönlendirme (`pfctl`)
Anticore için ayrılmış geçici bir pf bağlantı noktası (`anchor "com.monolithworks.anticore"`) açılır:

```
anchor "com.monolithworks.anticore" {
    # 80 ve 443 giden TCP paketlerini utun arabirimine aktar
    pass out on en0 route-to utun3 proto tcp from any to any port {80, 443}
    
    # Pasif Savunma: Sahte RST engelleme
    block in proto tcp from any port {80, 443} flags R/R
    
    # QUIC Engelleme
    block out proto udp to any port 443
}
```

### 4.3 Ham Soket ve Dışarı Basma
`utun` arabiriminden okunan ham IPv4 paketleri `anticore-core` karar motoruna sokulur. `Rewrite` kararı çıktığında, oluşturulan segmentler fiziksel çıkış arabirimine (`en0`) bağlı ham soket üzerinden gönderilir.

---

## 5. macOS Menü Çubuğu ve Hızlı Panel Entegrasyonu

macOS masaüstü ortamında kullanıcı etkileşiminin ana merkezi sağ üst menü çubuğudur (Status Bar).

### 5.1 Pencere Konumlandırma Motoru (`position_quick_panel`)
Windows görev çubuğu sağ alttayken, macOS menü çubuğu ekranın en üstündedir. `desktop/src-tauri/src/tray.rs` içindeki konumlama mantığı platform bazlı ayrıştırılır:

```rust
#[cfg(target_os = "macos")]
fn position_quick_panel(panel: &tauri::WebviewWindow, tray_rect: &tauri::Rect) {
    if let Ok(Some(monitor)) = panel.current_monitor() {
        let scale = monitor.scale_factor();
        let work_area = monitor.work_area();
        let panel_width = (340.0 * scale) as i32;
        let panel_height = (460.0 * scale) as i32;

        let tray_pos = tray_rect.position.to_physical::<i32>(scale);
        let tray_size = tray_rect.size.to_physical::<u32>(scale);

        // Menü çubuğu simgesinin yatay merkezini bul
        let target_x = tray_pos.x + (tray_size.width as i32 / 2) - (panel_width / 2);
        let clamped_x = target_x.clamp(
            work_area.position.x + 8,
            work_area.position.x + work_area.size.width as i32 - panel_width - 8,
        );

        // macOS: Menü çubuğunun hemen altından aşağıya doğru açıl (üst boşluk 6px)
        let target_y = tray_pos.y + tray_size.height as i32 + 6;

        let _ = panel.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: clamped_x,
            y: target_y,
        }));
    }
}
```

### 5.2 Pencere Özellikleri ve Davranış
* **Görsel Tasarım:** Köşeleri yuvarlatılmış (radius: 12px), macOS Vibrant/Translucent arka planlı arayüz.
* **Dock İzolasyonu:** `tauri.conf.json` içinde `skipTaskbar: true` ayarlanarak macOS Dock'unda bağımsız bir uygulama simgesi oluşturulması engellenir.
* **Odak Kaybı:** Kullanıcı ekranın başka bir yerine tıkladığında pencere `Focused(false)` olayı ile anında gizlenir.
* **Tek/Çift Tıklama:** Tek tık Hızlı Panel'i açar/kapatır; çift tık tam ekran Yönetim Paneli'ni (`main`) öne getirir.

---

## 6. Süreç ve Yetki Ayrımı (Privilege Architecture)

| Platform | Arayüz (GUI) | Motor (Engine / Daemon) | İletişim Kanalı |
|---|---|---|---|
| **Linux** | Standart Kullanıcı | `anticore-cli` (`setcap cap_net_admin,cap_net_raw+ep`) veya `systemd` servisi | Unix Domain Socket (`/var/run/anticore.sock`) |
| **macOS** | Standart Kullanıcı | LaunchDaemon (`/Library/LaunchDaemons/com.monolithworks.anticore.plist`) | Unix Domain Socket (`/var/run/anticore.sock`) |
| **CLI Modu** | Standart / Root | `sudo anticore run --profile <id>` | Doğrudan terminal çıktısı |

### 6.1 macOS İlk Kurulum Akışı
1. Kullanıcı `Anticore.dmg` içerisinden uygulamayı `Applications` klasörüne sürükler.
2. Uygulama ilk kez açıldığında, motor ikilisini LaunchDaemon olarak kaydetmek üzere yerel macOS yetki penceresi açılır (`osascript -e 'do shell script "..." with administrator privileges'`).
3. Daemon `/var/run/anticore.sock` üzerinde dinlemeye başlar.
4. GUI, daemon ile soket üzerinden el sıkışır. Kullanıcı sonraki hiçbir çalıştırmada şifre girmez.

---

## 7. Dağıtım ve Paketleme Formatları

### 7.1 Linux Dağıtımı
* **Debian / Ubuntu:** `.deb` paketi (`systemd` servis dosyası ve `setcap` tetikleyicisiyle).
* **Fedora / RHEL:** `.rpm` paketi.
* **Taşınabilir:** `.tar.gz` (CLI + GUI ikilileri ve kurulum betiği).
* **Hedef Mimariler:** `x86_64-unknown-linux-gnu` ve `aarch64-unknown-linux-gnu`.

### 7.2 macOS Dağıtımı
* **Paket Türü:** `.dmg` (Disk Image) ve `.app` uygulama paketi.
* **Universal Binary:** Apple Silicon (`aarch64-apple-darwin`) ve Intel (`x86_64-apple-darwin`) tek bir evrensel ikili altında birleştirilir (`lipo`).
* **Simge Seti:** `icons/icon.icns` standart macOS formatında üretilir.

---

## 8. Doğrulama ve Test Matrisi

1. **Birim Testleri (`cargo test`):**
   * Sahte paket oluşturucu ve SNI bölücünün Linux/macOS üzerinde doğru bayt çıktıları vermesi.
   * `PacketTransport` trait simülasyonu (mock transport).
2. **Yerel Ağ ve İptables/PF Testi:**
   * Kuyruk baypas (`--queue-bypass`) senaryosu testi.
   * Çıkışta iptables/pf kurallarının eksiksiz silindiğinin (sıfır sızıntı) doğrulanması.
3. **GUI ve Hızlı Panel Testi:**
   * Menü çubuğuna kenetlenme ve koordinat hesaplama doğruluğu.
   * Odak kaybında gizlenme ve bellek sızıntısı kontrolü.
