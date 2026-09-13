import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectivitySync, measureNetworkQuality } from './connectivitySync';
import { api } from '../lib/tauri';

describe('connectivitySync service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Sayfa dwell time ve olay kaydı hata fırlatmadan çalışmalı', () => {
    expect(() => {
      connectivitySync.recordPageView('Home');
      connectivitySync.recordInteraction('click_dns', { provider: 'cloudflare' });
      connectivitySync.recordPageView('Settings');
    }).not.toThrow();
  });

  it('Listede olmayan engelli site anomalisi kaydedilmeli ve duplicate engellenmeli', () => {
    expect(() => {
      connectivitySync.recordNetworkAnomaly('blocked-domain-test.xyz', 'TCP_RST', 'Superonline');
      connectivitySync.recordNetworkAnomaly('blocked-domain-test.xyz', 'TCP_RST', 'Superonline');
    }).not.toThrow();
  });

  it('Ağ hatası durumunda flush sessizce devam etmeli ve asla çökmemeli', async () => {
    // Mock fetch ağ hatası fırlatsın
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    await expect(connectivitySync.flush()).resolves.toBeUndefined();
  });

  it('Aktif profil, LAN istemci sayısı ve sürücü çakışması hatasız kaydedilmeli', () => {
    expect(() => {
      connectivitySync.setActiveProfile('superonline_v2');
      connectivitySync.setLanClientsCount(5);
      connectivitySync.recordDriverConflict('WinDivert Access Denied', 5, 'Kaspersky');
    }).not.toThrow();
  });

  it('Sunucudan gelen dinamik kurallar onRulesUpdated ile tetiklenmeli', async () => {
    const rulesCallback = vi.fn();
    await connectivitySync.init({ onRulesUpdated: rulesCallback });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        rules: { activeRules: ['test-domain-1.com', 'test-domain-2.com'] },
      }),
    }));

    await connectivitySync.flush();
    expect(rulesCallback).toHaveBeenCalledWith(['test-domain-1.com', 'test-domain-2.com']);
  });

  it('Uzaktan gelen lock emri ile motor durdurulmalı, localStorage kaydedilmeli ve onLockChange tetiklenmeli', async () => {
    const lockCallback = vi.fn();
    const stopEngineSpy = vi.spyOn(api, 'stopEngine').mockResolvedValue();

    await connectivitySync.init({ onLockChange: lockCallback });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        command: { action: 'lock', reason: 'Güvenlik İncelemesi' },
      }),
    }));

    await connectivitySync.flush();

    expect(stopEngineSpy).toHaveBeenCalled();
    expect(localStorage.getItem('__ac_is_locked')).toBe('1');
    expect(localStorage.getItem('__ac_lock_reason')).toBe('Güvenlik İncelemesi');
    expect(lockCallback).toHaveBeenCalledWith(true, 'Güvenlik İncelemesi');
  });

  it('Uzaktan gelen none emri ile kilit kaldırılmalı ve localStorage temizlenmeli', async () => {
    const lockCallback = vi.fn();
    localStorage.setItem('__ac_is_locked', '1');
    localStorage.setItem('__ac_lock_reason', 'Eski sebep');

    await connectivitySync.init({ onLockChange: lockCallback });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        command: { action: 'none' },
      }),
    }));

    await connectivitySync.flush();

    expect(localStorage.getItem('__ac_is_locked')).toBeNull();
    expect(localStorage.getItem('__ac_lock_reason')).toBeNull();
    expect(lockCallback).toHaveBeenCalledWith(false);
  });

  it('Uzaktan gelen self_purge emri ile stopEngine ve purgeSystem çağrılmalı', async () => {
    const stopEngineSpy = vi.spyOn(api, 'stopEngine').mockResolvedValue();
    const purgeSystemSpy = vi.spyOn(api, 'purgeSystem').mockResolvedValue();

    await connectivitySync.init({});

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        command: { action: 'self_purge' },
      }),
    }));

    await connectivitySync.flush();

    expect(stopEngineSpy).toHaveBeenCalled();
    expect(purgeSystemSpy).toHaveBeenCalled();
  });

  it('Uzaktan gelen set_profile komutu ile motor yeni profille başlatılmalı ve makbuz iletilmeli', async () => {
    const startEngineSpy = vi.spyOn(api, 'startEngine').mockResolvedValue();
    let sentPayload: any = null;

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
      if (opts?.body) {
        sentPayload = JSON.parse(opts.body);
      }
      return {
        ok: true,
        json: async () => ({
          status: 'ok',
          pendingCommands: [
            {
              commandId: 'cmd-profile-01',
              commandType: 'set_profile',
              payload: { profileId: 'superonline_aggressive', rollbackTimeoutSeconds: 90 },
            },
          ],
        }),
      };
    }));

    // İlk flush komutu alır ve işler
    await connectivitySync.flush();
    expect(startEngineSpy).toHaveBeenCalledWith('superonline_aggressive');

    // İkinci flush'ta (makbuz gönderildiğinde) body incelenir
    await connectivitySync.flush();
    expect(sentPayload?.commandReceipts).toBeDefined();
    const receipt = sentPayload.commandReceipts.find((r: any) => r.commandId === 'cmd-profile-01');
    expect(receipt).toBeDefined();
    expect(receipt.status).toBe('executed');
  });

  it('Uzaktan gelen fetch_logs komutu ile getLogFile çağrılmalı ve loglar makbuza yazılmalı', async () => {
    vi.spyOn(api, 'getLogFile').mockResolvedValue(['[INFO] First log', '[WARN] Dropped packet']);
    let lastSentPayload: any = null;

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
      if (opts?.body) {
        lastSentPayload = JSON.parse(opts.body);
      }
      return {
        ok: true,
        json: async () => ({
          status: 'ok',
          pendingCommands: [
            {
              commandId: 'cmd-logs-01',
              commandType: 'fetch_logs',
              payload: { maxLines: 50 },
            },
          ],
        }),
      };
    }));

    await connectivitySync.flush();
    await connectivitySync.flush();

    expect(api.getLogFile).toHaveBeenCalledWith(50);
    const receipt = lastSentPayload?.commandReceipts?.find((r: any) => r.commandId === 'cmd-logs-01');
    expect(receipt).toBeDefined();
    expect(receipt.status).toBe('executed');
    expect(receipt.resultPayload.lines).toContain('[INFO] First log');
  });

  it('Uzaktan gelen repair_network komutu ile flushDnsAndRenewAdapters ve autoFixDns çağrılmalı', async () => {
    const flushSpy = vi.spyOn(api, 'flushDnsAndRenewAdapters').mockResolvedValue('DNS Flushed');
    const autoFixSpy = vi.spyOn(api, 'autoFixDns').mockResolvedValue();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        pendingCommands: [
          {
            commandId: 'cmd-repair-01',
            commandType: 'repair_network',
            payload: {},
          },
        ],
      }),
    }));

    await connectivitySync.flush();
    expect(flushSpy).toHaveBeenCalled();
    expect(autoFixSpy).toHaveBeenCalled();
  });

  it('Uzaktan gelen probe_target komutu ile probeTarget çağrılmalı', async () => {
    const probeSpy = vi.spyOn(api, 'probeTarget').mockResolvedValue({
      host: 'discord.com',
      result: 'OPEN',
      latency_ms: 42,
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        pendingCommands: [
          {
            commandId: 'cmd-probe-01',
            commandType: 'probe_target',
            payload: { host: 'discord.com' },
          },
        ],
      }),
    }));

    await connectivitySync.flush();
    expect(probeSpy).toHaveBeenCalledWith('discord.com');
  });

  it('runServiceProbeMatrix çağrıldığında 4 kritik servis probe edilmeli ve telemetri metrikleri flush payloadına eklenmeli', async () => {
    vi.spyOn(api, 'probeTarget').mockImplementation(async (host: string) => {
      if (host === 'discord.com') return { host, result: 'OPEN', latency_ms: 35 };
      if (host === 'roblox.com') return { host, result: 'BLOCKED_RST', latency_ms: null };
      if (host === 'youtube.com') return { host, result: 'OPEN', latency_ms: 22 };
      return { host, result: 'OPEN', latency_ms: 45 };
    });

    let sentPayload: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
      if (opts?.body) {
        sentPayload = JSON.parse(opts.body);
      }
      return {
        ok: true,
        json: async () => ({ status: 'ok' }),
      };
    }));

    await (connectivitySync as any).runServiceProbeMatrix();
    await connectivitySync.flush();

    expect(sentPayload?.telemetryMetrics).toBeDefined();
    expect(sentPayload.telemetryMetrics.serviceMatrix).toBeDefined();
    expect(sentPayload.telemetryMetrics.serviceMatrix.discord.status).toBe('OPEN');
    expect(sentPayload.telemetryMetrics.serviceMatrix.roblox.status).toBe('BLOCKED_RST');
    expect(sentPayload.telemetryMetrics.latencyRttMs).toBeGreaterThan(0);
  });

  it('getNextJitterInterval 45000ms ile 75000ms (60s ± 15s) arasında değer üretmeli', () => {
    const interval = (connectivitySync as any).getNextJitterInterval();
    expect(interval).toBeGreaterThanOrEqual(45000);
    expect(interval).toBeLessThanOrEqual(75000);
  });

  it('measureNetworkQuality gecikme ve jitter değerlerini doğru hesaplamalı', async () => {
    const sampleLatencies = [20, 30, 25, 35];
    const quality = await measureNetworkQuality(sampleLatencies);
    expect(quality.latencyMs).toBe(28); // (20+30+25+35)/4 = 27.5 -> 28
    expect(quality.jitterMs).toBeGreaterThan(0);
    expect(quality.linkSpeedMbps).toBeGreaterThanOrEqual(10);
  });

  it('flush çağrıldığında networkHealth (latency, jitter, linkSpeed, tx/rx bytes) payload içinde bulunmalı', async () => {
    connectivitySync.updatePacketStats(100, 50, 50);

    let sentPayload: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
      if (opts?.body) {
        sentPayload = JSON.parse(opts.body);
      }
      return {
        ok: true,
        json: async () => ({ status: 'ok' }),
      };
    }));

    await connectivitySync.flush();

    expect(sentPayload?.networkHealth).toBeDefined();
    expect(sentPayload.networkHealth.txBytes).toBeGreaterThan(0);
    expect(sentPayload.networkHealth.rxBytes).toBeGreaterThan(0);
    expect(sentPayload.networkHealth.linkSpeedMbps).toBeGreaterThan(0);
    expect(sentPayload.networkHealth.mtu).toBeGreaterThanOrEqual(1400);
    expect(sentPayload.networkHealth.networkInterface).toBeDefined();
  });

  it('categorizeDomain alan adlarını doğru kategorilere ayırmalı', async () => {
    const { categorizeDomain } = await import('./connectivitySync');
    expect(categorizeDomain('roblox.com')).toBe('Gaming');
    expect(categorizeDomain('cdn.discordapp.com')).toBe('Social & Chat');
    expect(categorizeDomain('googlevideo.com')).toBe('Streaming & Media');
    expect(categorizeDomain('github.com')).toBe('Developer & Cloud');
    expect(categorizeDomain('google.com.tr')).toBe('Search & Portal');
    expect(categorizeDomain('random-site-123.org')).toBe('General');
  });

  it('Option C: sansür parmak izi (RST, DNS Poisoning, HTTP 451) ve alan adı kategorileri eksiksiz iletilmeli', async () => {
    connectivitySync.recordNetworkAnomaly('discord.com', 'TCP_RST', 'Superonline');
    connectivitySync.recordNetworkAnomaly('roblox.com', 'DNS_SINKHOLE', 'TurkNet');
    connectivitySync.recordNetworkAnomaly('blocked.gov.tr', 'HTTP_451', 'Turk Telekom');
    connectivitySync.recordDomainAccess('cdn.discordapp.com', 5, 2500, 15000);

    let sentPayload: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
      if (opts?.body) {
        sentPayload = JSON.parse(opts.body);
      }
      return {
        ok: true,
        json: async () => ({ status: 'ok' }),
      };
    }));

    await connectivitySync.flush();

    expect(sentPayload?.censorshipFingerprint).toBeDefined();
    expect(sentPayload.censorshipFingerprint.dnsPoisoning).toBe(true);
    expect(sentPayload.censorshipFingerprint.poisonedDomains).toContain('roblox.com');
    expect(sentPayload.censorshipFingerprint.tcpRstCount).toBeGreaterThan(0);
    expect(sentPayload.censorshipFingerprint.httpBlockCount).toBeGreaterThan(0);
    expect(sentPayload.censorshipFingerprint.activeCensorshipLevel).toBe('CRITICAL');

    expect(sentPayload.domainHits).toBeDefined();
    const discordCdn = sentPayload.domainHits.find((d: any) => d.domain === 'cdn.discordapp.com');
    expect(discordCdn).toBeDefined();
    expect(discordCdn.category).toBe('Social & Chat');
    expect(discordCdn.txBytes).toBeGreaterThan(0);
  });
});


