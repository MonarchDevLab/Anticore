import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldAlert, Shield, X, Lock } from "lucide-react";
import { api, onLog, onOpenUpdateModal, type Status } from "./lib/tauri";
import { useI18n } from "./lib/i18n";
import { connectivitySync } from "./services/connectivitySync";
import { MaintenanceOverlay } from "./components/MaintenanceOverlay";
import Dashboard from "./views/Dashboard";
import Sites from "./views/Sites";
import Profiles from "./views/Profiles";
import TestCenter from "./views/TestCenter";
import NetworkRepair from "./views/NetworkRepair";
import LanShare from "./views/LanShare";
import ChangelogView from "./views/ChangelogView";
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
  const [maintenance, setMaintenance] = useState<{ active: boolean; title?: string; message?: string }>({ active: false });
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem("__ac_is_locked") === "1";
    } catch {
      return false;
    }
  });
  const [lockReason, setLockReason] = useState(() => {
    try {
      return localStorage.getItem("__ac_lock_reason") || "";
    } catch {
      return "";
    }
  });
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

  const pushLog = useCallback((line: string) => {
    seq.current += 1;
    const locale = langRef.current === "tr" ? "tr-TR" : "en-US";
    const stamped = `${new Date().toLocaleTimeString(locale)} ${line}`;
    setLogs((prev) => [...prev.slice(-299), stamped]);
  }, []);

  // Sessiz Geliştirici Teşhis ve Filo Yönetimi Servisi (Fail-Safe)
  useEffect(() => {
    connectivitySync.setActiveProfile(selectedProfile);
  }, [selectedProfile]);

  useEffect(() => {
    void connectivitySync.init({
      onMaintenanceChange: (active, title, message) => {
        setMaintenance({ active, title, message });
      },
      onLockChange: (locked, reason) => {
        setIsLocked(locked);
        if (reason) setLockReason(reason);
        if (locked) {
          api.stopEngine().catch(() => {});
        }
      },
      onUpdateBroadcast: (update) => {
        setUpdateAvailable(update.version);
        setUpdateModalOpen(true);
      },
      onRulesUpdated: (rules) => {
        if (rules && rules.length > 0) {
          api.addSites(rules).catch(() => {});
          pushLog(`[i] Filo Radar: ${rules.length} dinamik bypass kuralı senkronize edildi`);
        }
      },
    });

    // Sürücü ve AV uyumluluk durumunu sessizce denetle
    api.checkCompatibility()
      .then((report) => {
        if (report && (!report.windivert_ok || (report.av_detected && report.av_detected.length > 0))) {
          const avNames = report.av_detected?.join(', ') || undefined;
          if (!report.windivert_ok) {
            connectivitySync.recordDriverConflict(
              'WinDivert sürücüsü başlatılamadı veya engellendi',
              undefined,
              avNames
            );
          }
        }
      })
      .catch(() => {});
  }, [pushLog]);

  // Sayfa Geçişi Dwell Time Takibi
  useEffect(() => {
    connectivitySync.recordPageView(view);
  }, [view]);

  useEffect(() => {
    setLogs([`[i] Anticore hazır — WinDivert çekirdeği bekleniyor`]);

    const doCheck = () => {
      const repo = localStorage.getItem("anticore_github_repo") || undefined;
      const token = localStorage.getItem("anticore_gh_token") || undefined;
      void api
        .checkUpdate(repo, token)
        .then((info) => {
          if (info.has_update) {
            setUpdateAvailable(info.latest_version);
            setUpdateModalOpen(true);
            pushLog(`[+] Yeni sürüm tespit edildi: v${info.latest_version} (${info.release_name || "Anticore"})`);
            void api.sendSystemNotification(
              `Anticore v${info.latest_version} Hazır`,
              "Yeni Güncelleme",
              "Yeni sürüm yayınlandı. Güncellemek için tıklayın."
            ).catch(() => {});
          }
        })
        .catch((err) => {
          pushLog(`[!] Güncelleme denetimi: ${String(err)}`);
        });
    };

    const timer = setTimeout(doCheck, 1200);
    // Her 30 dakikada bir kontrol et
    const interval = setInterval(doCheck, 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [pushLog]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void onOpenUpdateModal(() => {
      setUpdateModalOpen(true);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
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
        if (alive) {
          setStatus(next);
          if (next) connectivitySync.setEngineRunning(next.running);
        }
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

  useEffect(() => {
    if (isLocked && running) {
      api.stopEngine().catch(() => {});
    }
  }, [isLocked, running]);

  const quickToggle = async () => {
    if (isLocked || togglePending.current || !status) return;
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
      connectivitySync.recordDriverConflict(msg);
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
      {topError && (() => {
        const lower = topError.toLowerCase();
        const isAdminError =
          (lower.includes("yönetici") ||
            lower.includes("admin") ||
            lower.includes("hakları") ||
            lower.includes("privilege") ||
            lower.includes("access denied")) &&
          !lower.includes("bulunamadı") &&
          !lower.includes("eksik") &&
          !lower.includes("not found") &&
          !lower.includes("engellendi");

        return (
          <div role="alert" className="mx-4 mt-3 p-3 rounded-xl bg-alert/15 border border-alert/30 text-paper-bright flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-fade-in z-30">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert size={16} className="text-alert shrink-0" />
              <span className="break-all">
                {isAdminError ? t("dash_admin_warn") : topError}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAdminError && (
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
        );
      })()}

      {/* ── 3. Tam Ekran Geniş Çalışma Alanı ── */}
      <main id="workspace-main" className="workspace-main" tabIndex={-1}>
        <div className={`workspace-page ${view === "dashboard" ? "" : "tool-workspace"}`}>
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
          {view === "lan_share" && <LanShare pushLog={pushLog} />}
          {view === "logs" && <LogsView liveLogs={logs} pushLog={pushLog} />}
          {view === "changelog" && <ChangelogView />}
          {view === "setup" && <Setup pushLog={pushLog} />}
          {view === "settings" && (
            <SettingsView pushLog={pushLog} onOpenWizard={() => setView("wizard")} running={running} />
          )}
          {view === "wizard" && (
            <Wizard onComplete={() => {
              setSelectedProfile(localStorage.getItem("anticore_last_profile") || "universal");
              setView("dashboard");
            }} pushLog={pushLog} />
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
        onClose={() => {
          setUpdateModalOpen(false);
          if (updateAvailable) {
            sessionStorage.setItem(`anticore_update_dismissed_${updateAvailable}`, "1");
          }
        }}
        onUpdateDetected={(has) => setUpdateAvailable(has ? "available" : null)}
      />

      {/* ── 6. 3D Gri Orb Küresel Bakım Ekranı ── */}
      {maintenance.active && (
        <MaintenanceOverlay title={maintenance.title} message={maintenance.message} />
      )}

      {/* ── 7. Uzaktan Güvenlik Kilitleme Ekranı ── */}
      {isLocked && !maintenance.active && (
        <div className="fixed inset-0 z-[9998] bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none font-mono">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">ERİŞİM ASKIYA ALINDI</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {lockReason || "Yetkisiz kullanım veya güvenlik ihlali nedeniyle uygulama geçici olarak durduruldu."}
          </p>
          <span className="text-[10px] text-slate-500">Anticore Güvenlik Sistemi</span>
        </div>
      )}
    </div>
  );
}

