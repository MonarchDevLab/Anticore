import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Gamepad2,
  Info,
  LoaderCircle,
  Monitor,
  Play,
  Power,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Wifi,
} from "lucide-react";
import { api, type LanInfoDto, type ConnectedClientDto } from "../lib/tauri";
import { useI18n, type TranslationKey } from "../lib/i18n";
import { isMac } from "../lib/platform";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelativeTime(
  secsAgo: number,
  t: (key: TranslationKey) => string,
): string {
  if (secsAgo < 10) {
    return t("lan_client_just_now");
  }
  if (secsAgo < 60) {
    return t("lan_client_secs_ago").replace("{s}", String(secsAgo));
  }
  const mins = Math.floor(secsAgo / 60);
  return t("lan_client_mins_ago").replace("{m}", String(mins));
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case "mobile":
      return <Smartphone size={16} className="text-anticore-primary" />;
    case "pc":
      return <Monitor size={16} className="text-sky-400" />;
    case "console":
      return <Gamepad2 size={16} className="text-purple-400" />;
    default:
      return <Tablet size={16} className="text-paper-muted" />;
  }
}

export default function LanShare({ pushLog }: { pushLog: (l: string) => void }) {
  const { t } = useI18n();
  const [lanInfo, setLanInfo] = useState<LanInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [firewallBusy, setFirewallBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [guidePlatform, setGuidePlatform] = useState<"ios" | "android" | "pc" | "console">("ios");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firewallSuccess, setFirewallSuccess] = useState<string | null>(null);

  const fetchLanInfo = useCallback(async () => {
    try {
      const info = await api.getLanInfo();
      setLanInfo(info);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLanInfo();
    const timer = setInterval(() => {
      void fetchLanInfo();
    }, 2000);
    return () => clearInterval(timer);
  }, [fetchLanInfo]);

  const toggleProxy = async () => {
    if (busy) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      if (lanInfo?.proxy_running) {
        const updated = await api.stopLanProxy();
        setLanInfo(updated);
        pushLog("[*] Yerel ağ proxy sunucusu durduruldu");
      } else {
        const updated = await api.startLanProxy();
        setLanInfo(updated);
        pushLog(`[+] Yerel ağ proxy sunucusu başlatıldı (${updated.local_ip}:${updated.proxy_port})`);
      }
    } catch (e) {
      setErrorMsg(String(e));
      pushLog(`[!] Proxy işlem hatası: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleHotspotMode = async (enabled: boolean) => {
    setErrorMsg(null);
    try {
      await api.setLanShareHotspotMode(enabled);
      setLanInfo((prev) => (prev ? { ...prev, hotspot_mode_enabled: enabled } : null));
      pushLog(`[*] Hotspot transit paket yakalama: ${enabled ? "Açık" : "Kapalı"}`);
    } catch (e) {
      setErrorMsg(String(e));
    }
  };

  const openHotspot = async () => {
    try {
      await api.openHotspotSettings();
      pushLog(isMac ? "[*] macOS Paylaşım ayarları açıldı" : "[*] Windows Mobil Etkin Nokta ayarları açıldı");
    } catch (e) {
      setErrorMsg(String(e));
    }
  };

  const handleAllowFirewall = async () => {
    if (firewallBusy) return;
    setFirewallBusy(true);
    setErrorMsg(null);
    setFirewallSuccess(null);
    try {
      const allowed = await api.allowFirewallLanProxy();
      setLanInfo((prev) => (prev ? { ...prev, firewall_allowed: allowed } : null));
      if (allowed) {
        setFirewallSuccess(t("lan_firewall_fixed"));
        pushLog("[+] Windows Güvenlik Duvarı kuralı eklendi (TCP 10808 İzinli)");
      } else {
        setErrorMsg("Güvenlik duvarı kuralı eklenemedi, lütfen yönetici yetkisiyle deneyin.");
      }
    } catch (e) {
      setErrorMsg(String(e));
      pushLog(`[!] Güvenlik duvarı izin hatası: ${e}`);
    } finally {
      setFirewallBusy(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isProxyActive = lanInfo?.proxy_running ?? false;
  const testUrl = `http://${lanInfo?.local_ip || "127.0.0.1"}:${lanInfo?.proxy_port || 10808}`;
  const clients: ConnectedClientDto[] = lanInfo?.connected_devices || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-paper-bright flex items-center gap-2">
            <Share2 className="text-anticore-primary" size={22} />
            {t("lan_share_title")}
          </h1>
          <p className="text-xs text-paper-muted mt-1">{t("lan_share_subtitle")}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {firewallSuccess && (
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/50 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <Check size={15} className="text-emerald-400 shrink-0" />
          <span>{firewallSuccess}</span>
        </div>
      )}

      {/* Windows Güvenlik Duvarı Durum Bildirimi */}
      {!isMac && lanInfo && (
        <div
          className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            lanInfo.firewall_allowed
              ? "bg-emerald-950/20 border-emerald-800/30 text-emerald-300"
              : "bg-amber-950/30 border-amber-800/40 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {lanInfo.firewall_allowed ? (
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold">
                {lanInfo.firewall_allowed
                  ? t("lan_firewall_status_ok")
                  : t("lan_firewall_status_warn")}
              </span>
            </div>
          </div>

          {!lanInfo.firewall_allowed && (
            <button
              type="button"
              disabled={firewallBusy}
              onClick={handleAllowFirewall}
              className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow"
            >
              {firewallBusy ? (
                <LoaderCircle size={13} className="animate-spin" />
              ) : (
                <ShieldCheck size={13} />
              )}
              <span>{t("lan_btn_fix_firewall")}</span>
            </button>
          )}
        </div>
      )}

      {/* MOD A: Wi-Fi SOCKS5 / HTTP Proxy Kartı */}
      <div className="rounded-xl bg-paper-surface/60 border border-paper-border/40 p-5 backdrop-blur space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-border/20 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                isProxyActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-paper-border/30 text-paper-muted border border-paper-border/40"
              }`}
            >
              <Wifi size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-paper-bright">{t("lan_proxy_card_title")}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                    isProxyActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse"
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isProxyActive ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  {isProxyActive ? t("lan_proxy_status_active") : t("lan_proxy_status_stopped")}
                </span>
              </div>
              <p className="text-xs text-paper-muted mt-1 max-w-xl">{t("lan_proxy_card_desc")}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || loading}
            onClick={toggleProxy}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              isProxyActive
                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
            }`}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={14} />
            ) : isProxyActive ? (
              <Power size={14} />
            ) : (
              <Play size={14} />
            )}
            <span>{isProxyActive ? t("lan_btn_stop_proxy") : t("lan_btn_start_proxy")}</span>
          </button>
        </div>

        {/* Bağlantı Parametreleri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* IP Adresi */}
          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-paper-muted uppercase tracking-wider font-mono">
              {t("lan_ip_address")}
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-semibold font-mono text-paper-bright">
                {lanInfo?.local_ip || "127.0.0.1"}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(lanInfo?.local_ip || "127.0.0.1", "ip")}
                className="p-1.5 rounded hover:bg-paper-border/30 text-paper-muted hover:text-paper-bright transition-colors"
                title="Kopyala"
              >
                {copiedField === "ip" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Port */}
          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-paper-muted uppercase tracking-wider font-mono">
              {t("lan_port")}
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-semibold font-mono text-paper-bright">
                {lanInfo?.proxy_port || 10808}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(String(lanInfo?.proxy_port || 10808), "port")}
                className="p-1.5 rounded hover:bg-paper-border/30 text-paper-muted hover:text-paper-bright transition-colors"
                title="Kopyala"
              >
                {copiedField === "port" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* PAC Script URL */}
          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-paper-muted uppercase tracking-wider font-mono">
              {t("lan_pac_url")}
            </span>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-xs font-mono text-paper-bright truncate">
                {lanInfo?.pac_url || `http://127.0.0.1:10808/anticore.pac`}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    lanInfo?.pac_url || `http://127.0.0.1:10808/anticore.pac`,
                    "pac",
                  )
                }
                className="p-1.5 rounded hover:bg-paper-border/30 text-paper-muted hover:text-paper-bright transition-colors shrink-0"
                title="Kopyala"
              >
                {copiedField === "pac" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Canlı İstatistik Çubuğu (Proxy çalışırken) */}
        {isProxyActive && (
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-800/30 p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-mono text-paper-muted">{t("lan_stats_active_conn")}</div>
              <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
                {lanInfo?.active_connections ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-paper-muted">{t("lan_stats_total_conn")}</div>
              <div className="text-sm font-semibold text-paper-bright font-mono mt-0.5">
                {lanInfo?.total_connections ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-paper-muted">{t("lan_stats_bytes")}</div>
              <div className="text-sm font-semibold text-paper-bright font-mono mt-0.5">
                {formatBytes(lanInfo?.bytes_transferred ?? 0)}
              </div>
            </div>
          </div>
        )}

        {/* Canlı Bağlantı Doğrulama Test Kutusu */}
        {isProxyActive && (
          <div className="rounded-lg bg-anticore-primary/10 border border-anticore-primary/30 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-anticore-primary">
              <Info size={15} />
              <span>{t("lan_test_browser_title")}</span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed">
              {t("lan_test_browser_desc")}
            </p>
            <div className="flex items-center justify-between gap-3 bg-paper-surface/60 border border-paper-border/40 rounded-lg p-2 font-mono text-xs text-paper-bright">
              <span className="truncate">{testUrl}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(testUrl, "testUrl")}
                  className="p-1 rounded hover:bg-paper-border/30 text-paper-muted hover:text-paper-bright transition-colors"
                  title="URL Kopyala"
                >
                  {copiedField === "testUrl" ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <a
                  href={testUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-paper-border/30 text-paper-muted hover:text-paper-bright transition-colors"
                  title="Yeni Sekmede Aç"
                >
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Mobil & Platform Kurulum Rehberi (Tabbed) */}
        <div className="rounded-lg bg-paper-surface/30 border border-paper-border/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-border/20 pb-2.5">
            <span className="text-xs font-semibold text-paper-bright">{t("lan_guide_title")}</span>
            <div className="flex flex-wrap gap-1 bg-paper-border/20 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setGuidePlatform("ios")}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  guidePlatform === "ios"
                    ? "bg-paper-surface text-paper-bright shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Tablet size={13} />
                iOS
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform("android")}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  guidePlatform === "android"
                    ? "bg-paper-surface text-paper-bright shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Smartphone size={13} />
                Android
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform("pc")}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  guidePlatform === "pc"
                    ? "bg-paper-surface text-paper-bright shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Monitor size={13} />
                PC / Mac
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform("console")}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  guidePlatform === "console"
                    ? "bg-paper-surface text-paper-bright shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Gamepad2 size={13} />
                Konsol
              </button>
            </div>
          </div>

          {guidePlatform === "ios" && (
            <ol className="space-y-2 text-xs text-paper-muted list-decimal list-inside leading-relaxed">
              <li>{t("lan_guide_ios_step1")}</li>
              <li>{t("lan_guide_ios_step2")}</li>
              <li>
                {t("lan_guide_ios_step3")}{" "}
                <span className="text-paper-bright font-mono bg-paper-border/30 px-1 py-0.5 rounded">
                  {lanInfo?.local_ip || "192.168.X.X"} : {lanInfo?.proxy_port || 10808}
                </span>
              </li>
            </ol>
          )}

          {guidePlatform === "android" && (
            <ol className="space-y-2 text-xs text-paper-muted list-decimal list-inside leading-relaxed">
              <li>{t("lan_guide_android_step1")}</li>
              <li>{t("lan_guide_android_step2")}</li>
              <li>
                {t("lan_guide_android_step3")}{" "}
                <span className="text-paper-bright font-mono bg-paper-border/30 px-1 py-0.5 rounded">
                  {lanInfo?.local_ip || "192.168.X.X"} : {lanInfo?.proxy_port || 10808}
                </span>
              </li>
            </ol>
          )}

          {guidePlatform === "pc" && (
            <div className="space-y-2 text-xs text-paper-muted leading-relaxed">
              <p>
                {t("lan_guide_pc_step1")
                  .replace("{ip}", lanInfo?.local_ip || "192.168.X.X")
                  .replace("{port}", String(lanInfo?.proxy_port || 10808))}
              </p>
              <p>
                {t("lan_guide_pc_step2")
                  .replace("{ip}", lanInfo?.local_ip || "192.168.X.X")
                  .replace("{port}", String(lanInfo?.proxy_port || 10808))}
              </p>
            </div>
          )}

          {guidePlatform === "console" && (
            <ol className="space-y-2 text-xs text-paper-muted list-decimal list-inside leading-relaxed">
              <li>{t("lan_guide_console_step1")}</li>
              <li>{t("lan_guide_console_step2")}</li>
              <li>
                {t("lan_guide_console_step3")
                  .replace("{ip}", lanInfo?.local_ip || "192.168.X.X")
                  .replace("{port}", String(lanInfo?.proxy_port || 10808))}
              </li>
            </ol>
          )}
        </div>
      </div>

      {/* Bağlı Cihazlar & Canlı İstemciler Tablosu */}
      <div className="rounded-xl bg-paper-surface/60 border border-paper-border/40 p-5 backdrop-blur space-y-4">
        <div className="flex items-center justify-between border-b border-paper-border/20 pb-3">
          <div>
            <h2 className="text-sm font-medium text-paper-bright flex items-center gap-2">
              <Smartphone className="text-sky-400" size={17} />
              {t("lan_clients_card_title")}
              <span className="text-xs font-mono font-normal text-paper-muted">
                ({clients.length})
              </span>
            </h2>
            <p className="text-xs text-paper-muted mt-0.5">{t("lan_clients_card_desc")}</p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-lg bg-paper-surface/30 border border-paper-border/20 p-6 text-center text-xs text-paper-muted">
            <p>{t("lan_clients_empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-paper-border/20 text-paper-muted font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">{t("lan_client_col_device")}</th>
                  <th className="py-2.5 px-3">{t("lan_client_col_ip")}</th>
                  <th className="py-2.5 px-3">{t("lan_client_col_mac")}</th>
                  <th className="py-2.5 px-3 text-center">{t("lan_client_col_streams")}</th>
                  <th className="py-2.5 px-3 text-right">{t("lan_client_col_data")}</th>
                  <th className="py-2.5 px-3">{t("lan_client_col_last_target")}</th>
                  <th className="py-2.5 px-3 text-right">{t("lan_client_col_last_seen")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-border/10">
                {clients.map((c) => (
                  <tr key={c.ip} className="hover:bg-paper-surface/40 transition-colors">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {getDeviceIcon(c.device_type)}
                      <div>
                        <div className="font-medium text-paper-bright text-xs">{c.vendor}</div>
                        {c.vendor.includes("Rastgele") && (
                          <div className="text-[10px] text-sky-400/80 font-mono">
                            IEEE 802 LAA
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-paper-bright text-xs">
                      {c.ip}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs">
                      {c.mac ? (
                        <span className="text-paper-bright bg-paper-border/30 px-1.5 py-0.5 rounded">
                          {c.mac}
                        </span>
                      ) : (
                        <span className="text-paper-muted italic">
                          {c.ip === "127.0.0.1" || c.ip === "::1" ? "Loopback" : "Önbellek Bekleniyor"}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          c.active_streams > 0
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-paper-border/20 text-paper-muted"
                        }`}
                      >
                        {c.active_streams > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        {c.active_streams}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-paper-bright text-xs">
                      {formatBytes(c.bytes_transferred)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-paper-muted truncate max-w-[140px]">
                      {c.last_target || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-paper-muted font-mono whitespace-nowrap">
                      {formatRelativeTime(c.last_seen_secs_ago, t)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sorun Giderme Kontrol Listesi (Troubleshooting Checklist) */}
      <div className="rounded-xl bg-paper-surface/60 border border-paper-border/40 p-5 backdrop-blur space-y-4">
        <div className="flex items-center gap-2 border-b border-paper-border/20 pb-3">
          <AlertTriangle size={18} className="text-amber-400" />
          <h2 className="text-sm font-medium text-paper-bright">{t("lan_troubleshoot_title")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 space-y-1.5">
            <div className="font-semibold text-paper-bright">{t("lan_troubleshoot_1_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_1_desc")}</p>
          </div>

          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 space-y-1.5">
            <div className="font-semibold text-paper-bright">{t("lan_troubleshoot_2_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_2_desc")}</p>
          </div>

          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 space-y-1.5">
            <div className="font-semibold text-paper-bright">{t("lan_troubleshoot_3_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_3_desc")}</p>
          </div>

          <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 space-y-1.5">
            <div className="font-semibold text-paper-bright">{t("lan_troubleshoot_4_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_4_desc")}</p>
          </div>
        </div>
      </div>

      {/* MOD B: Mobil Etkin Nokta (Hotspot Transit Ağ Geçidi) */}
      <div className="rounded-xl bg-paper-surface/60 border border-paper-border/40 p-5 backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-anticore-primary/10 text-anticore-primary border border-anticore-primary/30">
              <Radio size={20} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-paper-bright">
                {isMac ? t("lan_hotspot_card_title_mac") : t("lan_hotspot_card_title")}
              </h2>
              <p className="text-xs text-paper-muted mt-1 max-w-xl">
                {isMac ? t("lan_hotspot_card_desc_mac") : t("lan_hotspot_card_desc")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openHotspot}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-paper-border/30 hover:bg-paper-border/50 text-paper-bright border border-paper-border/40 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>{isMac ? t("lan_btn_open_hotspot_mac") : t("lan_btn_open_hotspot")}</span>
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Hotspot Transit Filtreleme Ayarı */}
        <div className="rounded-lg bg-paper-surface/40 border border-paper-border/30 p-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-paper-bright">{t("lan_hotspot_mode_label")}</div>
            <div className="text-[11px] text-paper-muted mt-0.5">{t("lan_hotspot_mode_desc")}</div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={lanInfo?.hotspot_mode_enabled ?? false}
              onChange={(e) => toggleHotspotMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-paper-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-anticore-primary" />
          </label>
        </div>
      </div>
    </div>
  );
}
