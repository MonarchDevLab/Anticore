import { useEffect, useState } from "react";
import {
  Download,
  Info,
  LoaderCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Radio,
  Monitor,
  Moon,
  Sun,
  Languages,
  Activity,
  GitBranch,
  ExternalLink,
  PictureInPicture2,
  RotateCcw,
} from "lucide-react";
import {
  api,
  downloadAndInstallUpdate,
  type EngineConfig,
  type CompatReport,
  type LegacyServiceDto,
  type UpdateInfoDto,
} from "../lib/tauri";
import { useTheme } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import ConfirmDialog from "../components/ConfirmDialog";

export default function SettingsView({
  pushLog,
  onOpenWizard,
}: {
  pushLog: (l: string) => void;
  onOpenWizard?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [cfgBusy, setCfgBusy] = useState<string | null>(null);

  // GitHub Updater State
  const [repoInput, setRepoInput] = useState(() => localStorage.getItem("anticore_github_repo") || "MonarchDevLab/Anticore");
  const [autoUpdate, setAutoUpdate] = useState(() => localStorage.getItem("anticore_auto_update") === "true");
  const [updState, setUpdState] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [updInfo, setUpdInfo] = useState<UpdateInfoDto | null>(null);
  const [updError, setUpdError] = useState<string | null>(null);
  const [installState, setInstallState] = useState<"idle" | "installing" | "error">("idle");
  const [installProgress, setInstallProgress] = useState<{ downloaded: number; total: number } | null>(null);

  const [startup, setStartup] = useState<boolean>(false);
  const [startupBusy, setStartupBusy] = useState<boolean>(false);

  const [compat, setCompat] = useState<CompatReport | null>(null);
  const [compatBusy, setCompatBusy] = useState<boolean>(false);

  const [leakResult, setLeakResult] = useState<string | null>(null);
  const [leakBusy, setLeakBusy] = useState<boolean>(false);

  // Kuru legacy servis tarayıcısı: önce liste, kullanıcı seçer, sonra sil.
  const [legacyServices, setLegacyServices] = useState<LegacyServiceDto[] | null>(null);
  const [legacySelected, setLegacySelected] = useState<Set<string>>(new Set());
  const [legacyBusy, setLegacyBusy] = useState<"scan" | "clean" | null>(null);

  const [trayMinimize, setTrayMinimize] = useState<boolean>(true);
  const [trayBusy, setTrayBusy] = useState<boolean>(false);

  const [factoryConfirm, setFactoryConfirm] = useState(false);
  const [factoryBusy, setFactoryBusy] = useState(false);

  useEffect(() => {
    void api.getEngineConfig().then(setConfig);
    void api.getStartupEnabled().then(setStartup);
    void api.getTrayMinimize().then(setTrayMinimize).catch(() => {});
  }, []);

  const patchConfig = async (patch: Partial<EngineConfig>) => {
    if (!config) return;
    setCfgBusy(Object.keys(patch)[0]);
    const next = { ...config, ...patch };
    try {
      await api.setEngineConfig(next);
      setConfig(next);
      pushLog(`[+] ayar güncellendi: ${Object.keys(patch)[0]}`);
    } catch (e) {
      pushLog(`[!] ayar hatası: ${String(e)}`);
    } finally {
      setCfgBusy(null);
    }
  };

  const toggleStartup = async () => {
    setStartupBusy(true);
    const next = !startup;
    try {
      await api.setStartupEnabled(next);
      setStartup(next);
      pushLog(`[+] Başlangıç ayarı: ${next ? "açık" : "kapalı"}`);
    } catch (e) {
      pushLog(`[!] Başlangıç ayarı hatası: ${String(e)}`);
    } finally {
      setStartupBusy(false);
    }
  };

  const toggleAutoUpdate = (v: boolean) => {
    setAutoUpdate(v);
    localStorage.setItem("anticore_auto_update", v ? "true" : "false");
    pushLog(`[+] Otomatik güncelleme denetimi: ${v ? "açık" : "kapalı"}`);
  };

  const handleSaveRepo = (val: string) => {
    setRepoInput(val);
    localStorage.setItem("anticore_github_repo", val);
  };

  const runCompatScan = async () => {
    setCompatBusy(true);
    try {
      const report = await api.checkCompatibility();
      setCompat(report);
      pushLog("[i] Uyumluluk taraması tamamlandı");
    } catch (e) {
      pushLog(`[!] Uyumluluk tarama hatası: ${String(e)}`);
    } finally {
      setCompatBusy(false);
    }
  };

  const runDnsLeakTest = async () => {
    setLeakBusy(true);
    setLeakResult(null);
    try {
      const res = await api.dnsLeakTest();
      setLeakResult(res);
      pushLog(`[i] DNS test: ${res}`);
    } catch (e) {
      setLeakResult(`${t("settings_error_prefix")}: ${String(e)}`);
    } finally {
      setLeakBusy(false);
    }
  };

  const scanLegacy = async () => {
    setLegacyBusy("scan");
    try {
      const found = await api.scanLegacyServices();
      setLegacyServices(found);
      setLegacySelected(new Set(found.filter((s) => s.installed).map((s) => s.id)));
    } catch (e) {
      pushLog(`[!] Servis taraması hatası: ${String(e)}`);
    } finally {
      setLegacyBusy(null);
    }
  };

  const toggleLegacySelected = (id: string) => {
    setLegacySelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cleanSelectedLegacy = async () => {
    if (legacySelected.size === 0) return;
    setLegacyBusy("clean");
    try {
      const cleaned = await api.cleanupLegacyServices(Array.from(legacySelected));
      pushLog(`[+] ${cleaned.length} eski servis kaldırıldı: ${cleaned.join(", ") || "—"}`);
      await scanLegacy();
      await runCompatScan();
    } catch (e) {
      pushLog(`[!] Servis temizleme hatası: ${String(e)}`);
    } finally {
      setLegacyBusy(null);
    }
  };

  const toggleTrayMinimize = async () => {
    setTrayBusy(true);
    const next = !trayMinimize;
    try {
      await api.setTrayMinimize(next);
      setTrayMinimize(next);
      pushLog(`[+] Tray'e küçültme: ${next ? "açık" : "kapalı"}`);
    } catch (e) {
      pushLog(`[!] Tray ayarı hatası: ${String(e)}`);
    } finally {
      setTrayBusy(false);
    }
  };

  const runFactoryReset = async () => {
    setFactoryBusy(true);
    try {
      await api.factoryReset();
      // Backend yalnızca disk dosyalarını (blacklist/profiles/config) sıfırlar;
      // tema/dil/onboarding gibi arayüz tercihleri localStorage'da tutulur —
      // "fabrika ayarları" ikisini de kapsamalı.
      localStorage.clear();
      pushLog("[*] Fabrika ayarlarına dönüldü, uygulama yeniden başlatılıyor...");
      window.location.reload();
    } catch (e) {
      pushLog(`[!] Fabrika sıfırlama hatası: ${String(e)}`);
    } finally {
      setFactoryBusy(false);
      setFactoryConfirm(false);
    }
  };

  const checkUpdate = async () => {
    setUpdState("checking");
    setUpdInfo(null);
    setUpdError(null);
    try {
      pushLog(`[*] GitHub güncellemeleri denetleniyor: ${repoInput}...`);
      const info = await api.checkUpdate(repoInput.trim());
      setUpdInfo(info);
      setUpdState("done");
      if (info.has_update) {
        pushLog(`[+] Yeni güncelleme bulundu.`);
      } else {
        pushLog(`[i] Sistem güncel.`);
      }
    } catch (e) {
      const msg = String(e);
      setUpdError(msg);
      setUpdState("error");
      pushLog(`[!] Güncelleme denetleme hatası: ${msg}`);
    }
  };

  const installUpdate = async () => {
    setInstallState("installing");
    setInstallProgress(null);
    try {
      pushLog("[*] Güncelleme indiriliyor ve kuruluyor...");
      await downloadAndInstallUpdate((downloaded, total) => {
        setInstallProgress({ downloaded, total });
      });
      // downloadAndInstallUpdate başarılıysa uygulama relaunch() ile
      // yeniden başlar; buraya normal şartlarda dönülmez.
    } catch (e) {
      const msg = String(e);
      setInstallState("error");
      pushLog(`[!] Güncelleme kurulum hatası: ${msg}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b-2 border-white/20 pb-4">
        <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-white">{t("settings_title")}</h2>
      </header>

      {/* Görünüm ve Tema */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <h3 className="flex items-center gap-3 font-mono text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-3">
          <Monitor size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          {t("settings_theme_title")}
        </h3>
        <p className="mt-2 text-xs font-mono text-white/60">{t("settings_theme_desc")}</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme("system")}
            className={`btn !py-3 flex flex-col items-center gap-2 rounded-none border-2 font-mono text-xs uppercase tracking-wider font-bold transition-none active:translate-y-0.5 active:shadow-none ${
              theme === "system"
                ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                : "border-white/20 bg-black text-white/60 hover:border-white/50 hover:text-white shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
            }`}
          >
            <Monitor size={18} strokeWidth={2.5} />
            <span>{t("settings_theme_system")}</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`btn !py-3 flex flex-col items-center gap-2 rounded-none border-2 font-mono text-xs uppercase tracking-wider font-bold transition-none active:translate-y-0.5 active:shadow-none ${
              theme === "dark"
                ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                : "border-white/20 bg-black text-white/60 hover:border-white/50 hover:text-white shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
            }`}
          >
            <Moon size={18} strokeWidth={2.5} />
            <span>{t("settings_theme_dark")}</span>
          </button>

          <button
            onClick={() => setTheme("light")}
            className={`btn !py-3 flex flex-col items-center gap-2 rounded-none border-2 font-mono text-xs uppercase tracking-wider font-bold transition-none active:translate-y-0.5 active:shadow-none ${
              theme === "light"
                ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                : "border-white/20 bg-black text-white/60 hover:border-white/50 hover:text-white shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
            }`}
          >
            <Sun size={18} strokeWidth={2.5} />
            <span>{t("settings_theme_light")}</span>
          </button>
        </div>
      </section>

      {/* Dil Seçimi */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <h3 className="flex items-center gap-3 font-mono text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-3">
          <Languages size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          {t("settings_lang_title")}
        </h3>
        <p className="mt-2 text-xs font-mono text-white/60">{t("settings_lang_desc")}</p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setLang("tr")}
            className={`btn flex-1 !py-3 rounded-none border-2 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider font-bold transition-none active:translate-y-0.5 active:shadow-none ${
              lang === "tr"
                ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                : "border-white/20 bg-black text-white/60 hover:border-white/50 hover:text-white shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
            }`}
          >
            <span className={`font-mono text-[11px] font-black px-1.5 py-0.5 border ${lang === "tr" ? "bg-black text-white border-black" : "bg-live/20 text-live border-live/40"}`}>TR</span>
            <span>TÜRKÇE ({t("settings_lang_default")})</span>
          </button>
          <button
            onClick={() => setLang("en")}
            className={`btn flex-1 !py-3 rounded-none border-2 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider font-bold transition-none active:translate-y-0.5 active:shadow-none ${
              lang === "en"
                ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                : "border-white/20 bg-black text-white/60 hover:border-white/50 hover:text-white shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
            }`}
          >
            <span className={`font-mono text-[11px] font-black px-1.5 py-0.5 border ${lang === "en" ? "bg-black text-white border-black" : "bg-live/20 text-live border-live/40"}`}>EN</span>
            <span>ENGLISH</span>
          </button>
        </div>
      </section>

      {/* Windows Başlangıcı */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("settings_startup_title")}</h3>
            <p className="mt-1 text-xs font-mono text-white/60">{t("settings_startup_desc")}</p>
          </div>
          <button
            role="switch"
            aria-checked={startup}
            aria-label={t("settings_startup_title")}
            disabled={startupBusy}
            onClick={() => void toggleStartup()}
            className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-none border-2 transition-none active:translate-y-0.5 ${
              startup ? "border-live bg-live text-black" : "border-white/30 bg-black text-white/50"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-0.5 h-4 w-5 rounded-none transition-transform ${
                startup ? "translate-x-5 bg-black" : "translate-x-0.5 bg-white/60"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Kapatınca Tray'e Küçült */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PictureInPicture2 size={18} className="text-live" aria-hidden strokeWidth={2.5} />
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("settings_tray_title")}</h3>
              <p className="mt-1 text-xs font-mono text-white/60">{t("settings_tray_desc")}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={trayMinimize}
            aria-label={t("settings_tray_title")}
            disabled={trayBusy}
            onClick={() => void toggleTrayMinimize()}
            className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-none border-2 transition-none active:translate-y-0.5 ${
              trayMinimize ? "border-live bg-live text-black" : "border-white/30 bg-black text-white/50"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-0.5 h-4 w-5 rounded-none transition-transform ${
                trayMinimize ? "translate-x-5 bg-black" : "translate-x-0.5 bg-white/60"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Motor Savunma Katmanları */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <h3 className="flex items-center gap-3 font-mono text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-3">
          <ShieldCheck size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          {t("settings_defense_title")}
        </h3>
        <p className="mt-2 text-xs font-mono text-white/60">{t("settings_defense_desc")}</p>

        {config === null ? (
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-white/50">
            <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={3} />
            {t("loading")}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <Toggle
              label={t("settings_passive_rst")}
              desc={t("settings_passive_rst_desc")}
              checked={config.pasif_savunma}
              busy={cfgBusy === "pasif_savunma"}
              onChange={(v) => void patchConfig({ pasif_savunma: v })}
            />
            <Toggle
              label={t("settings_quic")}
              desc={t("settings_quic_desc")}
              checked={config.quic_engelle}
              busy={cfgBusy === "quic_engelle"}
              onChange={(v) => void patchConfig({ quic_engelle: v })}
            />
          </div>
        )}
      </section>

      {/* Uyumluluk ve Güvenlik Raporu (Kaspersky, WARP, Eski Servisler) */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-warn" aria-hidden strokeWidth={2.5} />
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                {t("settings_compat_title")}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-white/60">{t("settings_compat_desc")}</p>
            </div>
          </div>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-2"
            onClick={() => void runCompatScan()}
            disabled={compatBusy}
          >
            {compatBusy ? <LoaderCircle size={14} className="animate-spin text-live" strokeWidth={3} /> : <RefreshCw size={14} strokeWidth={2.5} />}
            {t("btn_scan")}
          </button>
        </div>

        {compat && (
          <div className="mt-4 space-y-3 font-mono text-xs">
            {compat.av_detected.length === 0 &&
            compat.vpn_detected.length === 0 &&
            compat.legacy_services.length === 0 ? (
              <div className="flex items-center gap-2 border-2 border-live/50 bg-black p-3 text-live shadow-[2px_2px_0px_rgba(5,150,105,0.2)]">
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span className="font-bold uppercase tracking-wider">{t("settings_compat_clean")}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {compat.av_detected.length > 0 && (
                  <div className="flex items-start gap-2 border-2 border-warn/50 bg-black p-3 text-warn shadow-[2px_2px_0px_rgba(255,204,0,0.2)]">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={2.5} />
                    <div>
                      <p className="font-bold uppercase tracking-wider">{t("settings_compat_av_found")}: {compat.av_detected.join(", ")}</p>
                      <p className="text-xs mt-1 text-white/60">
                        {t("settings_compat_av_hint")}
                      </p>
                    </div>
                  </div>
                )}

                {compat.legacy_services.length > 0 && (
                  <div className="flex items-center justify-between border-2 border-alert/50 bg-black p-3 text-alert shadow-[2px_2px_0px_rgba(255,51,102,0.2)]">
                    <div>
                      <p className="font-bold uppercase tracking-wider">{t("settings_compat_legacy_found")}: {compat.legacy_services.join(", ")}</p>
                      <p className="text-xs mt-1 text-white/60">{t("settings_compat_legacy_hint")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Kuru Legacy Servis Tarayıcısı — önce liste, kullanıcı seçer, sonra sil */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-alert" aria-hidden strokeWidth={2.5} />
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                {t("settings_legacy_title")}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-white/60">{t("settings_legacy_desc")}</p>
            </div>
          </div>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-2"
            onClick={() => void scanLegacy()}
            disabled={legacyBusy !== null}
          >
            {legacyBusy === "scan" ? <LoaderCircle size={14} className="animate-spin text-live" strokeWidth={3} /> : <RefreshCw size={14} strokeWidth={2.5} />}
            {t("btn_scan")}
          </button>
        </div>

        {legacyServices && (
          <div className="mt-4 space-y-2 font-mono">
            {legacyServices.filter((s) => s.installed).length === 0 ? (
              <div className="flex items-center gap-2 border-2 border-live/50 bg-black p-3 text-xs text-live shadow-[2px_2px_0px_rgba(5,150,105,0.2)]">
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span className="font-bold uppercase tracking-wider">{t("settings_legacy_none")}</span>
              </div>
            ) : (
              <>
                {legacyServices
                  .filter((s) => s.installed)
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-none border-2 border-white/10 bg-black p-3 text-xs shadow-[2px_2px_0px_rgba(255,255,255,0.03)]"
                    >
                      <input
                        type="checkbox"
                        checked={legacySelected.has(s.id)}
                        onChange={() => toggleLegacySelected(s.id)}
                        className="rounded-none border-2 border-white/40 bg-black text-alert focus:ring-0"
                      />
                      <div className="min-w-0 flex-1 font-mono">
                        <p className="font-bold text-white uppercase tracking-wider">{s.name}</p>
                        <p className="text-xs text-white/50">{s.id} — {s.status}</p>
                      </div>
                    </label>
                  ))}
                <button
                  className="btn rounded-none border-2 border-alert bg-alert text-black hover:bg-alert/90 font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 mt-2 transition-none flex items-center gap-2"
                  onClick={() => void cleanSelectedLegacy()}
                  disabled={legacyBusy !== null || legacySelected.size === 0}
                >
                  {legacyBusy === "clean" ? <LoaderCircle size={13} className="animate-spin" strokeWidth={3} /> : <Trash2 size={13} strokeWidth={2.5} />}
                  {t("btn_clean")} ({legacySelected.size})
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* DNS Sızıntı & Çözümleme Testi */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-live" aria-hidden strokeWidth={2.5} />
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                {t("settings_dnscheck_title")}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-white/60">{t("settings_dnscheck_desc")}</p>
            </div>
          </div>
          <button
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-1.5 transition-none flex items-center gap-2"
            onClick={() => void runDnsLeakTest()}
            disabled={leakBusy}
          >
            {leakBusy ? <LoaderCircle size={14} className="animate-spin text-black" strokeWidth={3} /> : <Radio size={14} strokeWidth={2.5} />}
            {t("btn_test")}
          </button>
        </div>
        {leakResult && (
          <p className="mt-4 font-mono text-xs p-3 rounded-none bg-black text-live border-2 border-live/50 shadow-[2px_2px_0px_rgba(5,150,105,0.3)]">
            {leakResult}
          </p>
        )}
      </section>

      {/* GitHub Güncelleyici & Dağıtım */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <Download size={18} className="text-live" aria-hidden strokeWidth={2.5} />
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                {t("settings_updates_title")}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-white/60">{t("settings_updates_desc")}</p>
            </div>
          </div>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-2 shrink-0"
            onClick={() => void checkUpdate()}
            disabled={updState === "checking"}
          >
            {updState === "checking" ? (
              <LoaderCircle size={15} className="animate-spin text-live" aria-hidden strokeWidth={3} />
            ) : (
              <RefreshCw size={15} aria-hidden strokeWidth={2.5} />
            )}
            {t("settings_check_updates_btn")}
          </button>
        </div>

        {/* Depo Yapılandırması & Otomatik Kontrol */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1 font-mono">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-white/50 mb-1">
              {t("settings_repo_label")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <GitBranch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={repoInput}
                  onChange={(e) => handleSaveRepo(e.target.value)}
                  placeholder="MonarchDevLab/Anticore"
                  className="w-full rounded-none border-2 border-white/20 bg-black pl-9 pr-3 py-1.5 font-mono text-xs text-white focus:border-live shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-none bg-black p-3 border-2 border-white/10 shadow-[2px_2px_0px_rgba(255,255,255,0.03)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white">{t("settings_autocheck_title")}</p>
              <p className="text-[10px] text-white/50">{t("settings_autocheck_desc")}</p>
            </div>
            <button
              role="switch"
              aria-checked={autoUpdate}
              onClick={() => toggleAutoUpdate(!autoUpdate)}
              className={`relative h-5 w-10 shrink-0 rounded-none border-2 transition-none active:translate-y-0.5 ${
                autoUpdate ? "border-live bg-live text-black" : "border-white/30 bg-black text-white/50"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-4 rounded-none transition-transform ${
                  autoUpdate ? "translate-x-4 bg-black" : "translate-x-0.5 bg-white/60"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sonuç Kartı */}
        {updState === "done" && updInfo && (
          <div className="rounded-none border-2 border-white/20 bg-black p-4 space-y-3 font-mono shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                {updInfo.has_update ? (
                  <span className="flex items-center gap-1.5 font-black uppercase text-live tracking-wider">
                    <CheckCircle2 size={16} strokeWidth={2.5} /> {t("settings_update_available")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-black uppercase text-white/60 tracking-wider">
                    <CheckCircle2 size={16} className="text-live" strokeWidth={2.5} /> {t("settings_update_current")}
                  </span>
                )}
              </div>
              {updInfo.published_at && (
                <span className="font-mono text-[10px] text-white/40">
                  {new Date(updInfo.published_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {updInfo.has_update && updInfo.release_notes && (
              <div className="rounded-none bg-black p-3 border-2 border-white/10">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/80 mb-1">{t("settings_release_notes")}:</p>
                <div className="font-mono text-[11px] text-white/80 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {updInfo.release_notes}
                </div>
              </div>
            )}

            {updInfo.has_update && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => void installUpdate()}
                  disabled={installState === "installing"}
                  className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-1.5 transition-none flex items-center gap-1.5"
                >
                  {installState === "installing" ? (
                    <LoaderCircle size={14} className="animate-spin text-black" strokeWidth={3} />
                  ) : (
                    <Download size={14} strokeWidth={2.5} />
                  )}
                  {installState === "installing"
                    ? installProgress && installProgress.total > 0
                      ? `${t("settings_downloading")}… ${Math.round((installProgress.downloaded / installProgress.total) * 100)}%`
                      : `${t("settings_downloading")}…`
                    : t("settings_update_now_btn")}
                </button>
                {updInfo.download_url && (
                  <button
                    onClick={() => void api.openBrowserUrl(updInfo.download_url!)}
                    className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-1.5"
                  >
                    <Download size={13} /> {t("settings_manual_download_btn")}
                  </button>
                )}
                <button
                  onClick={() => void api.openBrowserUrl(updInfo.html_url)}
                  className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> {t("settings_release_page_btn")}
                </button>
              </div>
            )}
            {installState === "error" && (
              <p className="text-xs text-alert bg-black p-2.5 rounded-none border-2 border-alert font-bold uppercase">
                {t("settings_install_failed")}
              </p>
            )}
          </div>
        )}

        {updState === "error" && updError && (
          <div className="flex items-start gap-2 rounded-none bg-black p-3 text-xs text-alert border-2 border-alert font-mono">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" strokeWidth={2.5} />
            <div>
              <p className="font-black uppercase tracking-wider">{t("settings_update_check_failed")}</p>
              <p className="mt-0.5 text-xs text-white/70">{updError}</p>
            </div>
          </div>
        )}
      </section>

      {/* Fabrika Sıfırlama */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-alert/40 shadow-[6px_6px_0px_rgba(255,51,102,0.1)]">
        <h3 className="flex items-center gap-3 font-mono text-sm font-black uppercase tracking-wider text-alert border-b border-white/10 pb-3">
          <RotateCcw size={18} className="text-alert" aria-hidden strokeWidth={2.5} />
          {t("settings_factory_title")}
        </h3>
        <p className="mt-2 text-xs font-mono text-white/60">{t("settings_factory_desc")}</p>
        <button
          className="btn rounded-none border-2 border-alert bg-alert text-black hover:bg-alert/90 font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 mt-4 transition-none flex items-center gap-2"
          onClick={() => setFactoryConfirm(true)}
          disabled={factoryBusy}
        >
          {factoryBusy ? <LoaderCircle size={14} className="animate-spin text-black" strokeWidth={3} /> : <RotateCcw size={14} strokeWidth={2.5} />}
          {t("settings_factory_btn")}
        </button>
      </section>

      {/* Güvenlik Modeli */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <h3 className="flex items-center gap-3 font-mono text-sm font-black uppercase tracking-wider text-live border-b border-white/10 pb-3">
          <Lock size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          {t("settings_security_title")}
        </h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 font-mono text-xs leading-relaxed text-white/70">
          <li>{t("settings_security_1")}</li>
          <li>{t("settings_security_2")}</li>
          <li>{t("settings_security_3")}</li>
        </ul>
      </section>

      {/* Kurulum Sihirbazı */}
      {onOpenWizard && (
        <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] flex items-center justify-between">
          <div>
            <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("settings_rerun_wizard_title")}</h3>
            <p className="mt-1 text-xs font-mono text-white/60">
              {t("settings_rerun_wizard_desc")}
            </p>
          </div>
          <button
            type="button"
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none"
            onClick={onOpenWizard}
          >
            {t("settings_rerun_wizard_btn")}
          </button>
        </section>
      )}

      {/* Hakkında */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <h3 className="flex items-center gap-3 font-mono text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-3">
          <Info size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          {t("settings_about_title")}
        </h3>
        <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-2 font-mono text-xs">
          <dt className="text-white/50 uppercase tracking-wider font-bold">{t("settings_about_engine")}</dt>
          <dd className="text-white font-medium">{t("settings_about_engine_value")}</dd>
          <dt className="text-white/50 uppercase tracking-wider font-bold">{t("settings_about_license")}</dt>
          <dd className="text-white font-black">MIT</dd>
        </dl>
      </section>

      <ConfirmDialog
        open={factoryConfirm}
        title={t("settings_factory_confirm_title")}
        body={t("settings_factory_confirm_body")}
        confirmLabel={t("settings_factory_btn")}
        danger
        busy={factoryBusy}
        onConfirm={() => void runFactoryReset()}
        onCancel={() => setFactoryConfirm(false)}
      />
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  busy,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  busy: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-none bg-black p-4 border-2 border-white/10 shadow-[2px_2px_0px_rgba(255,255,255,0.03)]">
      <div className="min-w-0">
        <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">{label}</p>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/50">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={busy}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-none border-2 transition-none active:translate-y-0.5 ${
          checked ? "border-live bg-live text-black" : "border-white/30 bg-black text-white/50"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 h-4 w-5 rounded-none transition-transform ${
            checked ? "translate-x-5 bg-black" : "translate-x-0.5 bg-white/60"
          }`}
        />
      </button>
    </div>
  );
}
