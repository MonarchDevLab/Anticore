import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Globe,
  LayoutDashboard,
  Layers,
  Power,
  ScrollText,
  Settings as SettingsIcon,
  Wifi,
  Wrench,
  LoaderCircle,
  Zap,
  ShieldAlert,
  Shield,
  X,
} from "lucide-react";
import { api, onLog, onStatusChange, type Status } from "./lib/tauri";
import { useI18n } from "./lib/i18n";
import Dashboard from "./views/Dashboard";
import Sites from "./views/Sites";
import Profiles from "./views/Profiles";
import TestCenter from "./views/TestCenter";
import NetworkRepair from "./views/NetworkRepair";
import Setup from "./views/Setup";
import SettingsView from "./views/SettingsView";
import Wizard from "./views/Wizard";
import LogsView from "./views/LogsView";
import CompatWarning from "./components/CompatWarning";
import UpdateModal from "./components/UpdateModal";
import Titlebar from "./components/Titlebar";
import GuideDrawer from "./components/GuideDrawer";

type ViewId = "dashboard" | "sites" | "profiles" | "test" | "network" | "setup" | "settings" | "wizard" | "logs";

export default function App() {
  const [view, setView] = useState<ViewId>(() => {
    return localStorage.getItem("anticore_onboarded") === "true" ? "dashboard" : "wizard";
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [toggling, setToggling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [topError, setTopError] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedProfile, setSelectedProfileState] = useState(
    () => localStorage.getItem("anticore_last_profile") || "universal",
  );
  const setSelectedProfile = (id: string) => {
    setSelectedProfileState(id);
    localStorage.setItem("anticore_last_profile", id);
  };
  const seq = useRef(0);
  const { lang, t } = useI18n();

  useEffect(() => {
    setLogs([`[i] Anticore hazır — WinDivert çekirdeği bekleniyor`]);

    if (localStorage.getItem("anticore_auto_update") === "true") {
      const repo = localStorage.getItem("anticore_github_repo") || undefined;
      void api
        .checkUpdate(repo)
        .then((info) => {
          if (info.has_update) {
            setUpdateAvailable(info.latest_version);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      void api.getStatus().then((s) => {
        if (alive) setStatus(s);
      });
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const running = status?.running ?? false;

  const pushLog = useCallback((line: string) => {
    seq.current += 1;
    const locale = lang === "tr" ? "tr-TR" : "en-US";
    const stamped = `${new Date().toLocaleTimeString(locale)} ${line}`;
    setLogs((prev) => [...prev.slice(-299), stamped]);
  }, [lang]);

  useEffect(() => {
    const unbinds: Array<() => void> = [];
    void onLog(pushLog).then((u) => unbinds.push(u));
    void onStatusChange((r) => {
      void api.getStatus().then((s) => setStatus(s));
      setRunningFallback(r);
    }).then((u) => unbinds.push(u));
    return () => unbinds.forEach((u) => u());
  }, [pushLog]);

  const setRunningFallback = useCallback((_r: boolean) => {}, []);

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
      const msg = String(e);
      pushLog(`[!] HATA: ${msg}`);
      setTopError(msg);
    } finally {
      setToggling(false);
    }
  };

  const navItems = [
    { id: "dashboard" as ViewId, label: t("nav_dashboard"), icon: <LayoutDashboard size={14} /> },
    { id: "sites" as ViewId, label: t("nav_sites"), icon: <Globe size={14} /> },
    { id: "profiles" as ViewId, label: t("nav_profiles"), icon: <Layers size={14} /> },
    { id: "test" as ViewId, label: t("nav_test"), icon: <Activity size={14} /> },
    { id: "network" as ViewId, label: t("nav_network"), icon: <Wifi size={14} /> },
    { id: "logs" as ViewId, label: t("nav_logs"), icon: <ScrollText size={14} /> },
    { id: "setup" as ViewId, label: t("nav_setup"), icon: <Wrench size={14} /> },
    { id: "settings" as ViewId, label: t("nav_settings"), icon: <SettingsIcon size={14} /> },
  ];

  return (
    <div className="flex h-screen w-screen flex-col select-none bg-void text-paper overflow-hidden font-sans">
      {/* ── 1. Yekpare Frameless Başlık Çubuğu ── */}
      <Titlebar
        status={status}
        running={running}
        selectedProfile={selectedProfile}
        updateAvailable={updateAvailable}
        onOpenUpdateModal={() => setUpdateModalOpen(true)}
        onToggleGuide={() => setGuideOpen(true)}
      />

      {/* ── 2. Yatay Segmented HUD Tab Bar & Konsol Eylemleri ── */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-surface-subtle/90 backdrop-blur-md border-b border-border-brutal relative z-40">
        {/* Yatay Segmented Menü */}
        <nav aria-label="Ana Gezinme Rayı" className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-surface-elevated text-paper-bright border border-border-brutal-strong shadow-sm"
                    : "text-paper-muted hover:text-paper hover:bg-surface-hover border border-transparent"
                }`}
              >
                <span className={active ? "text-live" : "text-paper-faint"}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sağ: Hızlı Çekirdek Güç Anahtarı */}
        <div className="flex items-center gap-2 pl-3">
          <button
            onClick={() => void quickToggle()}
            disabled={toggling}
            className={`btn-reactor flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all cursor-pointer ${
              running
                ? "bg-alert/15 text-alert border border-alert/30 hover:bg-alert/25 shadow-[0_0_15px_rgba(255,59,48,0.25)]"
                : "bg-live text-[#041E13] border border-live hover:bg-live/90 shadow-[0_0_15px_rgba(0,245,155,0.35)]"
            }`}
            aria-label={running ? t("btn_stop") : t("btn_start")}
          >
            {toggling ? (
              <LoaderCircle size={13} className="animate-spin" strokeWidth={2.5} />
            ) : running ? (
              <Zap size={13} strokeWidth={2.5} />
            ) : (
              <Power size={13} strokeWidth={2.5} />
            )}
            <span className="tracking-wide">{running ? t("btn_stop") : t("btn_start")}</span>
          </button>
        </div>
      </div>

      <CompatWarning />
      {topError && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-alert/15 border border-alert/30 text-paper-bright flex items-center justify-between gap-3 text-xs shadow-lg animate-fade-in z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert size={16} className="text-alert shrink-0" />
            <span className="truncate">
              {topError.toLowerCase().includes("yönetici") ||
              topError.toLowerCase().includes("admin") ||
              topError.toLowerCase().includes("windivert") ||
              topError.toLowerCase().includes("filter=") ||
              topError.toLowerCase().includes("hakları") ||
              topError.toLowerCase().includes("privilege")
                ? t("dash_admin_warn")
                : topError}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(topError.toLowerCase().includes("yönetici") ||
              topError.toLowerCase().includes("admin") ||
              topError.toLowerCase().includes("windivert") ||
              topError.toLowerCase().includes("filter=") ||
              topError.toLowerCase().includes("hakları") ||
              topError.toLowerCase().includes("privilege")) && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.restartAsAdmin();
                  } catch (err) {
                    setTopError(String(err));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-alert text-white font-bold text-[11px] flex items-center gap-1 hover:bg-alert/90 cursor-pointer shadow"
              >
                <Shield size={12} />
                <span>{t("dash_admin_btn")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setTopError(null)}
              className="text-paper-muted hover:text-paper-bright cursor-pointer p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Tam Ekran Geniş Çalışma Alanı ── */}
      <main className="flex-1 overflow-y-auto p-5 lg:p-6 min-h-0 relative">
        <div className="mx-auto max-w-6xl h-full">
          {view === "dashboard" && (
            <Dashboard
              status={status}
              running={running}
              logs={logs}
              pushLog={pushLog}
              selectedProfile={selectedProfile}
              onSelectedProfileChange={setSelectedProfile}
            />
          )}
          {view === "sites" && <Sites pushLog={pushLog} />}
          {view === "profiles" && <Profiles />}
          {view === "test" && <TestCenter pushLog={pushLog} />}
          {view === "network" && <NetworkRepair pushLog={pushLog} />}
          {view === "logs" && <LogsView liveLogs={logs} pushLog={pushLog} />}
          {view === "setup" && <Setup pushLog={pushLog} />}
          {view === "settings" && (
            <SettingsView pushLog={pushLog} onOpenWizard={() => setView("wizard")} running={running} />
          )}
          {view === "wizard" && (
            <Wizard onComplete={() => setView("dashboard")} pushLog={pushLog} />
          )}
        </div>
      </main>

      {/* ── 4. Kılavuz Çekmecesi (Slide-over Drawer) ── */}
      <GuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* ── 5. Güncelleme Modalı ── */}
      <UpdateModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onUpdateDetected={(has) => setUpdateAvailable(has ? "available" : null)}
      />
    </div>
  );
}
