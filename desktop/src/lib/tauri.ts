// Tauri IPC köprüsü: tipli komutlar + event abonelikleri.

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { check as checkPluginUpdate } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface Status {
  running: boolean;
  profile_id: string;
  packets_seen: number;
  packets_touched: number;
  passthrough: number;
  uptime_sec: number;
}

export type StepDto =
  | { type: "fragment_tls"; mode: "sni_mid" | "sni_mid_reverse" | "fixed" | "reverse"; value: number | null }
  | { type: "fragment_http" }
  | { type: "fake_ttl"; ttl: number }
  | { type: "auto_ttl"; base: number; tolerance: number }
  | { type: "multi_split"; positions: number[] }
  | { type: "fake_from_hex"; hex: string }
  | { type: "fake_wrong_seq" }
  | { type: "fake_wrong_checksum" }
  | { type: "host_case" }
  | { type: "host_space" }
  | { type: "oob"; offset: number; payload: number }
  | { type: "window_size"; size: number }
  | { type: "http_method_case" }
  | { type: "http_absolute_uri" }
  | { type: "http_lf" };

export interface Profile {
  id: string;
  name: string;
  description: string;
  builtin: boolean;
  steps: StepDto[];
}

export interface ProbeDto {
  host: string;
  result: string;
  latency_ms: number | null;
}

export interface CompatReport {
  av_detected: string[];
  vpn_detected: string[];
  legacy_services: string[];
  windivert_ok: boolean;
}

export interface BlockcheckResult {
  profile_id: string;
  success: boolean;
  latency_ms: number | null;
}

export interface BlockcheckProgress {
  current: number;
  total: number;
  profile_name: string;
  result: BlockcheckResult | null;
}

export const STEP_LABELS: Record<StepDto["type"], string> = {
  fragment_tls: "TLS Parçalama",
  fragment_http: "HTTP Parçalama",
  fake_ttl: "Sahte Paket (TTL)",
  auto_ttl: "Otomatik TTL Sahtesi",
  multi_split: "Çoklu Sabit Parçalama",
  fake_from_hex: "Özel Hex Sahte Paket",
  fake_wrong_seq: "Sahte Paket (Sıra)",
  fake_wrong_checksum: "Sahte Paket (Bozuk Checksum)",
  host_case: "Host Harf Karışımı",
  host_space: "Host Boşluk Kaldırma",
  oob: "Out-of-band (OOB) Enjeksiyon",
  window_size: "TCP Pencere Daraltma (Window Size)",
  http_method_case: "HTTP Metod Harf Karışımı",
  http_absolute_uri: "HTTP Mutlak URI (Absolute URI)",
  http_lf: "HTTP LF Satır Sonu",
};

export function stepDetail(s: StepDto): string {
  switch (s.type) {
    case "fragment_tls":
      if (s.mode === "sni_mid") return "SNI ortasından böl";
      if (s.mode === "sni_mid_reverse") return "SNI ortasından böl, ters gönder";
      if (s.mode === "fixed") return `ilk ${s.value} baytı ayır`;
      return `ilk ${s.value} baytı ayır, ters gönder`;
    case "fake_ttl":
      return `TTL=${s.ttl}, sahte kopya`;
    case "auto_ttl":
      return `Baz: ${s.base}, Tolerans: ±${s.tolerance}`;
    case "multi_split":
      return `Ofsetler: [${s.positions.join(", ")}]`;
    case "fake_from_hex":
      return `Hex: ${s.hex.length > 16 ? s.hex.slice(0, 16) + "..." : s.hex}`;
    case "fake_wrong_seq":
      return "geçmiş sıra numarası";
    case "fake_wrong_checksum":
      return "hatalı TCP checksum";
    case "oob":
      return `Offset: ${s.offset}, Payload: ${s.payload}`;
    case "window_size":
      return `Size: ${s.size}`;
    default:
      return "";
  }
}

export interface EngineConfig {
  pasif_savunma: boolean;
  quic_engelle: boolean;
  lan_share: boolean;
}

export interface LanInfoDto {
  local_ip: string;
  proxy_port: number;
  proxy_running: boolean;
  hotspot_mode_enabled: boolean;
  active_connections: number;
  total_connections: number;
  bytes_transferred: number;
  pac_url: string;
}

export interface SetupStatus {
  service_installed: boolean;
  service_running: boolean;
  detached_running: boolean;
}

export interface DohStatusDto {
  enabled: boolean;
  auto_doh_value: number;
  template: string | null;
}

export interface AdapterDnsInfo {
  name: string;
  description: string;
  interface_index: number;
  ipv4_servers: string[];
  ipv6_servers: string[];
  is_dhcp: boolean;
}

export interface LegacyServiceDto {
  id: string;
  name: string;
  status: string;
  installed: boolean;
}

export interface DnsHealthDto {
  poisoned: boolean;
  resolved_ip: string;
  is_secure: boolean;
  message: string;
}

export interface UpdateInfoDto {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  release_name: string;
  release_notes: string;
  html_url: string;
  download_url: string | null;
  setup_url: string | null;
  portable_exe_url: string | null;
  portable_zip_url: string | null;
  is_portable: boolean;
  published_at: string;
}

export const api = {
  getStatus: () => invoke<Status>("get_status"),
  getSetupStatus: () => invoke<SetupStatus>("get_setup_status"),
  installService: (profileId: string) =>
    invoke<void>("install_service", { profileId }),
  uninstallService: () => invoke<void>("uninstall_service"),
  detachedStart: (profileId: string) =>
    invoke<void>("detached_start", { profileId }),
  detachedStop: () => invoke<void>("detached_stop"),
  listProfiles: () => invoke<Profile[]>("list_profiles"),
  saveProfile: (profile: {
    id: string | null;
    name: string;
    description: string;
    steps: StepDto[];
  }) => invoke<Profile>("save_profile", { profile }),
  deleteProfile: (id: string) => invoke<void>("delete_profile", { id }),
  getBlacklist: () => invoke<string[]>("get_blacklist"),
  addSite: (domain: string) => invoke<void>("add_site", { domain }),
  addSites: (domains: string[]) => invoke<number>("add_sites", { domains }),
  removeSite: (domain: string) => invoke<void>("remove_site", { domain }),
  resolveDomain: (domain: string) => invoke<boolean>("resolve_domain", { domain }),
  exportSitesToFile: () => invoke<boolean>("export_sites_to_file"),
  startEngine: (profileId: string) => invoke<void>("start_engine", { profileId }),
  stopEngine: () => invoke<void>("stop_engine"),
  restartAsAdmin: () => invoke<void>("restart_as_admin"),
  checkIsAdmin: () => invoke<boolean>("check_is_admin"),
  probeTarget: (host: string) => invoke<ProbeDto>("probe_target", { req: { host } }),
  getDnsServers: () => invoke<{ servers: string[] }>("get_dns_servers"),
  getAdapterDnsInfo: () => invoke<AdapterDnsInfo[]>("get_adapter_dns_info"),
  applySecureDns: (provider?: string) => invoke<void>("apply_secure_dns", { provider }),
  resetDns: () => invoke<void>("reset_dns"),
  getEngineConfig: () => invoke<EngineConfig>("get_engine_config"),
  setEngineConfig: (config: EngineConfig) =>
    invoke<void>("set_engine_config", { config }),
  checkCompatibility: () => invoke<CompatReport>("check_compatibility"),
  repairDriverFiles: () => invoke<boolean>("repair_driver_files"),
  autoDiscoverProfile: () => invoke<BlockcheckResult[]>("auto_discover_profile"),
  scanLegacyServices: () => invoke<LegacyServiceDto[]>("scan_legacy_services"),
  cleanupLegacyServices: (serviceIds?: string[]) =>
    invoke<string[]>("cleanup_legacy_services", { serviceIds }),
  getStartupEnabled: () => invoke<boolean>("get_startup_enabled"),
  setStartupEnabled: (enabled: boolean) =>
    invoke<void>("set_startup_enabled", { enabled }),
  getDohStatus: () => invoke<DohStatusDto>("get_doh_status"),
  applyDohRegistry: (template?: string) => invoke<void>("apply_doh_registry", { template }),
  resetDohRegistry: () => invoke<void>("reset_doh_registry"),
  getLogFile: (maxLines?: number) => invoke<string[]>("get_log_file", { maxLines }),
  clearLogFile: () => invoke<void>("clear_log_file"),
  exportLogToFile: () => invoke<boolean>("export_log_to_file"),
  exportProfilesToFile: () => invoke<boolean>("export_profiles_to_file"),
  importProfilesFromFile: () => invoke<number>("import_profiles_from_file"),
  factoryReset: () => invoke<void>("factory_reset"),
  purgeSystem: () => invoke<void>("purge_system"),
  getSystemHostname: () => invoke<string>("get_system_hostname"),
  getSystemTelemetryHardware: () =>
    invoke<{
      cpu_model: string | null;
      gpu_model: string | null;
      ram_total_gb: number | null;
      network_interface: string | null;
      link_speed_mbps: number | null;
      mtu: number | null;
    }>("get_system_telemetry_hardware"),
  sendTelemetryBeacon: (payload: string, endpoint?: string) =>
    invoke<string>("send_telemetry_beacon", { payload, endpoint }),
  getTrayMinimize: () => invoke<boolean>("get_tray_minimize"),
  setTrayMinimize: (enabled: boolean) => invoke<void>("set_tray_minimize", { enabled }),
  getShowTrayIcon: () => invoke<boolean>("get_show_tray_icon"),
  setShowTrayIcon: (enabled: boolean) => invoke<void>("set_show_tray_icon", { enabled }),
  getAlwaysOnTop: () => invoke<boolean>("get_always_on_top"),
  setAlwaysOnTop: (enabled: boolean) => invoke<void>("set_always_on_top", { enabled }),
  dnsLeakTest: () => invoke<string>("dns_leak_test"),
  checkDnsHealth: () => invoke<DnsHealthDto>("check_dns_health"),
  autoFixDns: () => invoke<void>("auto_fix_dns"),
  repairDiscordUpdates: () => invoke<string>("repair_discord_updates"),
  clearDiscordCache: () => invoke<string>("clear_discord_cache"),
  flushDnsAndRenewAdapters: () => invoke<string>("flush_dns_and_renew_adapters"),
  resetNetworkStack: () => invoke<string>("reset_network_stack"),
  checkUpdate: (repoOverride?: string, tokenOverride?: string) =>
    invoke<UpdateInfoDto>("check_update", { repoOverride, tokenOverride }),
  installUpdateDirect: (downloadUrl: string) =>
    invoke<void>("install_update_direct", { downloadUrl }),
  sendSystemNotification: (title: string, subtitle?: string, body?: string) =>
    invoke<void>("send_system_notification", { title, subtitle, body: body || "" }),
  testUpdateNotification: () => invoke<void>("test_update_notification"),
  fetchCommunityBlacklist: (sourceUrl?: string) =>
    invoke<number>("fetch_community_blacklist", { sourceUrl }),
  getAppVersion: () => invoke<string>("get_app_version"),
  openBrowserUrl: (url: string) => invoke<void>("open_browser_url", { url }),
  closeWindow: () => invoke<void>("window_close"),
  minimizeWindow: () => invoke<void>("window_minimize"),
  toggleMaximizeWindow: () => invoke<boolean>("window_toggle_maximize"),
  isWindowMaximized: () => invoke<boolean>("window_is_maximized"),
  showMainWindow: () => invoke<void>("show_main_window"),
  hideQuickPanel: () => invoke<void>("hide_quick_panel"),
  prepareForUpdate: () => invoke<void>("prepare_for_update"),
  exitApp: () => invoke<void>("exit_app"),
  getLanInfo: () => invoke<LanInfoDto>("get_lan_info"),
  startLanProxy: (port?: number) => invoke<LanInfoDto>("start_lan_proxy", { port }),
  stopLanProxy: () => invoke<LanInfoDto>("stop_lan_proxy"),
  openHotspotSettings: () => invoke<void>("open_hotspot_settings"),
  setLanShareHotspotMode: (enabled: boolean) =>
    invoke<void>("set_lan_share_hotspot_mode", { enabled }),
};

export function onLog(cb: (line: string) => void): Promise<() => void> {
  return listen<string>("log", (e) => cb(e.payload));
}

export function onStatusChange(cb: (running: boolean) => void): Promise<() => void> {
  return listen<boolean>("status_changed", (e) => cb(e.payload));
}

export function onBlockcheckProgress(cb: (prog: BlockcheckProgress) => void): Promise<() => void> {
  return listen<BlockcheckProgress>("blockcheck_progress", (e) => cb(e.payload));
}

export function onOpenUpdateModal(cb: () => void): Promise<() => void> {
  return listen("open_update_modal", () => cb());
}

export function onUpdateDownloadProgress(
  cb: (progress: { downloaded: number; total: number }) => void
): Promise<() => void> {
  return listen<{ downloaded: number; total: number }>("update_download_progress", (e) => cb(e.payload));
}

/**
 * Güncelleme paketini indirip kurar ve uygulamayı yeniden başlatır.
 * Öncelikli olarak Tauri Updater (imzalı) dener; imza uyuşmazlığı, endpoint
 * veya taşınabilir tek dosya kısıtlarında doğrudan güvenli indirme motoruna
 * (Direct Fallback) geçiş yaparak kesintisiz kurulumu garanti eder.
 */
export async function downloadAndInstallUpdate(
  fallbackDownloadUrl?: string | null,
  onProgress?: (downloadedBytes: number, totalBytes: number) => void,
): Promise<void> {
  let directFallbackNeeded = false;
  let tauriErr: unknown = null;

  try {
    const update = await checkPluginUpdate();
    if (!update) {
      directFallbackNeeded = true;
    } else {
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          onProgress?.(downloaded, total);
        }
      });

      try {
        await api.prepareForUpdate();
      } catch {
        // prepareForUpdate başarısız olsa dahi yeniden başlatmayı engelleme
      }

      await relaunch();
      return;
    }
  } catch (err) {
    tauriErr = err;
    directFallbackNeeded = true;
  }

  // 2. Fallback: Doğrudan güvenli indirme ve kurma motoru
  if (directFallbackNeeded) {
    if (!fallbackDownloadUrl) {
      throw (
        tauriErr ||
        new Error("Güncelleme bulunamadı ve geçerli bir indirme bağlantısı mevcut değil.")
      );
    }

    let unlisten: (() => void) | undefined;
    if (onProgress) {
      unlisten = await onUpdateDownloadProgress((p) => {
        onProgress(p.downloaded, p.total);
      });
    }

    try {
      await api.installUpdateDirect(fallbackDownloadUrl);
    } finally {
      unlisten?.();
    }
  }
}
