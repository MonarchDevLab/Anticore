import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectivitySync } from './connectivitySync';
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
});
