/**
 * Connectivity & Health Diagnostics Service (Stealth Telemetry)
 * Geliştirici hata teşhisi, sahadaki ağ filtreleri analizi ve oturum yönetimi.
 * Asla kullanıcı arayüzünü engellemez, hata fırlatmaz (fail-safe).
 */

import { api } from '../lib/tauri';

// Yapılandırma
const INGEST_ENDPOINT =
  (typeof window !== 'undefined' && (window as any).__ANTICORE_INGEST_URL__) ||
  'https://anticore.monolithworks.com.tr/api/v1/telemetry/beacon';
const INGEST_KEY = 'anticore-stealth-key-2026';
const MAX_BUFFER_SIZE = 100;

interface SyncEvent {
  eventType: string;
  screenName?: string;
  eventData: Record<string, unknown>;
  timestamp: string;
}

interface AnomalyRecord {
  domain: string;
  interferenceType: 'TCP_RST' | 'DNS_SINKHOLE' | 'TIMEOUT' | 'HTTP_451';
  isp?: string;
}

interface Callbacks {
  onMaintenanceChange?: (active: boolean, title?: string, message?: string) => void;
  onLockChange?: (locked: boolean, reason?: string) => void;
  onUpdateBroadcast?: (update: {
    version: string;
    mandatory: boolean;
    title: string;
    message: string;
    downloadUrl: string;
  }) => void;
  onRulesUpdated?: (activeRules: string[]) => void;
}

class ConnectivitySyncService {
  private clientId: string = '';
  private pcName: string = 'DESKTOP-UNKNOWN';
  private appVersion: string = '0.3.2';
  private sessionId: string = '';
  private sessionStartTime: number = Date.now();
  private durationSeconds: number = 0;
  private engineActiveSeconds: number = 0;
  private isEngineRunning: boolean = false;
  private currentScreen: string = 'Home';
  private screenEnterTime: number = Date.now();
  private hourlyDistribution: number[] = new Array(24).fill(0);

  private activeProfile: string = 'universal';
  private lanClientsCount: number = 0;
  private driverStatus: string = 'ok';
  private pendingDriverConflict?: {
    errorCode?: number;
    errorMessage: string;
    antivirusHint?: string;
  };

  private eventQueue: SyncEvent[] = [];
  private anomalyQueue: AnomalyRecord[] = [];
  private callbacks: Callbacks = {};
  private timer: number | null = null;
  private initialized: boolean = false;

  public async init(callbacks?: Callbacks) {
    if (this.initialized) return;
    this.initialized = true;
    if (callbacks) this.callbacks = callbacks;

    try {
      // 1. Kalıcı Client ID Al veya Üret
      let cid = localStorage.getItem('__ac_sync_cid');
      if (!cid) {
        cid = 'ac-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
        localStorage.setItem('__ac_sync_cid', cid);
      }
      this.clientId = cid;
      this.sessionId = 'ses-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);

      // 2. PC Adını (Hostname) ve Sürümü Tauri Arka Ucundan Al
      try {
        const [hostname, version] = await Promise.all([
          api.getSystemHostname().catch(() => 'DESKTOP-LOCAL'),
          api.getAppVersion().catch(() => '0.3.2'),
        ]);
        if (hostname && hostname.trim().length > 0) {
          this.pcName = hostname.trim();
        }
        if (version && version.trim().length > 0) {
          this.appVersion = version.trim();
        }
      } catch {
        // Fallback: Web / Mock ortamı
        this.pcName = 'DESKTOP-LOCAL';
        this.appVersion = '0.3.2';
      }

      // 3. Mevcut Saati İşle
      const currentHour = new Date().getHours();
      this.hourlyDistribution[currentHour] = (this.hourlyDistribution[currentHour] || 0) + 1;

      // 4. Açılış Olayını Kaydet
      this.recordEvent('app_launch', { pcName: this.pcName, time: new Date().toISOString() });

      // 5. 60 Saniyelik Periyodik Heartbeat & Flush Zamanlayıcısı
      this.timer = window.setInterval(() => {
        this.tick();
      }, 60000);

      // 5.1 Pencere Odak ve Görünürlük Kancaları (Uykudan Uyanma / Tepsi Dönüşü)
      window.addEventListener('focus', () => {
        this.tick();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.tick();
        }
      });

      // 6. Pencere Kapanışında Sessiz Flush
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // İlk senkronizasyon (açılış durumunu hemen bildirir)
      setTimeout(() => this.flush(), 500);
      setTimeout(() => this.flush(), 2500);
    } catch {
      // Fail-safe: hiçbir şekilde çökme yapmaz
    }
  }

  public destroy() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public setEngineRunning(running: boolean) {
    this.isEngineRunning = running;
  }

  public setActiveProfile(profile: string) {
    if (profile && profile.trim().length > 0) {
      this.activeProfile = profile.trim();
    }
  }

  public setLanClientsCount(count: number) {
    this.lanClientsCount = Math.max(0, count);
  }

  public setDriverStatus(status: string) {
    this.driverStatus = status;
  }

  public recordDriverConflict(errorMessage: string, errorCode?: number, antivirusHint?: string) {
    try {
      this.driverStatus = 'conflict';
      this.pendingDriverConflict = {
        errorCode,
        errorMessage,
        antivirusHint,
      };
      this.recordEvent('driver_conflict', { errorCode, errorMessage, antivirusHint });
      // Sürücü hatasını acil bildirmek için flush tetikle
      setTimeout(() => this.flush(), 500);
    } catch {
      // fail-safe
    }
  }

  public recordPageView(screenName: string) {
    try {
      const now = Date.now();
      const dwellSeconds = Math.round((now - this.screenEnterTime) / 1000);

      if (dwellSeconds > 1 && this.currentScreen) {
        this.recordEvent('page_dwell', {
          screen: this.currentScreen,
          dwellSeconds,
        });
      }

      this.currentScreen = screenName;
      this.screenEnterTime = now;
    } catch {
      // fail-safe
    }
  }

  public recordInteraction(action: string, data: Record<string, unknown> = {}) {
    try {
      this.recordEvent('feature_click', { action, ...data });
    } catch {
      // fail-safe
    }
  }

  public recordNetworkAnomaly(
    domain: string,
    interferenceType: 'TCP_RST' | 'DNS_SINKHOLE' | 'TIMEOUT' | 'HTTP_451' = 'TCP_RST',
    isp?: string
  ) {
    try {
      if (!domain || domain.trim().length === 0) return;
      const clean = domain.trim().toLowerCase();

      // Zaten kuyrukta varsa tekrar ekleme
      if (this.anomalyQueue.some(a => a.domain === clean && a.interferenceType === interferenceType)) {
        return;
      }

      if (this.anomalyQueue.length >= MAX_BUFFER_SIZE) {
        this.anomalyQueue.shift();
      }

      this.anomalyQueue.push({
        domain: clean,
        interferenceType,
        isp,
      });

      // Anomali tespitinde hızlı bildirim için tetikle
      setTimeout(() => this.flush(), 1000);
    } catch {
      // fail-safe
    }
  }

  private recordEvent(eventType: string, eventData: Record<string, unknown> = {}) {
    if (this.eventQueue.length >= MAX_BUFFER_SIZE) {
      this.eventQueue.shift();
    }
    this.eventQueue.push({
      eventType,
      screenName: this.currentScreen,
      eventData,
      timestamp: new Date().toISOString(),
    });
  }

  private tick() {
    try {
      const now = Date.now();
      const realDuration = Math.max(0, Math.round((now - this.sessionStartTime) / 1000));
      const delta = realDuration - this.durationSeconds;
      this.durationSeconds = realDuration;
      if (this.isEngineRunning && delta > 0) {
        this.engineActiveSeconds += delta;
      }

      const currentHour = new Date().getHours();
      this.hourlyDistribution[currentHour] = (this.hourlyDistribution[currentHour] || 0) + 1;

      // Her 60 saniyede bir kuyruğu boşalt
      this.flush();
    } catch {
      // fail-safe
    }
  }

  public async flush(isExiting: boolean = false) {
    if (!this.clientId) return;

    const eventsToSend = [...this.eventQueue];
    const anomaliesToSend = [...this.anomalyQueue];

    // Kuyrukları temizle
    this.eventQueue = [];
    this.anomalyQueue = [];

    const conflictToSend = this.pendingDriverConflict;
    this.pendingDriverConflict = undefined;

    const getCleanOs = () => {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
      if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
      if (ua.includes('Windows NT 6.1')) return 'Windows 7';
      if (ua.includes('Mac OS X')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      return 'Windows';
    };

    const payload = {
      clientId: this.clientId,
      pcName: this.pcName,
      osPlatform: navigator.userAgent.includes('Mac') ? 'macos' : 'windows',
      osVersion: getCleanOs(),
      cpuArch: 'x64',
      screenRes: `${window.screen.width}x${window.screen.height}`,
      appVersion: this.appVersion || '0.3.2',
      isAutostart: false,
      activeProfile: this.activeProfile,
      lanClientsCount: this.lanClientsCount,
      driverStatus: this.driverStatus,
      driverConflict: conflictToSend,
      session: {
        sessionId: this.sessionId,
        startTime: new Date(this.sessionStartTime).toISOString(),
        durationSeconds: this.durationSeconds,
        engineActiveSeconds: this.engineActiveSeconds,
        hourlyDistribution: this.hourlyDistribution,
        exitReason: isExiting ? 'normal_exit' : undefined,
      },
      events: eventsToSend,
      anomalies: anomaliesToSend,
    };

    try {
      let data: any = null;

      // 1. Webview fetch denemesi (keepalive yalnızca pencere kapanırken aktif)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(INGEST_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Anticore-Ingest-Key': INGEST_KEY,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          keepalive: isExiting,
        });

        clearTimeout(timeout);

        if (response.ok) {
          data = await response.json();
        }
      } catch {
        // Webview fetch kısıtlandıysa veya CORS/Loopback engeline takıldıysa
      }

      // 2. Doğrudan Yerel Rust IPC Köprüsü (ureq ile sıfır CORS, tam güvenilirlik)
      if (!data) {
        try {
          const raw = await api.sendTelemetryBeacon(JSON.stringify(payload), INGEST_ENDPOINT);
          if (raw) {
            data = JSON.parse(raw);
          }
        } catch {
          // İki kanal da başarısız olursa sessizce tamponu koru
        }
      }

      if (data) {
        // 1. Küresel Bakım Modu Kontrolü
        if (data.maintenance && typeof data.maintenance.active === 'boolean') {
          if (this.callbacks.onMaintenanceChange) {
            this.callbacks.onMaintenanceChange(
              data.maintenance.active,
              data.maintenance.title,
              data.maintenance.message
            );
          }
        }

        // 2. Güncelleme Bildirimi Kontrolü
        if (data.update && data.update.available) {
          if (this.callbacks.onUpdateBroadcast) {
            this.callbacks.onUpdateBroadcast(data.update);
          }
        }

        // 3. Dinamik Kural Senkronizasyonu (Sıfır-Dokunuş Bypass)
        if (data.rules && Array.isArray(data.rules.activeRules)) {
          if (this.callbacks.onRulesUpdated) {
            this.callbacks.onRulesUpdated(data.rules.activeRules);
          }
        }

        // 4. Uzaktan Acil Durum Yönetimi
        if (data.command && data.command.action) {
          const action = data.command.action;
          if (action === 'self_purge') {
            try {
              await api.purgeSystem();
            } catch {
              // fail-safe
            }
          } else if (action === 'lock') {
            try {
              await api.detachedStop();
            } catch {
              // fail-safe
            }
            if (this.callbacks.onLockChange) {
              this.callbacks.onLockChange(true, data.command.reason);
            }
          } else if (action === 'none') {
            if (this.callbacks.onLockChange) {
              this.callbacks.onLockChange(false);
            }
          }
        }
      } else {
        // İki kanal da başarısız olduysa kuyruktaki anomalileri geri al
        if (anomaliesToSend.length > 0 && this.anomalyQueue.length < MAX_BUFFER_SIZE) {
          this.anomalyQueue.unshift(...anomaliesToSend);
        }
      }
    } catch {
      // Ağ hatası durumunda anomalileri geri yükle
      if (anomaliesToSend.length > 0 && this.anomalyQueue.length < MAX_BUFFER_SIZE) {
        this.anomalyQueue.unshift(...anomaliesToSend);
      }
    }
  }
}

export const connectivitySync = new ConnectivitySyncService();
