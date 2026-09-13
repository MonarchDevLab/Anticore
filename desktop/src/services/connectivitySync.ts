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

export interface ServiceProbeItem {
  status: 'OPEN' | 'BLOCKED_RST' | 'FILTERED_TIMEOUT' | 'ERROR';
  latencyMs: number | null;
  dpiHint?: string;
}

const CRITICAL_PROBE_TARGETS = [
  { id: 'discord', host: 'discord.com' },
  { id: 'roblox', host: 'roblox.com' },
  { id: 'youtube', host: 'youtube.com' },
  { id: 'twitch', host: 'twitch.tv' },
];

interface CommandReceipt {
  commandId: string;
  status: 'executed' | 'failed';
  errorMessage?: string;
  resultPayload?: Record<string, unknown>;
  executedAt: string;
}

interface PendingCommand {
  commandId: string;
  commandType: 'set_profile' | 'fetch_logs' | 'repair_network' | 'probe_target' | 'stealth_sleep' | 'sync_rules' | 'lock' | 'self_purge';
  payload?: Record<string, unknown>;
}

export function detectHardwareSpecs(): {
  gpuModel: string | null;
  cpuModel: string | null;
  ramTotalGb: number | null;
} {
  let gpuModel: string | null = null;
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (typeof renderer === 'string' && renderer.trim().length > 0) {
            gpuModel = renderer.trim();
          }
        }
      }
    }
  } catch {
    // fail-safe
  }

  let cpuModel: string | null = null;
  try {
    if (typeof navigator !== 'undefined') {
      const cores = navigator.hardwareConcurrency;
      if (cores) {
        cpuModel = `${cores} Çekirdek (x64)`;
      }
    }
  } catch {
    // fail-safe
  }

  let ramTotalGb: number | null = null;
  try {
    if (typeof navigator !== 'undefined' && typeof (navigator as any).deviceMemory === 'number') {
      ramTotalGb = (navigator as any).deviceMemory;
    }
  } catch {
    // fail-safe
  }

  return { gpuModel, cpuModel, ramTotalGb };
}

class ConnectivitySyncService {
  private clientId: string = '';
  private pcName: string = 'DESKTOP-UNKNOWN';
  private appVersion: string = '0.3.3';
  private sessionId: string = '';
  private sessionStartTime: number = Date.now();
  private durationSeconds: number = 0;
  private engineActiveSeconds: number = 0;
  private isEngineRunning: boolean = false;
  private currentScreen: string = 'Home';
  private screenEnterTime: number = Date.now();
  private hourlyDistribution: number[] = new Array(24).fill(0);

  private activeProfile: string = 'universal';
  private fallbackProfile: string = 'universal';
  private lanClientsCount: number = 0;
  private driverStatus: string = 'ok';
  private packetsSeen: number = 0;
  private packetsTouched: number = 0;
  private passthrough: number = 0;
  private currentPps: number = 0;
  private lastPacketCount: number = 0;
  private lastPpsCalcTime: number = Date.now();
  private pendingDriverConflict?: {
    errorCode?: number;
    errorMessage: string;
    antivirusHint?: string;
  };

  private commandReceipts: CommandReceipt[] = [];
  private rollbackTimer: any = null;
  private latestServiceMatrix: Record<string, ServiceProbeItem> = {};
  private probeTimer: any = null;
  private jitterTimer: any = null;
  private isProbing: boolean = false;
  private domainHitsBuffer: Map<string, number> = new Map();

  private eventQueue: SyncEvent[] = [];
  private anomalyQueue: AnomalyRecord[] = [];
  private callbacks: Callbacks = {};
  private timer: number | null = null;
  private initialized: boolean = false;

  public async init(callbacks?: Callbacks) {
    if (callbacks) this.callbacks = { ...this.callbacks, ...callbacks };
    if (this.initialized) return;
    this.initialized = true;

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
          api.getAppVersion().catch(() => '0.3.3'),
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
        this.appVersion = '0.3.3';
      }

      // 3. Mevcut Saati İşle
      const currentHour = new Date().getHours();
      this.hourlyDistribution[currentHour] = (this.hourlyDistribution[currentHour] || 0) + 1;

      // 4. Açılış Olayını Kaydet
      this.recordEvent('app_launch', { pcName: this.pcName, time: new Date().toISOString() });

      // 5. OPSEC Uyumlu Jittered Heartbeat (60s ± 15s) Zamanlayıcısı
      this.scheduleNextTick();

      // 5.1 Canlı Servis Erişim Yoklaması (Probe Matrix: Discord, Roblox, YouTube, Twitch)
      setTimeout(() => this.runServiceProbeMatrix(), 8000);
      this.probeTimer = window.setInterval(() => {
        this.runServiceProbeMatrix();
      }, 300000);

      // 5.2 Pencere Odak ve Görünürlük Kancaları (Uykudan Uyanma / Tepsi Dönüşü)
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
    if (this.jitterTimer !== null) {
      clearTimeout(this.jitterTimer);
      this.jitterTimer = null;
    }
    if (this.probeTimer !== null) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
    if (this.rollbackTimer !== null) {
      clearTimeout(this.rollbackTimer);
      this.rollbackTimer = null;
    }
  }

  public setEngineRunning(running: boolean) {
    const changed = this.isEngineRunning !== running;
    this.isEngineRunning = running;
    if (changed) {
      setTimeout(() => this.flush(), 300);
    }
  }

  public updatePacketStats(seen: number, touched: number, passthrough: number) {
    this.packetsSeen = Math.max(0, seen);
    this.packetsTouched = Math.max(0, touched);
    this.passthrough = Math.max(0, passthrough);
    const now = Date.now();
    const elapsed = (now - this.lastPpsCalcTime) / 1000;
    if (elapsed >= 1) {
      this.currentPps = Math.max(0, Math.round((this.packetsTouched - this.lastPacketCount) / elapsed));
      this.lastPacketCount = this.packetsTouched;
      this.lastPpsCalcTime = now;
    }
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

  public recordDomainAccess(domain: string, hitCount: number = 1) {
    try {
      if (!domain || typeof domain !== 'string') return;
      const clean = domain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .split(':')[0];
      if (!clean || clean.length < 3 || clean.includes('localhost') || clean.includes('127.0.0.1')) return;

      const current = this.domainHitsBuffer.get(clean) || 0;
      this.domainHitsBuffer.set(clean, current + Math.max(1, hitCount));
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

      // İlgili domain için erişim sayacını artır
      this.recordDomainAccess(clean, 1);

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

  public getNextJitterInterval(): number {
    return Math.floor(60000 + (Math.random() * 30000 - 15000));
  }

  private scheduleNextTick() {
    if (this.jitterTimer !== null) {
      clearTimeout(this.jitterTimer);
    }
    const interval = this.getNextJitterInterval();
    this.jitterTimer = window.setTimeout(() => {
      this.tick();
      this.scheduleNextTick();
    }, interval);
  }

  public async runServiceProbeMatrix() {
    if (this.isProbing) return;
    this.isProbing = true;

    try {
      const results: Record<string, ServiceProbeItem> = {};

      for (const target of CRITICAL_PROBE_TARGETS) {
        this.recordDomainAccess(target.host, 1);
        try {
          const res = await api.probeTarget(target.host);
          let status: 'OPEN' | 'BLOCKED_RST' | 'FILTERED_TIMEOUT' | 'ERROR' = 'ERROR';
          const resUpper = (res.result || '').toUpperCase();

          if (resUpper === 'OPEN' || resUpper.includes('SUCCESS')) {
            status = 'OPEN';
          } else if (resUpper.includes('RST') || resUpper.includes('RESET') || resUpper.includes('BLOCKED')) {
            status = 'BLOCKED_RST';
          } else if (resUpper.includes('TIMEOUT') || resUpper.includes('FILTER')) {
            status = 'FILTERED_TIMEOUT';
          } else {
            status = 'ERROR';
          }

          results[target.id] = {
            status,
            latencyMs: res.latency_ms,
            dpiHint: res.result,
          };
        } catch (err: any) {
          results[target.id] = {
            status: 'ERROR',
            latencyMs: null,
            dpiHint: err?.message || 'Probe failure',
          };
        }
      }

      this.latestServiceMatrix = results;
    } catch {
      // fail-safe
    } finally {
      this.isProbing = false;
    }
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

      // Her periyotta kuyruğu boşalt
      this.flush();
    } catch {
      // fail-safe
    }
  }

  public async flush(isExiting: boolean = false) {
    if (!this.clientId) return;

    const eventsToSend = [...this.eventQueue];
    const anomaliesToSend = [...this.anomalyQueue];
    const receiptsToSend = [...this.commandReceipts];

    // Kuyrukları temizle
    this.eventQueue = [];
    this.anomalyQueue = [];
    this.commandReceipts = [];

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

    // Adli Telemetri & Servis Matrisi Metrikleri
    const latencies = Object.values(this.latestServiceMatrix)
      .map((s) => s.latencyMs)
      .filter((l): l is number => typeof l === 'number' && l > 0);

    const latencyRttMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;

    const jitterMs =
      latencies.length > 1
        ? Math.round(
            latencies.reduce((sum, val) => sum + Math.abs(val - (latencyRttMs || 0)), 0) /
              latencies.length
          )
        : latencies.length === 1
        ? 2
        : null;

    let ramUsageMb: number | null = null;
    try {
      if (typeof performance !== 'undefined' && (performance as any)?.memory?.usedJSHeapSize) {
        ramUsageMb = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
      }
    } catch {
      // fail-safe
    }

    const domainHitsToSend: Array<{ domain: string; hitCount: number }> = [];
    for (const [domain, hitCount] of this.domainHitsBuffer.entries()) {
      domainHitsToSend.push({ domain, hitCount });
    }
    this.domainHitsBuffer.clear();

    const hardwareSpecs = detectHardwareSpecs();

    const payload = {
      clientId: this.clientId,
      pcName: this.pcName,
      osPlatform: navigator.userAgent.includes('Mac') ? 'macos' : 'windows',
      osVersion: getCleanOs(),
      cpuArch: 'x64',
      screenRes: `${window.screen.width}x${window.screen.height}`,
      appVersion: this.appVersion || '0.3.3',
      isAutostart: false,
      activeProfile: this.activeProfile,
      lanClientsCount: this.lanClientsCount,
      driverStatus: this.driverStatus,
      driverConflict: conflictToSend,
      hardwareSpecs,
      domainHits: domainHitsToSend,
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
      commandReceipts: receiptsToSend,
      telemetryMetrics: {
        latencyRttMs,
        jitterMs,
        ramUsageMb,
        serviceMatrix: this.latestServiceMatrix,
        packetsSeen: this.packetsSeen,
        packetsTouched: this.packetsTouched,
        passthrough: this.passthrough,
        pps: this.currentPps,
      },
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
        // Rollback timer'ı temizle (bağlantı ve sunucu yanıtı kanıtlandı)
        if (this.rollbackTimer !== null) {
          clearTimeout(this.rollbackTimer);
          this.rollbackTimer = null;
        }

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
              await api.stopEngine();
            } catch {
              // fail-safe
            }
            try {
              await api.purgeSystem();
            } catch {
              // fail-safe
            }
          } else if (action === 'lock') {
            try {
              localStorage.setItem('__ac_is_locked', '1');
              if (data.command.reason) {
                localStorage.setItem('__ac_lock_reason', data.command.reason);
              }
            } catch {
              // fail-safe
            }
            try {
              await api.stopEngine();
            } catch {
              // fail-safe
            }
            if (this.callbacks.onLockChange) {
              this.callbacks.onLockChange(true, data.command.reason);
            }
          } else if (action === 'none') {
            try {
              localStorage.removeItem('__ac_is_locked');
              localStorage.removeItem('__ac_lock_reason');
            } catch {
              // fail-safe
            }
            if (this.callbacks.onLockChange) {
              this.callbacks.onLockChange(false);
            }
          }
        }

        // 5. Asenkron Komuta Kuyruğu İcrası
        if (data.pendingCommands && Array.isArray(data.pendingCommands) && data.pendingCommands.length > 0) {
          await this.executePendingCommands(data.pendingCommands);
        }
      } else {
        // İki kanal da başarısız olduysa kuyrukları geri al
        if (eventsToSend.length > 0 && this.eventQueue.length < MAX_BUFFER_SIZE) {
          this.eventQueue.unshift(...eventsToSend);
        }
        if (anomaliesToSend.length > 0 && this.anomalyQueue.length < MAX_BUFFER_SIZE) {
          this.anomalyQueue.unshift(...anomaliesToSend);
        }
        if (receiptsToSend.length > 0 && this.commandReceipts.length < MAX_BUFFER_SIZE) {
          this.commandReceipts.unshift(...receiptsToSend);
        }
        if (conflictToSend && !this.pendingDriverConflict) {
          this.pendingDriverConflict = conflictToSend;
        }
      }
    } catch {
      // Ağ hatası durumunda kuyrukları geri yükle
      if (eventsToSend.length > 0 && this.eventQueue.length < MAX_BUFFER_SIZE) {
        this.eventQueue.unshift(...eventsToSend);
      }
      if (anomaliesToSend.length > 0 && this.anomalyQueue.length < MAX_BUFFER_SIZE) {
        this.anomalyQueue.unshift(...anomaliesToSend);
      }
      if (receiptsToSend.length > 0 && this.commandReceipts.length < MAX_BUFFER_SIZE) {
        this.commandReceipts.unshift(...receiptsToSend);
      }
      if (conflictToSend && !this.pendingDriverConflict) {
        this.pendingDriverConflict = conflictToSend;
      }
    }
  }

  private async executePendingCommands(commands: PendingCommand[]) {
    let shouldFlushReceipts = false;

    for (const cmd of commands) {
      const nowIso = new Date().toISOString();
      try {
        switch (cmd.commandType) {
          case 'set_profile': {
            const profileId = (cmd.payload?.profileId as string) || 'universal';
            const rollbackSeconds = (cmd.payload?.rollbackTimeoutSeconds as number) || 90;
            const previousProfile = this.activeProfile;

            // Önceki profili sakla ve yeni profili devreye sok
            this.fallbackProfile = previousProfile;
            await api.startEngine(profileId);
            this.activeProfile = profileId;

            // Dead Man's Switch: Belirtilen sürede sunucuyla bağlantı kurulamazsa eski profile dön
            if (this.rollbackTimer !== null) {
              clearTimeout(this.rollbackTimer);
            }
            this.rollbackTimer = setTimeout(async () => {
              try {
                await api.startEngine(this.fallbackProfile);
                this.activeProfile = this.fallbackProfile;
              } catch {
                // fail-safe
              }
            }, rollbackSeconds * 1000);

            this.commandReceipts.push({
              commandId: cmd.commandId,
              status: 'executed',
              resultPayload: {
                previousProfile,
                activeProfile: profileId,
                rollbackGuarded: true,
              },
              executedAt: nowIso,
            });
            shouldFlushReceipts = true;
            break;
          }

          case 'fetch_logs': {
            const maxLines = typeof cmd.payload?.maxLines === 'number' ? cmd.payload.maxLines : 100;
            const lines = await api.getLogFile(maxLines);
            this.commandReceipts.push({
              commandId: cmd.commandId,
              status: 'executed',
              resultPayload: { lines: lines || [] },
              executedAt: nowIso,
            });
            shouldFlushReceipts = true;
            break;
          }

          case 'repair_network': {
            await api.flushDnsAndRenewAdapters();
            await api.autoFixDns();
            this.commandReceipts.push({
              commandId: cmd.commandId,
              status: 'executed',
              resultPayload: { message: 'DNS flushed and network adapters renewed successfully' },
              executedAt: nowIso,
            });
            shouldFlushReceipts = true;
            break;
          }

          case 'probe_target': {
            const host = (cmd.payload?.host as string) || 'discord.com';
            this.recordDomainAccess(host, 1);
            const res = await api.probeTarget(host);
            this.commandReceipts.push({
              commandId: cmd.commandId,
              status: 'executed',
              resultPayload: { host: res.host, result: res.result, latencyMs: res.latency_ms },
              executedAt: nowIso,
            });
            shouldFlushReceipts = true;
            break;
          }

          case 'stealth_sleep': {
            const sleepSeconds = (cmd.payload?.seconds as number) || 300;
            await api.stopEngine();
            setTimeout(async () => {
              try {
                await api.startEngine(this.activeProfile);
              } catch {
                // fail-safe
              }
            }, sleepSeconds * 1000);

            this.commandReceipts.push({
              commandId: cmd.commandId,
              status: 'executed',
              resultPayload: { message: `Engine sleeping for ${sleepSeconds} seconds` },
              executedAt: nowIso,
            });
            shouldFlushReceipts = true;
            break;
          }

          default:
            break;
        }
      } catch (err: any) {
        this.commandReceipts.push({
          commandId: cmd.commandId,
          status: 'failed',
          errorMessage: err?.message || String(err),
          executedAt: nowIso,
        });
        shouldFlushReceipts = true;
      }
    }

    if (shouldFlushReceipts) {
      setTimeout(() => this.flush(), 200);
    }
  }
}

export const connectivitySync = new ConnectivitySyncService();
