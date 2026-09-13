import { describe, it, expect } from 'vitest';
import { isNewerVersion } from './version';

describe('isNewerVersion SemVer Comparison', () => {
  it('Eski sürümler için false dönmeli (downgrade koruması)', () => {
    // Kullanıcının yaşadığı v0.3.4 iken v0.3.3 uyarısı gelmesi durumu
    expect(isNewerVersion('0.3.4', '0.3.3')).toBe(false);
    expect(isNewerVersion('0.3.4', 'v0.3.3')).toBe(false);
    expect(isNewerVersion('v0.3.4', 'v0.3.3')).toBe(false);
    expect(isNewerVersion('1.0.0', '0.9.9')).toBe(false);
    expect(isNewerVersion('0.4.0', '0.3.9')).toBe(false);
  });

  it('Aynı sürüm için false dönmeli (mükerrer güncelleme koruması)', () => {
    expect(isNewerVersion('0.3.4', '0.3.4')).toBe(false);
    expect(isNewerVersion('0.3.4', 'v0.3.4')).toBe(false);
    expect(isNewerVersion('v0.3.4', '0.3.4')).toBe(false);
    expect(isNewerVersion('v0.3.4', 'v0.3.4')).toBe(false);
    expect(isNewerVersion('0.3.1.1', '0.3.1.1')).toBe(false);
    expect(isNewerVersion('0.3.4', '0.3.4 (Revizyon)')).toBe(false);
    expect(isNewerVersion('0.3.4 (Revizyon)', '0.3.4')).toBe(false);
    expect(isNewerVersion('v0.3.4', 'v0.3.4 (Revizyon)')).toBe(false);
  });

  it('Daha yeni sürümler için true dönmeli', () => {
    expect(isNewerVersion('0.3.3', '0.3.4')).toBe(true);
    expect(isNewerVersion('0.3.3', 'v0.3.4')).toBe(true);
    expect(isNewerVersion('0.3.4', '0.3.5')).toBe(true);
    expect(isNewerVersion('0.3.4', '0.4.0')).toBe(true);
    expect(isNewerVersion('0.3.4', '1.0.0')).toBe(true);
    expect(isNewerVersion('0.3.1.1', '0.3.1.2')).toBe(true);
    expect(isNewerVersion('0.3.1.2', '0.3.2')).toBe(true);
  });

  it('Geçersiz veya boş sürümlerde güvenli davranmalı', () => {
    expect(isNewerVersion('0.3.4', '')).toBe(false);
    expect(isNewerVersion('0.3.4', 'invalid')).toBe(false);
    expect(isNewerVersion('', '0.3.4')).toBe(true);
  });
});
