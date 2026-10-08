// Platform tespiti: Android / iOS / macOS / Windows / Linux

export const isAndroid: boolean = (() => {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  if (uaData?.platform) {
    return uaData.platform.toLowerCase().includes("android");
  }
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua);
})();

export const isMobile: boolean = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return isAndroid || /iPhone|iPad|iPod|Mobile/i.test(ua);
})();

export const isMac: boolean = (() => {
  if (typeof navigator === "undefined") return false;
  if (isAndroid) return false;
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  if (uaData?.platform) {
    return uaData.platform.toLowerCase().includes("mac");
  }
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Mac|iPhone|iPod|iPad/i.test(platform) || /Macintosh|Mac OS X/i.test(ua);
})();

export const isWindows: boolean = (() => {
  if (typeof navigator === "undefined") return true;
  if (isAndroid || isMobile) return false;
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  if (uaData?.platform) {
    return uaData.platform.toLowerCase().includes("win");
  }
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Win/i.test(platform) || /Windows/i.test(ua);
})();
