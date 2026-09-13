// Platform tespiti: macOS / Windows / Linux

export const isMac: boolean = (() => {
  if (typeof navigator === "undefined") return false;
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
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  if (uaData?.platform) {
    return uaData.platform.toLowerCase().includes("win");
  }
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Win/i.test(platform) || /Windows/i.test(ua);
})();
