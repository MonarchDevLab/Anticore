import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Globe,
  LayoutDashboard,
  Layers,
  Moon,
  Power,
  ScrollText,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Wifi,
  Wrench,
  Languages,
  Sparkles,
} from "lucide-react";
import { api, onLog, onStatusChange, type Status } from "./lib/tauri";
import { useTheme } from "./lib/theme";
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

type ViewId = "dashboard" | "sites" | "profiles" | "test" | "network" | "setup" | "settings" | "wizard" | "logs";

export default function App() {
  const [view, setView] = useState<ViewId>(() => {
    return localStorage.getItem("anticore_onboarded") === "true" ? "dashboard" : "wizard";
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [toggling, setToggling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  // TestCenter'daki Blockcheck "Uygula" ve manuel seçim AYNI anahtarı yazar —
  // uygulama yeniden açıldığında son kullanılan profil hatırlanır.
  const [selectedProfile, setSelectedProfileState] = useState(
    () => localStorage.getItem("anticore_last_profile") || "universal",
  );
  const setSelectedProfile = (id: string) => {
    setSelectedProfileState(id);
    localStorage.setItem("anticore_last_profile", id);
  };
  const seq = useRef(0);

  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    setLogs([`[i] Anticore hazır — motor bekleniyor`]);

    // Açılışta otomatik güncelleme denetimi
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

  // TEK GERÇEK KAYNAK: motor durumunu 1 sn'de bir çek
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

  const setRunningFallback = useCallback((_r: boolean) => {
    // anlık iyileştirme; gerçek değer polling'den gelir
  }, []);

  const quickToggle = async () => {
    setToggling(true);
    try {
      if (running) {
        await api.stopEngine();
      } else {
        await api.startEngine(selectedProfile);
      }
    } catch (e) {
      pushLog(`[!] HATA: ${String(e)}`);
    } finally {
      setToggling(false);
    }
  };

  const navItems = [
    { id: "dashboard" as ViewId, label: t("nav_dashboard"), icon: <LayoutDashboard size={17} /> },
    { id: "sites" as ViewId, label: t("nav_sites"), icon: <Globe size={17} /> },
    { id: "profiles" as ViewId, label: t("nav_profiles"), icon: <Layers size={17} /> },
    { id: "test" as ViewId, label: t("nav_test"), icon: <Activity size={17} /> },
    { id: "network" as ViewId, label: t("nav_network"), icon: <Wifi size={17} /> },
    { id: "logs" as ViewId, label: t("nav_logs"), icon: <ScrollText size={17} /> },
    { id: "setup" as ViewId, label: t("nav_setup"), icon: <Wrench size={17} /> },
    { id: "settings" as ViewId, label: t("nav_settings"), icon: <SettingsIcon size={17} /> },
  ];

  return (
    <div className="flex h-full flex-col select-none">
      {/* Üst bar: kimlik + global durum + tema/dil anahtarları + hızlı başlat/durdur */}
      <header className="topbar flex h-16 shrink-0 items-center gap-4 px-6 border-b-[3px] border-white/20 bg-black shadow-[0_4px_0px_rgba(0,0,0,0.5)] z-20">
        <div className="flex shrink-0 items-center gap-3">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-none border-2 transition-none ${
              running
                ? "border-live bg-live/20 text-live shadow-[2px_2px_0px_#fff]"
                : "border-white/30 bg-black text-white/50"
            }`}
          >
            <ShieldCheck className={running ? "text-live" : "text-white/40"} size={20} aria-hidden strokeWidth={2.5} />
          </div>
          <span className="whitespace-nowrap font-mono text-base font-black tracking-[0.3em] text-white uppercase">
            ANTICORE
          </span>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-none px-3 py-1 font-mono text-xs font-black tracking-widest uppercase border-2 ${
            running
              ? "border-live bg-live/15 text-live shadow-[2px_2px_0px_rgba(5,150,105,0.2)]"
              : "border-white/20 bg-black text-white/60"
          }`}
        >
          <span className={`h-2 w-2 rounded-none ${running ? "bg-live animate-pulse" : "bg-white/30"}`} aria-hidden />
          <span>{running ? t("status_active") : t("status_inactive")}</span>
        </div>

        {/* Sağ araçlar: Güncelleme + Dil + Tema + Hızlı Başlat */}
        <div className="ml-auto flex items-center gap-2.5">
          {/* Güncelleme Denetleyici Butonu */}
          <button
            onClick={() => setUpdateModalOpen(true)}
            className={`flex h-9 items-center justify-center rounded-none border-2 px-3 font-mono text-xs font-black uppercase transition-none shadow-[2px_2px_0px_rgba(255,255,255,0.05)] active:translate-y-0.5 active:shadow-none cursor-pointer ${
              updateAvailable
                ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                : "border-white/20 bg-black text-white hover:border-white/50 hover:bg-white/5"
            }`}
            title={updateAvailable ? t("header_update_available") : t("header_update_btn")}
            aria-label={updateAvailable ? t("header_update_available") : t("header_update_btn")}
          >
            <Sparkles size={14} className={`mr-1.5 ${updateAvailable ? "text-black animate-pulse" : "text-live"}`} strokeWidth={2.5} />
            <span>{updateAvailable ? t("header_update_available") : t("header_update_btn")}</span>
          </button>

          {/* Dil Değiştirici */}
          <button
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            className="flex h-9 items-center justify-center rounded-none border-2 border-white/20 bg-black px-2.5 font-mono text-xs font-black uppercase text-white hover:border-white/50 hover:bg-white/5 transition-none shadow-[2px_2px_0px_rgba(255,255,255,0.05)] active:translate-y-0.5 active:shadow-none"
            title="Dili Değiştir / Change Language"
            aria-label={`Dili Değiştir, şu anki dil ${lang.toUpperCase()}`}
          >
            <Languages size={15} className="mr-1.5 text-live" aria-hidden />
            {lang.toUpperCase()}
          </button>

          {/* Tema Değiştirici */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-none border-2 border-white/20 bg-black text-white hover:border-white/50 hover:bg-white/5 transition-none shadow-[2px_2px_0px_rgba(255,255,255,0.05)] active:translate-y-0.5 active:shadow-none"
            title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
            aria-label="Temayı Değiştir"
          >
            {theme === "dark" ? (
              <Moon size={15} className="text-live" aria-hidden />
            ) : (
              <Sun size={15} aria-hidden />
            )}
          </button>

          {/* Hızlı Anahtar */}
          <button
            onClick={() => void quickToggle()}
            disabled={toggling}
            className={`btn shrink-0 ml-1 !px-5 !py-2 rounded-none font-mono text-xs font-black uppercase tracking-widest border-2 transition-none active:translate-y-0.5 active:shadow-none ${
              running
                ? "border-alert bg-alert text-black shadow-[3px_3px_0px_#fff] hover:bg-alert/90"
                : "border-live bg-live text-black shadow-[3px_3px_0px_#fff] hover:bg-live/90"
            }`}
            aria-label={running ? t("btn_stop") : t("btn_start")}
          >
            <Power size={15} aria-hidden strokeWidth={3} />
            {running ? t("btn_stop") : t("btn_start")}
          </button>
        </div>
      </header>

      <CompatWarning />

      <div className="flex min-h-0 flex-1 bg-ink/50">
        {/* Sol Menü */}
        <nav aria-label="Ana gezinme" className="flex w-56 shrink-0 flex-col bg-black p-4 border-r-[3px] border-white/20 shadow-[4px_0_0_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Brutalist Matrix Grid Background */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00FF9D 1px, transparent 1px), linear-gradient(90deg, #00FF9D 1px, transparent 1px)', backgroundSize: '1.5rem 1.5rem' }} />
          <ul className="space-y-2 relative z-10">
            {navItems.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => setView(n.id)}
                  aria-current={view === n.id ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left font-mono text-xs uppercase tracking-wider font-bold rounded-none border-2 transition-none active:translate-y-0.5 active:shadow-none ${
                    view === n.id
                      ? "border-live bg-live text-black shadow-[4px_4px_0px_#fff]"
                      : "border-white/10 text-white/60 bg-black/40 hover:border-white/40 hover:text-white hover:bg-white/5 shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
                  }`}
                >
                  <span className={view === n.id ? "text-black" : "text-white/70"}>{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-auto px-2 pt-4 border-t-2 border-white/20 text-xs font-mono uppercase tracking-wider text-white/70 relative z-10">
            <p className="font-bold text-white mb-1">ANTICORE</p>
            <p className="text-white/60">{t("admin_required")}</p>
          </div>
        </nav>

        {/* Ana İçerik */}
        <main key={view} className="fade-up min-w-0 flex-1 overflow-y-auto p-8">
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
            <SettingsView pushLog={pushLog} onOpenWizard={() => setView("wizard")} />
          )}
          {view === "wizard" && (
            <Wizard onComplete={() => setView("dashboard")} pushLog={pushLog} />
          )}
        </main>
      </div>

      {/* Güncelleme Modalı */}
      <UpdateModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onUpdateDetected={(has) => setUpdateAvailable(has ? "available" : null)}
      />
    </div>
  );
}
