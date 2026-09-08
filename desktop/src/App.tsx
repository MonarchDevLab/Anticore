import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldAlert, Shield, X } from "lucide-react";
import { api, onLog, type Status } from "./lib/tauri";
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

import AppNavigation, { type ViewId } from "./components/AppNavigation";

export default function App() {
  const [view, setView] = useState<ViewId>(() => {
    return localStorage.getItem("anticore_onboarded") === "true" ? "dashboard" : "wizard";
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [toggling, setToggling] = useState(false);
  const togglePending = useRef(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [topError, setTopError] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedProfile, setSelectedProfileState] = useState(
    () => localStorage.getItem("anticore_last_profile") || "universal",
  );
  const setSelectedProfile = useCallback((id: string) => {
    setSelectedProfileState(id);
    localStorage.setItem("anticore_last_profile", id);
  }, []);
  const seq = useRef(0);
  const { lang, t } = useI18n();
  const langRef = useRef(lang);
  langRef.current = lang;

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let alive = true;
    let polling = false;
    const tick = async () => {
      if (polling) return;
      polling = true;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const next = await Promise.race([api.getStatus(), new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error("Status timeout")), 4000);
        })]);
        if (alive) setStatus(next);
      } catch {
        if (alive) setStatus(null);
      } finally {
        clearTimeout(timeout);
        polling = false;
      }
    };
    void tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const running = status?.running ?? false;

  const pushLog = useCallback((line: string) => {
    seq.current += 1;
    const locale = langRef.current === "tr" ? "tr-TR" : "en-US";
    const stamped = `${new Date().toLocaleTimeString(locale)} ${line}`;
    setLogs((prev) => [...prev.slice(-299), stamped]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const unbinds: Array<() => void> = [];
    void onLog(pushLog).then((u) => {
      if (cancelled) u();
      else unbinds.push(u);
    }).catch((error) => pushLog(`[!] ${String(error)}`));
    return () => {
      cancelled = true;
      unbinds.forEach((u) => u());
    };
  }, [pushLog]);

  const quickToggle = async () => {
    if (togglePending.current || !status) return;
    togglePending.current = true;
    setToggling(true);
    setTopError(null);
    try {
      if (running) {
        await api.stopEngine();
      } else {
        await api.startEngine(selectedProfile);
      }
      setStatus(await api.getStatus());
    } catch (e) {
      const msg = String(e);
      pushLog(`[!] HATA: ${msg}`);
      setTopError(msg);
    } finally {
      togglePending.current = false;
      setToggling(false);
    }
  };


  return (
    <div className="app-workspace flex h-screen w-screen flex-col bg-void text-paper overflow-hidden font-sans">
      {/* ── 1. Yekpare Frameless Başlık Çubuğu ── */}
      <Titlebar
        status={status}
        running={running}
        selectedProfile={selectedProfile}
        updateAvailable={updateAvailable}
        onOpenUpdateModal={() => setUpdateModalOpen(true)}
        onToggleGuide={() => setGuideOpen(true)}
      />

      <div className="workspace-layout">
        <AppNavigation view={view} onNavigate={setView} running={running} known={status !== null} busy={toggling} onToggle={() => void quickToggle()} />
        <div className="workspace-content">
      <CompatWarning />
      {topError && (
        <div role="alert" className="mx-4 mt-3 p-3 rounded-xl bg-alert/15 border border-alert/30 text-paper-bright flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-fade-in z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert size={16} className="text-alert shrink-0" />
            <span className="break-all">
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
              aria-label={lang === "tr" ? "Uyarıyı kapat" : "Dismiss alert"}
              className="text-paper-muted hover:text-paper-bright cursor-pointer p-3"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Tam Ekran Geniş Çalışma Alanı ── */}
      <main id="workspace-main" className="workspace-main" tabIndex={-1}>
        <div className="workspace-page">
          {view === "dashboard" && (
            <Dashboard
              status={status}
              running={running}
              logs={logs}
              onNavigate={setView}
              busy={toggling}
              onToggle={() => void quickToggle()}
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
        </div>
      </div>

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
