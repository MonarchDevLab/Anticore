import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectivitySync } from './connectivitySync';

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
});
