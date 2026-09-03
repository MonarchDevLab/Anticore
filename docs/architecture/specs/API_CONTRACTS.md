# API Sözleşmesi: Tauri IPC & Veri Transfer Nesneleri (DTO)

Tüm istemci-sunucu haberleşmesi Tauri v2 IPC köprüsü üzerinden tip korumalı JSON-RPC formatında yürütülür.

## 1. Temel IPC Komutları

| Komut Adı | Parametreler | Dönüş Tipi | Açıklama |
|---|---|---|---|
| `get_status` | Yok | `StatusDto` | Motor çalışma durumu, aktif profil ve telemetri metrikleri |
| `start_motor` | `{ profile: ProfileDto }` | `Result<(), String>` | DPI filtreleme motorunu belirtilen stratejiyle başlatır |
| `stop_motor` | Yok | `Result<(), String>` | Motoru güvenle durdurur ve sürücü kancalarını çözer |
| `check_update` | `{ token?: string }` | `UpdateInfoDto` | En güncel sürümü ve değişiklik listesini sorgular |
| `download_and_install_update` | Yok | `Result<(), String>` | Canlı paket indirir, imzayı doğrular ve uygulamayı yeniden başlatır |
| `get_adapter_dns_info` | Yok | `Vec<AdapterDnsDto>` | Ağ bağdaştırıcılarının DNS ve DoH yapılandırmasını listeler |
| `apply_doh_provider` | `{ provider: String }` | `Result<(), String>` | Seçilen sağlayıcıyı (Cloudflare/Google/AdGuard) işletim sistemine kaydeder |

## 2. Veri Yapıları (Data Transfer Objects)

### StatusDto
```typescript
interface StatusDto {
  is_running: boolean;
  active_profile_name: string;
  uptime_sec: number;
  packets_seen: number;
  packets_bypassed: number;
  packets_passthrough: number;
  current_pps: number;
}
```

### ProfileDto
```typescript
interface ProfileDto {
  name: string;
  description: string;
  steps: StrategyStepDto[];
  scan_depth: number;
}

type StrategyStepDto =
  | { type: 'FakePacketBefore'; ttl: number; payload_hex?: string }
  | { type: 'SniMidSplit'; offset_from_sni: number }
  | { type: 'AutoTtl'; probe_host: string }
  | { type: 'WindowSize'; size: number }
  | { type: 'HttpAbsoluteUri' };
```
