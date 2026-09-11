# ANTICORE ANDROID MİMARİSİ VE TEKNİK UYGULAMA PLANI

> **DURUM: BEKLEMEDE (STANDBY)**  
> Bu belge gelecekteki Android APK geliştirme süreci için eksiksiz mimari referanstır.  
> Kullanıcı açıkça "Android versiyonunu oluştur" talimatı verene kadar hiçbir kod yazılmaz veya derlenmez.

---

## 1. MİMARİ GENEL BAKIŞ

Windows ortamında WinDivert çekirdek sürücüsü ile sağlanan paket yakalama ve L4/L7 manipülasyon yeteneği, Android platformunda işletim sistemi düzeyinde kök (root) izni gerektirmeden `android.net.VpnService` API'si ve Rust JNI/FFI köprüsü ile gerçekleştirilir.

```
+-------------------------------------------------------------+
|                 Android Arayüzü (UI)                        |
|        Jetpack Compose / Kotlin (Material 3)               |
|  - Durum Paneli (Orb)       - Profil Seçimi (ISP/Universal) |
|  - Bölünmüş Tünel (Per-App) - Telemetri (PPS, Uptime)       |
+-------------------------------------------------------------+
                              |
                              v [AIDL / Local Intent IPC]
+-------------------------------------------------------------+
|                 AnticoreVpnService                          |
|         (Android Foreground Service & TUN)                  |
|  - VpnService.Builder: MTU 1500, Route 0.0.0.0/0, DNS       |
|  - FileDescriptor (tun0 / ParcelFileDescriptor)             |
+-------------------------------------------------------------+
                              |
                              v [JNI FFI Pointer Transfer]
+-------------------------------------------------------------+
|               anticore-android-core (Rust)                  |
|  - Tun2Socks / Direct IP Stack (smoltcp veya lwIP)          |
|  - DPI Evasion Engine (L4/L7 Paket Manipülatörü):           |
|    * Fake Packet with Low TTL (TTL: 3-5)                    |
|    * TLS SNI Fragmentation (2-byte split)                   |
|    * Fake Wrong Checksum / Wrong Seq Insertion              |
|  - DoH Resolver (Cloudflare / Google / Quad9)               |
+-------------------------------------------------------------+
                              |
                              v [Raw Socket / Android Protected Socket]
                      İnternet / Operatör
```

---

## 2. TEMEL BİLEŞENLER VE VERİ AKIŞI

### 2.1. VpnService ve Sanal Ağ Arabirimi (TUN)
- Android OS, uygulamalara ağ düzeyinde paket manipülasyonu iznini `android.net.VpnService` ile sağlar.
- `VpnService.Builder` kullanılarak sanal bir TUN arabirimi oluşturulur (`fd` elde edilir).
- `builder.protect(socket)` çağrısı: Motorun hedef sunuculara veya DoH resolver'lara açtığı ham soketlerin VPN tüneline geri düşüp döngü (loop) yaratması engellenir.

### 2.2. Paket İşleme Katmanı (Rust Çekirdeği - JNI)
- Elde edilen `ParcelFileDescriptor` dosya tanıtıcısı JNI üzerinden doğrudan Rust çalışma ortamına iletilir.
- Rust tarafında `anticore-core` crate'i Android NDK (`aarch64-linux-android`, `armv7-linux-androideabi`, `x86_64-linux-android`) hedefleri için derlenir.
- Gelen her IP/TCP paketi incelenir:
  - **SYN / Handshake:** Standart akış sürdürülür.
  - **TLS ClientHello:** SNI tespit edilir. Eğer hedef liste veya genel kural eşleşirse, TLS SNI 2 parçaya bölünür (Fixed 2 fragmentation) ve araya düşük TTL'li sahte paket enjekte edilir.
  - **HTTP:** Host başlığı manipülasyonu uygulanır (`hoSt:`, host sonuna boşluk, chunked transfer).

### 2.3. Uygulama Bazlı Ayrık Tünelleme (Split Tunneling)
- `builder.addDisallowedApplication(packageName)` veya `builder.addAllowedApplication(packageName)` kullanılarak kullanıcının yalnızca belirli uygulamaları (Discord, X, Telegram vb.) manipülasyon motoruna alması veya bankacılık gibi kritik uygulamaları tünel dışı bırakması sağlanır.

---

## 3. ANDROID SİSTEM GEREKSİNİMLERİ VE İZİNLER

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application>
        <service
            android:name=".service.AnticoreVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:foregroundServiceType="connectedDevice"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

---

## 4. PİL OPTİMİZASYONU VE DOZE MODU
1. **WakeLock Kaçınma:** Sürekli uyanık kalan WakeLock kullanılmaz; paket geldikçe bloklanan epoll/mio tabanlı asenkron I/O döngüsü işletilir.
2. **Ekran Kapalı Güç Tasarrufu:** Ekran kilitlendiğinde (`ACTION_SCREEN_OFF`) işleme tamponları dinamik olarak küçültülür, telemetri yayını durdurulur.
3. **Android 14+ Uyumluluğu:** `FOREGROUND_SERVICE_CONNECTED_DEVICE` tipi bildirim ile sistemin servisi rastgele sonlandırması engellenir.

---

## 5. DERLEME VE YAYINLAMA HEDEFİ
- **Araç Zinciri:** `cargo-ndk` + Android NDK r26b+.
- **Mimari Destekleri:**
  - `arm64-v8a` (Modern telefon ve tabletler - öncelikli)
  - `armeabi-v7a` (Eski cihazlar)
  - `x86_64` (Emülatörler ve Android x86 cihazlar)
- **Paket Çıktısı:** `anticore-vX.Y.Z.apk` (Tekil evrensel veya split APK).

---
*Not: Bu dosya Monolith Works mimari standartlarına göre hazırlanmış olup beklemededir.*
