import { useEffect, useRef, useState } from "react";
import {
  Power,
  Zap,
  Shield,
  ShieldAlert,
  X,
  ChevronDown,
  Globe,
  Wrench,
  Maximize2,
  LogOut,
  LoaderCircle,
  Check,
  Radio,
  Download,
} from "lucide-react";
import { api, onStatusChange, type Profile, type Status } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

export default function TrayQuickPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>(
    () => localStorage.getItem("anticore_last_profile") || "universal"
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [pps, setPps] = useState(0);
  const [appVersion, setAppVersion] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; downloadUrl?: string | null } | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const lastTouchedRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;

  const { t, lang } = useI18n();

  const formatPackets = (n: number) => {
    if (!n || n <= 0) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Escape tuşu ile paneli kapat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void api.hideQuickPanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Profilleri ve Sürüm Bilgisini Yükle
  useEffect(() => {
    void api.listProfiles().then(setProfiles).catch(() => {});
    void api.getAppVersion().then(setAppVersion).catch(() => {});
    void api.checkUpdate().then((info) => {
      if (info.has_update) {
        setUpdateAvailable(true);
        setUpdateInfo({ version: info.latest_version, downloadUrl: info.download_url });
      }
    }).catch(() => {});
  }, []);

  // Periyodik durum sorgulama & PPS hesaplama
  useEffect(() => {
    let alive = true;
    const tick = () => {
      void api
        .getStatus()
        .then((s) => {
          if (!alive) return;
          setStatus(s);
          if (s.running) {
            const currentTouched = s.packets_touched;
            if (currentTouched >= lastTouchedRef.current) {
              setPps(currentTouched - lastTouchedRef.current);
            }
            lastTouchedRef.current = currentTouched;
            if (s.profile_id && s.profile_id !== selectedProfile) {
              setSelectedProfile(s.profile_id);
              localStorage.setItem("anticore_last_profile", s.profile_id);
            }
          } else {
            setPps(0);
            lastTouchedRef.current = 0;
          }
        })
        .catch(() => {});
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [selectedProfile]);

  // Durum değişikliği dinleyicisi
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    void onStatusChange((running) => {
      if (cancelled) return;
      void api.getStatus().then((s) => setStatus(s)).catch(() => {});
      if (!running) setPps(0);
    }).then((u) => {
      if (cancelled) u();
      else unlisten = u;
    });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  const running = status?.running ?? false;

  const quickToggle = async () => {
    setToggling(true);
    setTopError(null);
    try {
      if (running) {
        await api.stopEngine();
      } else {
        await api.startEngine(selectedProfile);
      }
    } catch (e) {
      setTopError(String(e));
    } finally {
      setToggling(false);
    }
  };

  const handleSelectProfile = async (id: string) => {
    setSelectedProfile(id);
    localStorage.setItem("anticore_last_profile", id);
    setIsProfileOpen(false);

    if (running) {
      setToggling(true);
      try {
        await api.stopEngine();
        await api.startEngine(id);
      } catch (e) {
        setTopError(String(e));
      } finally {
        setToggling(false);
      }
    }
  };

  const handleDnsFix = async () => {
    setActionLoading("dns");
    setTopError(null);
    try {
      await api.autoFixDns();
      setFeedback(t("qp_dns_success"));
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setTopError(String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscordFix = async () => {
    setActionLoading("discord");
    setTopError(null);
    try {
      await api.clearDiscordCache();
      await api.repairDiscordUpdates();
      setFeedback(t("qp_discord_success"));
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setTopError(String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const currentProfileObj = profiles.find((p) => p.id === selectedProfile);

  return (
    <div className="flex h-screen w-screen flex-col justify-between p-3.5 bg-void text-paper select-none font-sans overflow-hidden border border-border-brutal-strong rounded-2xl shadow-2xl relative">
      {/* ── 1. Üst Başlık & Durum Rozeti ── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border-brutal">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="h-6 w-6 rounded-lg bg-surface-elevated border border-border-brutal flex items-center justify-center text-live shadow-sm">
            <Radio size={13} className={running ? "animate-pulse" : ""} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold tracking-wider text-xs text-paper-bright">ANTICORE</span>
            <span className="text-[10px] text-paper-faint font-mono font-medium">
              v{appVersion || "0.3.0"}
            </span>
            {updateAvailable && (
              <button
                onClick={() => {
                  void api.showMainWindow();
                  void api.hideQuickPanel();
                }}
                title={t("update_modal_new_available")}
                className="px-1.5 py-0.2 rounded bg-live/20 text-live border border-live/40 text-[9px] font-bold uppercase tracking-wider hover:bg-live/30 cursor-pointer animate-pulse"
              >
                {t("qp_update_badge")}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live LED Status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border transition-all ${
              running
                ? "bg-live/10 text-live border-live/30 shadow-[var(--shadow-brutal-live)]"
                : "bg-surface-elevated text-paper-muted border-border-brutal"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                running ? "bg-live animate-ping" : "bg-paper-faint"
              }`}
            />
            <span>{running ? t("qp_active") : t("qp_passive")}</span>
          </div>

          {/* Kapat Butonu */}
          <button
            onClick={() => void api.hideQuickPanel()}
            title={t("btn_close")}
            className="h-6 w-6 rounded-md flex items-center justify-center text-paper-muted hover:text-paper-bright hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Güncelleme Bildirim Kartı (macOS Menü Çubuğu & Taktik Panel) ── */}
      {updateAvailable && updateInfo && (
        <div className="my-1.5 p-2.5 rounded-xl bg-live/15 border border-live/35 flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-md bg-live/25 text-live shrink-0">
              <Download size={13} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-live uppercase tracking-wider">
                  {lang === "tr" ? "Yeni Sürüm" : "New Update"}
                </span>
                <span className="text-[10px] font-mono font-bold text-paper-bright">
                  {updateInfo.version}
                </span>
              </div>
              <p className="text-[9px] text-paper-muted truncate">
                {lang === "tr" ? "macOS & Windows paketi hazır" : "macOS & Windows package ready"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (updateInfo.downloadUrl) {
                void api.openBrowserUrl(updateInfo.downloadUrl);
              } else {
                void api.showMainWindow();
              }
              void api.hideQuickPanel();
            }}
            className="px-2.5 py-1 rounded-lg bg-live text-black font-bold text-[10px] hover:bg-live/90 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            {lang === "tr" ? "İndir" : "Download"}
          </button>
        </div>
      )}

      {/* ── Hata / Bildirim Bildirim Şeridi ── */}
      {topError && (
        <div className="my-1 p-2 rounded-lg bg-alert/15 border border-alert/30 text-paper-bright text-[11px] flex items-center justify-between gap-2 shadow animate-fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert size={14} className="text-alert shrink-0" />
            <span className="truncate">{topError}</span>
          </div>
          {(topError.toLowerCase().includes("yönetici") ||
            topError.toLowerCase().includes("admin") ||
            topError.toLowerCase().includes("windivert")) && (
            <button
              onClick={() => void api.restartAsAdmin()}
              className="px-2 py-0.5 rounded bg-alert text-paper-bright text-[10px] font-bold shrink-0 hover:brightness-110 cursor-pointer"
            >
              UAC
            </button>
          )}
        </div>
      )}

      {feedback && (
        <div className="my-1 p-2 rounded-lg bg-live/15 border border-live/30 text-live text-[11px] flex items-center gap-1.5 shadow animate-fade-in">
          <Check size={14} className="shrink-0" />
          <span className="truncate font-medium">{feedback}</span>
        </div>
      )}

      {/* ── 2. Hero Güç Reaktörü (Büyük Dokunsal Toggle) ── */}
      <div className="my-2 flex flex-col items-center justify-center">
        <button
          onClick={() => void quickToggle()}
          disabled={toggling}
          aria-label={running ? t("btn_stop") : t("btn_start")}
          className={`w-full group relative flex flex-col items-center justify-center py-4 px-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
            running
              ? "bg-live/10 border-live/40 shadow-[var(--shadow-brutal-live)] hover:bg-live/15"
              : "bg-surface-card border-border-brutal hover:border-border-brutal-strong hover:bg-surface-elevated"
          }`}
        >
          {/* Background Ambient Glow */}
          <div
            className={`absolute inset-0 transition-opacity opacity-20 pointer-events-none ${
              running ? "bg-radial from-live to-transparent" : "bg-radial from-paper-faint to-transparent"
            }`}
          />

          {/* Reaktör İkonu */}
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-2 transition-all transform group-active:scale-95 ${
              running
                ? "bg-live text-void shadow-lg shadow-live/30"
                : "bg-surface-elevated text-paper-muted border border-border-brutal group-hover:text-paper-bright"
            }`}
          >
            {toggling ? (
              <LoaderCircle size={24} className="animate-spin" />
            ) : running ? (
              <Zap size={24} strokeWidth={2.5} />
            ) : (
              <Power size={24} strokeWidth={2.5} />
            )}
          </div>

          {/* Durum Metni */}
          <span className="text-xs font-black tracking-wider uppercase">
            {running ? t("qp_engine_active") : t("qp_engine_passive")}
          </span>
          <span className="text-[10px] text-paper-muted mt-0.5 font-medium">
            {running ? `${lang === "tr" ? "Profil" : "Profile"}: ${currentProfileObj?.name || selectedProfile}` : (lang === "tr" ? "Tıkla ve Güvenle Bağlan" : "Click to Connect Safely")}
          </span>
        </button>
      </div>

      {/* ── 3. Hızlı Profil Seçici Dropdown ── */}
      <div className="relative mb-2">
        <div className="flex items-center justify-between text-[10px] text-paper-muted font-bold uppercase tracking-wider mb-1 px-1">
          <span>{t("qp_profile")}</span>
          <span className="text-paper-faint font-mono">{profiles.length} {lang === "tr" ? "Hazır" : "Ready"}</span>
        </div>

        <button
          onClick={() => setIsProfileOpen((prev) => !prev)}
          className="w-full h-8 px-2.5 rounded-lg bg-surface-card border border-border-brutal hover:border-border-brutal-strong flex items-center justify-between text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Shield size={13} className={running ? "text-live" : "text-paper-muted"} />
            <span className="font-semibold truncate text-paper-bright">
              {currentProfileObj?.name || selectedProfile}
            </span>
          </div>
          <ChevronDown
            size={13}
            className={`text-paper-muted transition-transform duration-200 ${
              isProfileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Profil Açılır Listesi */}
        {isProfileOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-elevated/95 backdrop-blur-xl border border-border-brutal-strong rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto no-scrollbar p-1 animate-fade-in">
            {profiles.map((p) => {
              const active = p.id === selectedProfile;
              return (
                <button
                  key={p.id}
                  onClick={() => void handleSelectProfile(p.id)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    active
                      ? "bg-surface-hover text-live font-bold"
                      : "text-paper hover:bg-surface-hover/60"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-paper-faint truncate">{p.description}</div>
                  </div>
                  {active && <Check size={13} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Mini Telemetri HUD (3 Sütun - Gerçek Veriler) ── */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="rounded-lg bg-surface-card border border-border-brutal p-2 flex flex-col items-center text-center">
          <span className="text-[9px] text-paper-muted uppercase font-bold tracking-tight">
            {t("qp_telemetry_pps")}
          </span>
          <span className="text-xs font-mono font-black text-paper-bright mt-0.5">
            {running ? `${pps} PPS` : "0 PPS"}
          </span>
        </div>

        <div className="rounded-lg bg-surface-card border border-border-brutal p-2 flex flex-col items-center text-center">
          <span className="text-[9px] text-paper-muted uppercase font-bold tracking-tight">
            {t("qp_telemetry_packets")}
          </span>
          <span className="text-xs font-mono font-black text-live mt-0.5">
            {running ? formatPackets(status?.packets_touched ?? 0) : "0"}
          </span>
        </div>

        <div className="rounded-lg bg-surface-card border border-border-brutal p-2 flex flex-col items-center text-center">
          <span className="text-[9px] text-paper-muted uppercase font-bold tracking-tight">
            {t("qp_telemetry_uptime")}
          </span>
          <span className="text-xs font-mono font-black text-sky mt-0.5">
            {running ? formatUptime(status?.uptime_sec ?? 0) : "00:00:00"}
          </span>
        </div>
      </div>

      {/* ── 5. 1-Click Hızlı Onarım Butonları ── */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <button
          onClick={() => void handleDnsFix()}
          disabled={actionLoading !== null}
          className="h-7 px-2 rounded-lg bg-surface-card border border-border-brutal hover:border-border-brutal-strong hover:bg-surface-elevated text-[11px] font-semibold text-paper flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {actionLoading === "dns" ? (
            <LoaderCircle size={12} className="animate-spin text-sky" />
          ) : (
            <Globe size={12} className="text-sky" />
          )}
          <span className="truncate">{t("qp_action_dns")}</span>
        </button>

        <button
          onClick={() => void handleDiscordFix()}
          disabled={actionLoading !== null}
          className="h-7 px-2 rounded-lg bg-surface-card border border-border-brutal hover:border-border-brutal-strong hover:bg-surface-elevated text-[11px] font-semibold text-paper flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {actionLoading === "discord" ? (
            <LoaderCircle size={12} className="animate-spin text-live" />
          ) : (
            <Wrench size={12} className="text-live" />
          )}
          <span className="truncate">{t("qp_action_discord")}</span>
        </button>
      </div>

      {/* ── 6. Alt Eylem Çubuğu (Footer) ── */}
      <div className="pt-2 border-t border-border-brutal flex items-center justify-between text-xs">
        <button
          onClick={() => void api.showMainWindow()}
          className="flex items-center gap-1.5 text-paper-muted hover:text-paper-bright font-semibold transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-surface-hover"
        >
          <Maximize2 size={13} className="text-paper-bright" />
          <span>{t("qp_open_main")}</span>
        </button>

        <button
          onClick={() => void api.exitApp()}
          className="flex items-center gap-1 text-alert hover:text-alert-dim font-semibold transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-alert/10"
        >
          <LogOut size={13} />
          <span>{t("qp_quit")}</span>
        </button>
      </div>
    </div>
  );
}
