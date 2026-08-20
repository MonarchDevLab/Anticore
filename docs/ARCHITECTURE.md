# Anticore Mimarisi

## Katmanlar

```
┌─────────────────────────────────────────────┐
│  desktop/ (Tauri v2)      android/ (Faz 5)  │  ← Arayüz katmanı
├─────────────────────────────────────────────┤
│  service.rs: motor yaşam döngüsü + log     │  ← Orkestrasyon
├─────────────────────────────────────────────┤
│  anticore-core: net/tls/strategy/profile    │  ← Platform-bağımsız çekirdek
├─────────────────────────────────────────────┤
│  transport-win (WinDivert FFI)              │  ← Platform transport
│  transport-macos (pf/divert, Faz 4)         │
│  transport-android (tun fd, Faz 5)          │
└─────────────────────────────────────────────┘
```

## Veri Akışı (Windows)

```
Uygulama → TCP SYN → SYN-ACK → İLK VERİ PAKETİ ─┐
                                                 │ WinDivert yakalar
                                                 ▼
                                    blacklist eşleşmesi? ──hayır──► aynen geç
                                                 │ evet
                                                 ▼
                          apply_steps(profile.steps)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 FAKE'ler            REAL segmentler
              (ttl↓ / csum✗)       (ClientHello bölünmüş)
                    │                   │
                    └──── inject ───────┘
                         (sıra: fake önce)
```

Sonraki tüm paketler (TLS devamı, uygulama verisi): passthrough.
Büyük payload koruması (--max-payload muadili, Faz 2): kurulu oturumun
dosya transfer paketleri parse edilmez → CPU sıfıra yakın, hız tam.

## Modül Kuralları
- Core hiçbir transport'u import etmez (derleme bağımlılık yönü yukarı).
- Transport crate'leri platform-cfg'lidir; yanlış platformda compile_error.
- IPC komutları yalnızca service.rs üzerinden motora erişir.
- Log akışı: Tauri event (`log://`) ile frontend'e push edilir; polling yok.
