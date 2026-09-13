/**
 * SemVer 2.0 ve 4 parçalı revizyonları (örn. 0.3.1.1) karşılaştırır.
 * Uzak (remote) sürüm yerel (current) sürümden kesinlikle büyükse true döner.
 * Eşit, eski veya geçersiz sürümler için daima false döner.
 */
export function isNewerVersion(current: string, remote: string): boolean {
  if (!remote || !remote.trim()) return false;
  if (!current || !current.trim()) return true;

  const clean = (s: string) => s.trim().replace(/^v+/i, '');
  const parseParts = (s: string): number[] => {
    return clean(s)
      .split(/[-+]/)[0]
      .split('.')
      .map((p) => parseInt(p, 10))
      .filter((n) => !Number.isNaN(n));
  };

  const cParts = parseParts(current);
  const rParts = parseParts(remote);
  const maxLen = Math.max(cParts.length, rParts.length);

  for (let i = 0; i < maxLen; i++) {
    const cp = cParts[i] ?? 0;
    const rp = rParts[i] ?? 0;
    if (rp > cp) return true;
    if (rp < cp) return false;
  }

  return false;
}
