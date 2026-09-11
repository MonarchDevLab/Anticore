# Spesifikasyon: Anticore Telemetri, Oturum Takibi ve Özel Analitik Dashboard (v1.0)

Tarih: 2026-09-11  
Durum: Taslak (Gözden Geçirme Aşamasında)  
Hedef Dizin: `anticore-dashboard/` (Git yalıtımlı, yalnızca yerel/özel geliştirici kullanımı)  
İstemci: `Anticore Desktop` (`antikor/desktop`) & `Anticore Engine` (`antikor/engine`)

---

## 1. Amaç ve Vizyon
Bu alt sistem; Anticore'un sahadaki gerçek kullanıcı deneyimini, kullanıcıların uygulamayı hangi saatlerde, hangi bilgisayarlardan ve ne kadar süreyle açık tuttuklarını, hangi ekran ve özellikleri kullandıklarını, hangi operatörde (ISP) hangi DPI bypass stratejisinin başarılı olduğunu ve en önemlisi **yerleşik listelerde yer almayan ancak operatörler tarafından engellenen/sıfırlanan yeni web sitelerini (anomalileri)** tespit etmek amacıyla geliştirilmektedir.

Sistem iki ana kutuptan oluşur:
1. **Anticore İstemci İçi Sessiz Katman (Stealth Telemetry Beacon):** Uygulama içinde asla göze çarpmayan, son kullanıcı ayarlarında devre dışı bırakılamayan, arayüzü ve paket motorunu asla yavaşlatmayan, hata durumunda sessizce kendini yutan `connectivitySync` servisi.
2. **Özel Yönetim Paneli ve Veri Alım Sunucusu (`anticore-dashboard`):** Fastify + SQLite (WAL) tabanlı yüksek performanslı veri alım API'si ve $10K UI standartlarında React + Tailwind analitik paneli.

---

## 2. Mimari Genel Bakış

```
+-----------------------------------------------------------------------------------+
|                            ANTICORE DESKTOP İSTEMCİSİ                             |
|                                                                                   |
|  [WinDivert / Utun Engine]        [React UI - Sayfalar / Butonlar]                |
|           |                                       |                               |
|           v (TCP RST / DNS Anomali)               v (Dwell Time / Tıklama)        |
|  +-----------------------------------------------------------------------------+  |
|  |           Sessiz Telemetri Servisi (services/connectivitySync.ts)          |  |
|  |   - Bellek içi Olay Kuyruğu (Memory Ring Buffer)                           |  |
|  |   - 60 sn Periyodik Heartbeat (Açık kalma süresi & Saatlik dağılım)         |  |
|  |   - PC İsmi (Hostname) & Sistem Özeti (OS, Ekran, Mimari)                  |  |
|  |   - Fail-Safe & Zero-Impact (Hata yutma, 2.5s zaman aşımı)                  |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------------|----------------------------------------+
                                           | HTTP POST /api/v1/telemetry/beacon (Batch)
                                           | X-Anticore-Ingest-Key
                                           v
+-----------------------------------------------------------------------------------+
|                        ANTICORE-DASHBOARD (Özel & Gizli)                         |
|                                                                                   |
|  [Fastify Ingestion API]                                                          |
|    - GeoIP Çözümleme (IP -> Ülke, Şehir, ISP, ASN)                                |
|    - Zod Doğrulama & Rate Limit Koruma                                            |
|    - better-sqlite3 (WAL Modu - data/telemetry.db)                                |
|                                                                                   |
|  [Admin API & Canlı Yayın]                                                        |
|    - Master Parola / JWT Oturumu                                                  |
|    - Server-Sent Events (SSE) Canlı Olay Akışı                                    |
|    - Dinamik Kural Dağıtım Uç Noktası (GET /api/v1/telemetry/rules)               |
|                                                                                   |
|  [Modern React Dashboard UI]                                                      |
|    - Canlı PC Listesi & Aktif/Kapalı Durumları                                    |
|    - Açık Kalma Süreleri & Saatlik Kullanım Isı Haritası (00:00 - 23:00)          |
|    - Keşfedilen Engelli Siteler Masası (1 Tıkla Onayla & Dağıt)                   |
|    - Ekran / Buton Kullanım Sıralaması (Dwell Time & Popülerlik)                  |
|    - Çökme, Antivirüs ve Sürücü Hataları Terminali                               |
+-----------------------------------------------------------------------------------+
```

### 2.1 API Uç Noktaları ve Uzaktan Yönetim Protokolü
- **İstemci Uç Noktaları (Anticore -> Sunucu):**
  - `POST /api/v1/telemetry/beacon`: İstemciden gelen toplu (batched) olay dizisini alır. `X-Anticore-Ingest-Key` başlığı ile spam'e karşı korunur.
    - **Sunucu Yanıtı (Uzaktan Yönetim, Acil Durum & Küresel Bakım Modu):**
      ```json
      {
        "status": "ok",
        "maintenance": {
          "active": false,
          "title": "Sistem Bakımda",
          "message": "Ağ optimizasyonu ve altyapı güncellemeleri nedeniyle servis geçici olarak bakım modundadır."
        },
        "command": {
          "action": "none" | "lock" | "self_purge",
          "reason": "Yetkisiz kullanım veya güvenlik ihlali nedeniyle uygulama durduruldu."
        }
      }
      ```
      - `maintenance.active == true`: İstemci motoru güvenle bekleme moduna alır ve arayüzü doğrudan **3D Gri/Metalik Dönen Orb** eşliğinde fütüristik minimalist bakım ekranına kilitler. Bakım modu kapatıldığında arayüz otomatik olarak kaldığı yerden açılır.
      - `lock`: İstemci motoru derhal durdurur ve arayüzü kilitler (kullanımı engeller).
      - `self_purge`: İstemci Anticore'un yerleşik `purge_system` komutunu otonom tetikler; servisleri, sürücüleri, DNS ayarlarını ve kendini sistemden kalıntısız siler.
  - `GET /api/v1/telemetry/rules`: İstemcinin açılışta veya saatlik çektiği güncel dinamik engelli site/bypass kuralları.
- **Yönetici Uç Noktaları (Dashboard -> Sunucu):**
  - `POST /api/v1/admin/login`: Master parola ile giriş -> JWT oturumu.
  - `GET /api/v1/admin/overview`: Özet kartlar (aktif PC'ler, son 24 saatteki olaylar, en çok engellenen siteler, bakım modu durumu).
  - `POST /api/v1/admin/maintenance`: Tek tıkla tüm kullanıcılar için bakım modunu açma/kapatma (`{ active: boolean, message?: string }`).
  - `GET /api/v1/admin/clients`: Bilgisayar adı ve IP'ye göre filtrelenebilir kullanıcı listesi.
  - `POST /api/v1/admin/clients/:id/action`: Bir PC için `action` belirleme (`lock`, `self_purge`, `unlock`).
  - `GET /api/v1/admin/anomalies`: Yeni keşfedilen engelli siteler tablosu + tek tıkla `Kurala Ekle` eylemi.
  - `GET /api/v1/admin/realtime`: Canlı telemetri akışı (Server-Sent Events - SSE).

---

## 3. İstemci Gizlilik ve Hata İzolasyonu (Stealth & Fail-Safe)

1. **İsimlendirme Hijyeni:**
   - Kod içinde ve ağ trafiğinde `telemetry`, `tracker`, `analytics`, `spy` gibi dikkat çeken kelimeler yerine `connectivitySync`, `networkDiagnostics`, `heartbeat` terminolojisi kullanılır.
2. **Sıfır Etki (Zero-Impact & Asenkron):**
   - Ağ motorunun paket işleme döngüsünü (WinDivert döngüsü) kesinlikle bloke etmez. Olaylar thread-safe bellek içi kuyrukta toplanır.
3. **Tam Sessizlik (Fail-Safe Silent Execution):**
   - Sunucu kapalıysa, ağ kopuksa veya istek zaman aşımına (2.5 sn) uğrarsa işlem tamamen sessizce yutulur (`try { ... } catch {}`).
   - Konsola veya log dosyalarına son kullanıcının göreceği hiçbir hata mesajı basılmaz.
   - Kuyruk dolarsa (örneğin 100 olay aşıldığında) en eski olaylar sessizce atılarak bellek tüketimi 100 KB altında tutulur.
4. **Kaldırılamaz Entegrasyon:**
   - Ayarlar menüsünde kapatma anahtarı (toggle) yer almaz.
   - Tauri uygulama açılışında (`App.tsx` ve Rust lifecycle) arka planda otonom olarak devreye girer.

---

## 4. Toplanan Veri ve Metrikler

### 4.1 Bilgisayar ve Cihaz Tanımlayıcıları
- `pc_name`: Bilgisayarın yerel adı (örn. `DESKTOP-8K2Q1`, `Berk-MacBook`).
- `client_id`: İlk açılışta yerel AppData'da oluşturulan kalıcı rastgele UUID.
- `os_platform`: `windows` veya `macos`.
- `os_version`: Windows 11 Build 22631, macOS Sonoma 14.5 vb.
- `cpu_arch`: `x64` veya `arm64`.
- `screen_res`: `1920x1080`, `2560x1440` vb.
- `app_version`: Kurulu sürüm (örn. `0.3.1.1`).

### 4.2 Oturum ve Açık Kalma Süreleri
- `session_id`: Oturum UUID.
- `session_start`: Uygulama açılış zamanı.
- `session_duration_seconds`: Uygulamanın toplam kaç saniye açık kaldığı.
- `engine_active_duration_seconds`: DPI / Bypass motorunun fiilen "Açık / Devrede" kaldığı toplam saniye.
- `active_hours`: Hangi saat dilimlerinde aktif olduğu (0-23 saat dilimi histogramı).
- `is_autostart`: Sistem başlangıcında mı açıldı, elle mi başlatıldı.
- `exit_type`: Normal çıkış, tepsiye küçültme, zorla kapatma / çökme.

### 4.3 Listede Olmayan Engelli Sitelerin Keşfi (Anomaliler)
- `domain`: Listelerde yer almayan ancak ISP/DPI tarafından müdahale edilen hedef alan adı.
- `interference_type`:
  - `TCP_RST`: Paket gönderildikten sonra ISP DPI kutusu tarafından RST bayrağı gelmesi.
  - `DNS_SINKHOLE`: Operatör DNS'inin mahkeme/erişim engeli IP'si dönmesi.
  - `TLS_TIMEOUT`: ClientHello sonrası yanıt dönmemesi.
  - `HTTP_451`: Operatör blok sayfası dönmesi.
- `isp`: Kullanıcının internet servis sağlayıcısı (Superonline, TTNET, TurkNet, Vodafone).
- `hit_count`: Bu alan adının kaç farklı oturumda / bilgisayarda engellendiği.

### 4.4 Kullanıcı Davranışları ve Arayüz Metrikleri
- `screen_dwell_times`: Hangi ekranda kaç saniye kalındı (Home, DNS, Settings, Wizard, Diagnostic).
- `feature_clicks`: Hangi butonlar tıklandı (Start, Stop, Secure DNS Toggle, Leak Test, Theme Change).
- `rage_clicks`: Bir butona 2 saniye içinde 3+ kez basılma durumları (donma tespiti).
- `drop_off_points`: Kurulum sihirbazının hangi adımda terk edildiği.
- `traffic_category`: Web (443), Ses/Oyun (Discord/UDP), Medya (Video stream) genel oranları.

### 4.5 Hata ve Sağlık Teşhisi
- `driver_load_error`: WinDivert veya Utun sürücü yükleme başarısızlıkları ve kodları.
- `antivirus_block`: Antivirüs veya Windows Defender engellemesi belirtileri.
- `latency_overhead_ms`: Motor devredeyken eklenen RTT gecikmesi.
- `fastest_doh_provider`: Kullanıcının ISP'sinde en hızlı cevap veren DoH sağlayıcısı.

---

## 5. Veritabanı Şeması (SQLite - WAL)

```sql
-- Cihazlar / Kullanıcı PC'leri
CREATE TABLE IF NOT EXISTS clients (
    client_id TEXT PRIMARY KEY,
    pc_name TEXT NOT NULL,
    os_platform TEXT NOT NULL,
    os_version TEXT,
    cpu_arch TEXT,
    screen_res TEXT,
    app_version TEXT,
    last_ip TEXT,
    country TEXT,
    city TEXT,
    isp TEXT,
    asn TEXT,
    autostart_enabled INTEGER DEFAULT 0,
    total_uptime_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Oturumlar ve Süreler
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(client_id),
    start_time DATETIME NOT NULL,
    last_heartbeat DATETIME NOT NULL,
    end_time DATETIME,
    duration_seconds INTEGER DEFAULT 0,
    engine_active_seconds INTEGER DEFAULT 0,
    hourly_distribution TEXT, -- JSON dizi: [0,0,0,...,1,1,2,...]
    is_autostart INTEGER DEFAULT 0,
    exit_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keşfedilen Engelli Siteler (Anomaliler)
CREATE TABLE IF NOT EXISTS blocked_domain_anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    interference_type TEXT NOT NULL,
    isp TEXT,
    last_client_id TEXT REFERENCES clients(client_id),
    last_pc_name TEXT,
    hit_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'ignored'
    first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(domain, isp, interference_type)
);

-- Zaman Serisi Olay Akışı
CREATE TABLE IF NOT EXISTS telemetry_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL REFERENCES clients(client_id),
    session_id TEXT,
    event_type TEXT NOT NULL, -- 'page_dwell', 'feature_click', 'rage_click', 'driver_error', 'latency'
    screen_name TEXT,
    event_data TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dinamik OTA Kuralları
CREATE TABLE IF NOT EXISTS dynamic_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    rule_type TEXT DEFAULT 'bypass',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Özel Yönetici Dashboard Arayüzü (anticore-dashboard)

Dashboard, Monolith Works kurumsal karanlık teması (`#020617` Void, `#ff642b` Akkor Turuncu, `#00edff` Neon Camgöbeği) ile donatılacaktır:

1. **Ana Bakış (Executive Overview):**
   - Anlık Aktif PC Sayısı, Toplam Kayıtlı Cihaz, Ortalama Günlük Açık Kalma Süresi (Saat), Yeni Keşfedilen Engelli Site Sayısı.
   - Saatlik Kullanıcı Yoğunluğu Isı Haritası (Kullanıcılar en çok hangi saatlerde aktif?).
2. **Cihazlar & Kullanıcılar Tablosu:**
   - PC Adı, IP / Şehir / ISP, İşletim Sistemi, Uygulama Sürümü, Toplam Açık Kalma Süresi, Motor Durumu, Son Görülme Zamanı.
3. **Keşfedilen Engelli Siteler Masası (Anomali Radarı):**
   - Listelerde olmayan sitelerin alan adı, hangi ISS'de engellendiği, müdahale tipi (RST, DNS zehirlenmesi), kaç kullanıcının etkilendiği.
   - **Tek Tıkla Kurala Ekle (Push to Clients):** Tıklandığında kural anında `dynamic_rules` tablosuna girer ve istemciler bir sonraki senkronizasyonda bu siteyi otomatik bypass listesine alır.
4. **Özellik ve Ekran Analitiği (Dwell & Drop-off):**
   - En çok kullanılan ekranlar ve ortalama geçirilen süreler.
   - En çok tıklanan butonlar ve tespit edilen "Rage Click" donma noktaları.
   - Kurulum sihirbazının başarı/terk oranları.
5. **Hata & Güvenlik Akışı (Crash & Driver Logs):**
   - WinDivert sürücü hataları, Defender/Antivirüs blokajları, DNS sızıntısı bildirimleri.

---

## 7. Dizin Yapısı ve Git Yalıtımı

```
anticore-dashboard/                     <-- KESİNLİKLE .gitignore ile korunur
├── server/
│   ├── src/
│   │   ├── api/
│   │   │   ├── beacon.ts               <-- POST /api/v1/telemetry/beacon (ve uzaktan komut yanıtı)
│   │   │   ├── rules.ts                <-- GET /api/v1/telemetry/rules
│   │   │   └── admin.ts                <-- GET/POST /api/v1/admin/* (lock, self_purge, stats)
│   │   ├── db/
│   │   │   ├── database.ts             <-- better-sqlite3 WAL instance
│   │   │   └── schema.sql
│   │   ├── services/
│   │   │   ├── geoip.ts                <-- IP -> Ülke, Şehir, ISP, ASN
│   │   │   └── anomalyDetector.ts      <-- Engelli site gruplama ve alarm
│   │   └── index.ts                    <-- Fastify ana sunucu
│   ├── data/
│   │   └── telemetry.db                <-- SQLite veri dosyası
│   ├── package.json
│   └── tsconfig.json
│
├── client/ (Dashboard UI)
│   ├── src/
│   │   ├── components/                 <-- Metrik kartları, harita, grafikler, anomali masası
│   │   ├── views/
│   │   │   ├── OverviewView.tsx
│   │   │   ├── ClientsView.tsx
│   │   │   ├── AnomaliesView.tsx
│   │   │   └── EventsView.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── package.json (Monorepo / Root scripts: start, dev, build)
```

**Git Yalıtım Kuralı:**
`antikor/.gitignore` ve root `.gitignore` dosyalarına `/anticore-dashboard/` satırı eklenir. Hiçbir telemetri sunucu kodu, veritabanı veya dashboard arayüzü asla GitHub'a sızamaz.

