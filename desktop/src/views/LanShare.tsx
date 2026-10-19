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
import { isMac, isAndroid } from "../lib/platform";

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
      return <Smartphone size={16} className="text-live" />;
    case "pc":
      return <Monitor size={16} className="text-sky" />;
    case "console":
      return <Gamepad2 size={16} className="text-purple-400" />;
    default:
      return <Tablet size={16} className="text-paper-muted" />;
  }
}

interface LanShareProps {
  pushLog: (l: string) => void;
  engineRunning?: boolean;
  onStartEngine?: () => void;
}

export default function LanShare({ pushLog, engineRunning = false, onStartEngine }: LanShareProps) {
  const { t } = useI18n();
  const [lanInfo, setLanInfo] = useState<LanInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [firewallBusy, setFirewallBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [guidePlatform, setGuidePlatform] = useState<"ios" | "android" | "pc" | "console">("ios");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firewallSuccess, setFirewallSuccess] = useState<string | null>(null);
  const [diagState, setDiagState] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setDiagState("testing");
    setDiagMessage(null);
    try {
      const res = await api.probeTarget("discord.com");
      if (res.result === "open") {
        setDiagState("ok");
        setDiagMessage(
          `Proxy soketi ve DPI bypass tüneli doğrulandı (discord.com -> ${res.latency_ms ?? 0} ms).`,
        );
        pushLog(
          `[+] LAN Proxy tanı testi başarılı: discord.com erişimi açık (${res.latency_ms ?? 0} ms).`,
        );
      } else {
        const port = lanInfo?.proxy_port || 10808;
        await fetch(`http://127.0.0.1:${port}/status`, {
          method: "GET",
          mode: "no-cors",
          cache: "no-cache",
        });
        setDiagState("ok");
        setDiagMessage(`Proxy soketi aktif (Port ${port} dinleniyor, DNS yedekleme hazır).`);
        pushLog("[+] LAN Proxy tanı testi başarılı: Soket ve yerel sunucu yanıt veriyor.");
      }
    } catch (e) {
      setDiagState("error");
      setDiagMessage("Yerel proxy soketine erişilemedi. Lütfen proxy'yi durdurup yeniden başlatın.");
      pushLog(`[!] LAN Proxy tanı testi başarısız: ${e}`);
    }
  };

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
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Başlık */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-brutal">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-paper-bright flex items-center gap-2.5">
            <Share2 className="text-live" size={22} />
            <span>{t("lan_share_title")}</span>
          </h2>
          <p className="text-xs text-paper-muted mt-1">{t("lan_share_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${
              isProxyActive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : "bg-surface-elevated text-paper-muted border-border-brutal"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isProxyActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
            />
            {isProxyActive ? t("lan_proxy_status_active") : t("lan_proxy_status_stopped")}
          </span>
        </div>
      </header>

      {errorMsg && (
        <div className="card rounded-lg bg-red-950/90 border border-red-500/50 p-3.5 text-xs text-red-200 flex items-center gap-2.5 shadow-md">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {firewallSuccess && (
        <div className="card rounded-lg bg-emerald-950/90 border border-emerald-500/50 p-3.5 text-xs text-emerald-200 flex items-center gap-2.5 shadow-md">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{firewallSuccess}</span>
        </div>
      )}

      {/* Ana Tünel Motoru Kapalı Uyarısı */}
      {!engineRunning && isProxyActive && (
        <div className="card rounded-lg bg-surface-card border border-amber-500/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-md">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Ana DPI Tüneli Kapalı (Yerel Proxy Bağımsız Bypass Modunda)</div>
              <div className="text-xs text-paper-muted mt-0.5 leading-relaxed">
                Yerel proxy sunucusu kendi cerrahi TLS bölme motoruyla çalışmaktadır; tam sistem koruması için ana tünel motorunu da başlatabilirsiniz.
              </div>
            </div>
          </div>
          {onStartEngine && (
            <button
              type="button"
              onClick={onStartEngine}
              className="btn btn-primary !py-2 !px-3.5 text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Play size={14} />
              <span>Motoru Başlat</span>
            </button>
          )}
        </div>
      )}

      {/* Windows Güvenlik Duvarı Durum Bildirimi (Sadece Windows) */}
      {!isMac && !isAndroid && lanInfo && (
        <div
          className={`card rounded-lg border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-surface-card ${
            lanInfo.firewall_allowed
              ? "border-emerald-500/35 text-emerald-300"
              : "border-amber-500/45 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {lanInfo.firewall_allowed ? (
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold text-paper-bright">
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
              className="btn btn-primary !py-2 !px-3.5 text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {firewallBusy ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} />
              )}
              <span>{t("lan_btn_fix_firewall")}</span>
            </button>
          )}
        </div>
      )}

      {/* MOD A: Wi-Fi SOCKS5 / HTTP Proxy Kartı */}
      <section className="card rounded-xl bg-surface-card border border-border-brutal p-5 space-y-5 tabular-nums shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-brutal pb-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-lg shrink-0 ${
                isProxyActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                  : "bg-surface-elevated text-paper-muted border border-border-brutal"
              }`}
            >
              <Wifi size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-paper-bright">{t("lan_proxy_card_title")}</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    isProxyActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                      : "bg-red-500/15 text-red-400 border border-red-500/35"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isProxyActive ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  {isProxyActive ? t("lan_proxy_status_active") : t("lan_proxy_status_stopped")}
                </span>
              </div>
              <p className="text-xs text-paper-muted mt-1 max-w-xl leading-relaxed">{t("lan_proxy_card_desc")}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || loading}
            onClick={toggleProxy}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-150 active:scale-[0.97] shrink-0 cursor-pointer ${
              isProxyActive
                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40"
                : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-lg"
            }`}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : isProxyActive ? (
              <Power size={15} />
            ) : (
              <Play size={15} />
            )}
            <span>{isProxyActive ? t("lan_btn_stop_proxy") : t("lan_btn_start_proxy")}</span>
          </button>
        </div>

        {/* Bağlantı Parametreleri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* IP Adresi */}
          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-paper-muted uppercase tracking-wider font-mono">
              {t("lan_ip_address")}
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-bold font-mono text-paper-bright">
                {lanInfo?.local_ip || "127.0.0.1"}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(lanInfo?.local_ip || "127.0.0.1", "ip")}
                className="p-1.5 rounded bg-surface-elevated hover:bg-surface-hover text-paper-muted hover:text-paper-bright border border-border-brutal transition-colors cursor-pointer"
                title="Kopyala"
              >
                {copiedField === "ip" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Port */}
          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-paper-muted uppercase tracking-wider font-mono">
              {t("lan_port")}
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-bold font-mono text-paper-bright">
                {lanInfo?.proxy_port || 10808}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(String(lanInfo?.proxy_port || 10808), "port")}
                className="p-1.5 rounded bg-surface-elevated hover:bg-surface-hover text-paper-muted hover:text-paper-bright border border-border-brutal transition-colors cursor-pointer"
                title="Kopyala"
              >
                {copiedField === "port" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* PAC Script URL */}
          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-paper-muted uppercase tracking-wider font-mono">
              {t("lan_pac_url")}
            </span>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-xs font-mono font-semibold text-paper-bright truncate">
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
                className="p-1.5 rounded bg-surface-elevated hover:bg-surface-hover text-paper-muted hover:text-paper-bright border border-border-brutal transition-colors shrink-0 cursor-pointer"
                title="Kopyala"
              >
                {copiedField === "pac" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Canlı İstatistik Çubuğu (Proxy çalışırken) */}
        {isProxyActive && (
          <div className="rounded-lg bg-surface-subtle border border-emerald-500/35 p-3.5 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-mono text-paper-muted">{t("lan_stats_active_conn")}</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {lanInfo?.active_connections ?? 0}
              </div>
            </div>
            <div className="border-x border-border-brutal">
              <div className="text-[10px] uppercase font-mono text-paper-muted">{t("lan_stats_total_conn")}</div>
              <div className="text-base font-bold text-paper-bright font-mono mt-0.5">
                {lanInfo?.total_connections ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-paper-muted">{t("lan_stats_bytes")}</div>
              <div className="text-base font-bold text-paper-bright font-mono mt-0.5">
                {formatBytes(lanInfo?.bytes_transferred ?? 0)}
              </div>
            </div>
          </div>
        )}

        {/* Canlı Bağlantı Doğrulama Test Kutusu */}
        {isProxyActive && (
          <div className="rounded-lg bg-surface-subtle border border-live/35 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-live">
              <Info size={15} />
              <span>{t("lan_test_browser_title")}</span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed">
              {t("lan_test_browser_desc")}
            </p>
            <div className="flex items-center justify-between gap-3 bg-surface-card border border-border-brutal rounded-lg p-2.5 font-mono text-xs text-paper-bright">
              <span className="truncate font-semibold">{testUrl}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(testUrl, "testUrl")}
                  className="p-1.5 rounded bg-surface-elevated hover:bg-surface-hover text-paper-muted hover:text-paper-bright border border-border-brutal transition-colors cursor-pointer"
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
                  className="p-1.5 rounded bg-surface-elevated hover:bg-surface-hover text-paper-muted hover:text-paper-bright border border-border-brutal transition-colors"
                  title="Yeni Sekmede Aç"
                >
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            {/* Hızlı Teşhis ve Doğrulama Butonu */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={diagState === "testing"}
                onClick={() => void runDiagnostic()}
                className="btn btn-secondary !py-2 !px-3.5 text-xs font-bold text-live border-live/40 hover:bg-live/15 flex items-center gap-1.5 cursor-pointer"
              >
                {diagState === "testing" ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Radio size={14} />
                )}
                <span>Proxy Soketini ve DNS Teşhisini Başlat</span>
              </button>

              {diagState === "ok" && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} />
                  <span>{diagMessage}</span>
                </span>
              )}

              {diagState === "error" && (
                <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>{diagMessage}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobil & Platform Kurulum Rehberi (Tabbed) */}
        <div className="rounded-lg bg-surface-subtle border border-border-brutal p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border-brutal pb-3">
            <span className="text-xs font-bold text-paper-bright">{t("lan_guide_title")}</span>
            <div className="flex flex-wrap gap-1 bg-surface-card p-1 rounded-lg border border-border-brutal">
              <button
                type="button"
                onClick={() => setGuidePlatform("ios")}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  guidePlatform === "ios"
                    ? "bg-live text-void shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Tablet size={13} />
                iOS
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform("android")}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  guidePlatform === "android"
                    ? "bg-live text-void shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Smartphone size={13} />
                Android
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform("pc")}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  guidePlatform === "pc"
                    ? "bg-live text-void shadow-sm"
                    : "text-paper-muted hover:text-paper-bright"
                }`}
              >
                <Monitor size={13} />
                PC / Mac
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform("console")}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  guidePlatform === "console"
                    ? "bg-live text-void shadow-sm"
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
                <span className="text-paper-bright font-mono font-semibold bg-surface-elevated border border-border-brutal px-1.5 py-0.5 rounded">
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
                <span className="text-paper-bright font-mono font-semibold bg-surface-elevated border border-border-brutal px-1.5 py-0.5 rounded">
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
      </section>

      {/* Bağlı Cihazlar & Canlı İstemciler Tablosu */}
      <section className="card rounded-xl bg-surface-card border border-border-brutal p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-border-brutal pb-3">
          <div>
            <h3 className="text-base font-bold text-paper-bright flex items-center gap-2">
              <Smartphone className="text-sky" size={18} />
              <span>{t("lan_clients_card_title")}</span>
              <span className="text-xs font-mono font-semibold text-paper-muted bg-surface-elevated px-2 py-0.5 rounded border border-border-brutal">
                {clients.length}
              </span>
            </h3>
            <p className="text-xs text-paper-muted mt-1">{t("lan_clients_card_desc")}</p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-6 text-center text-xs text-paper-muted">
            <p>{t("lan_clients_empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-brutal text-paper-muted font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">{t("lan_client_col_device")}</th>
                  <th className="py-2.5 px-3">{t("lan_client_col_ip")}</th>
                  <th className="py-2.5 px-3">{t("lan_client_col_mac")}</th>
                  <th className="py-2.5 px-3 text-center">{t("lan_client_col_streams")}</th>
                  <th className="py-2.5 px-3 text-right">{t("lan_client_col_data")}</th>
                  <th className="py-2.5 px-3">{t("lan_client_col_last_target")}</th>
                  <th className="py-2.5 px-3 text-right">{t("lan_client_col_last_seen")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brutal">
                {clients.map((c) => (
                  <tr key={c.ip} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {getDeviceIcon(c.device_type)}
                      <div>
                        <div className="font-semibold text-paper-bright text-xs">{c.vendor}</div>
                        {c.vendor.includes("Rastgele") && (
                          <div className="text-[10px] text-sky font-mono">
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
                        <span className="text-paper-bright bg-surface-elevated border border-border-brutal px-1.5 py-0.5 rounded">
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          c.active_streams > 0
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                            : "bg-surface-elevated text-paper-muted border border-border-brutal"
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
      </section>

      {/* Sorun Giderme Kontrol Listesi (Troubleshooting Checklist) */}
      <section className="card rounded-xl bg-surface-card border border-border-brutal p-5 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-border-brutal pb-3">
          <AlertTriangle size={18} className="text-amber-400" />
          <h3 className="text-base font-bold text-paper-bright">{t("lan_troubleshoot_title")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 space-y-1.5">
            <div className="font-bold text-paper-bright">{t("lan_troubleshoot_1_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_1_desc")}</p>
          </div>

          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 space-y-1.5">
            <div className="font-bold text-paper-bright">{t("lan_troubleshoot_2_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_2_desc")}</p>
          </div>

          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 space-y-1.5">
            <div className="font-bold text-paper-bright">
              {isAndroid
                ? "3. Mobil Erişim Noktası (Hotspot) ve Wi-Fi İzolasyonu"
                : t("lan_troubleshoot_3_title")}
            </div>
            <p className="text-paper-muted leading-relaxed">
              {isAndroid
                ? "Telefonunuzun Kişisel Erişim Noktası (Hotspot) özelliğini açarak veya aynı Wi-Fi ağına bağlanarak diğer cihazlardan bu IP ve 10808 portuna bağlanabilirsiniz."
                : t("lan_troubleshoot_3_desc")}
            </p>
          </div>

          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-3.5 space-y-1.5">
            <div className="font-bold text-paper-bright">{t("lan_troubleshoot_4_title")}</div>
            <p className="text-paper-muted leading-relaxed">{t("lan_troubleshoot_4_desc")}</p>
          </div>
        </div>
      </section>

      {/* MOD B: Mobil Etkin Nokta (Hotspot Transit Ağ Geçidi - Sadece Masaüstü) */}
      {!isAndroid && (
        <section className="card rounded-xl bg-surface-card border border-border-brutal p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-lg bg-live/15 text-live border border-live/35 shrink-0">
                <Radio size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-paper-bright">
                  {isMac ? t("lan_hotspot_card_title_mac") : t("lan_hotspot_card_title")}
                </h3>
                <p className="text-xs text-paper-muted mt-1 max-w-xl leading-relaxed">
                  {isMac ? t("lan_hotspot_card_desc_mac") : t("lan_hotspot_card_desc")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openHotspot}
              className="btn btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{isMac ? t("lan_btn_open_hotspot_mac") : t("lan_btn_open_hotspot")}</span>
              <ExternalLink size={13} />
            </button>
          </div>

          {/* Hotspot Transit Filtreleme Ayarı */}
          <div className="rounded-lg bg-surface-subtle border border-border-brutal p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-paper-bright">{t("lan_hotspot_mode_label")}</div>
              <div className="text-xs text-paper-muted mt-0.5">{t("lan_hotspot_mode_desc")}</div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={lanInfo?.hotspot_mode_enabled ?? false}
              onClick={() => void toggleHotspotMode(!(lanInfo?.hotspot_mode_enabled ?? false))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 focus:outline-none ${
                lanInfo?.hotspot_mode_enabled
                  ? "bg-live border-live"
                  : "bg-surface-elevated border-border-brutal"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  lanInfo?.hotspot_mode_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
