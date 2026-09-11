import { useEffect, useState, useCallback } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  Play,
  Power,
  Radio,
  Share2,
  Smartphone,
  Tablet,
  Wifi,
} from "lucide-react";
import { api, type LanInfoDto } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function LanShare({ pushLog }: { pushLog: (l: string) => void }) {
  const { t } = useI18n();
  const [lanInfo, setLanInfo] = useState<LanInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [guidePlatform, setGuidePlatform] = useState<"ios" | "android">("ios");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      pushLog("[*] Windows Mobil Etkin Nokta ayarları açıldı");
    } catch (e) {
      setErrorMsg(String(e));
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isProxyActive = lanInfo?.proxy_running ?? false;

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
        <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-3 text-xs text-red-300">
          {errorMsg}
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

        {/* Mobil Kurulum Rehberi */}
        <div className="rounded-lg bg-paper-surface/30 border border-paper-border/20 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-paper-border/20 pb-2">
            <span className="text-xs font-semibold text-paper-bright">{t("lan_guide_title")}</span>
            <div className="flex gap-1 bg-paper-border/20 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setGuidePlatform("ios")}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
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
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  guidePlatform === "android"
                    ? "bg-paper-surface text-paper-bright shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Smartphone size={13} />
                Android
              </button>
            </div>
          </div>

          {guidePlatform === "ios" ? (
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
          ) : (
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
              <h2 className="text-sm font-medium text-paper-bright">{t("lan_hotspot_card_title")}</h2>
              <p className="text-xs text-paper-muted mt-1 max-w-xl">{t("lan_hotspot_card_desc")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openHotspot}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-paper-border/30 hover:bg-paper-border/50 text-paper-bright border border-paper-border/40 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>{t("lan_btn_open_hotspot")}</span>
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
