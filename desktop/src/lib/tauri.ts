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
  getTrayMinimize: () => invoke<boolean>("get_tray_minimize"),
  setTrayMinimize: (enabled: boolean) => invoke<void>("set_tray_minimize", { enabled }),
  dnsLeakTest: () => invoke<string>("dns_leak_test"),
  checkDnsHealth: () => invoke<DnsHealthDto>("check_dns_health"),
  autoFixDns: () => invoke<void>("auto_fix_dns"),
  repairDiscordUpdates: () => invoke<string>("repair_discord_updates"),
  clearDiscordCache: () => invoke<string>("clear_discord_cache"),
  checkUpdate: (repoOverride?: string, tokenOverride?: string) =>
    invoke<UpdateInfoDto>("check_update", { repoOverride, tokenOverride }),
  fetchCommunityBlacklist: (sourceUrl?: string) =>
    invoke<number>("fetch_community_blacklist", { sourceUrl }),
  getAppVersion: () => invoke<string>("get_app_version"),
  openBrowserUrl: (url: string) => invoke<void>("open_browser_url", { url }),
  closeWindow: () => invoke<void>("window_close"),
  minimizeWindow: () => invoke<void>("window_minimize"),
  toggleMaximizeWindow: () => invoke<boolean>("window_toggle_maximize"),
  isWindowMaximized: () => invoke<boolean>("window_is_maximized"),
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

/**
 * İmzalı güncelleme paketini indirip kurar ve uygulamayı yeniden başlatır
 * (tauri-plugin-updater + tauri-plugin-process). `commands::check_update`
 * yalnızca bildirim/changelog içindir — gerçek indirme/imza doğrulama/kurulum
 * burada, Tauri'nin kendi updater'ı üzerinden yapılır.
 */
export async function downloadAndInstallUpdate(
  onProgress?: (downloadedBytes: number, totalBytes: number) => void,
): Promise<void> {
  const update = await checkPluginUpdate();
  if (!update) {
    throw new Error("Güncelleme bulunamadı (updater endpoint'i yeni sürüm görmüyor)");
  }
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
  await relaunch();
}
