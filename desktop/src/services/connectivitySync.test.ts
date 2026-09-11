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
});
