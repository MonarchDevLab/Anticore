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
      pushLog(`[+] başlangıçta çalışma: ${next ? "açık" : "kapalı"}`);
    } catch (e) {
      pushLog(`[!] başlangıç ayarı hatası: ${String(e)}`);
    } finally {
      setStartupBusy(false);
    }
  };

  const handleSaveRepo = (val: string) => {
    setRepoInput(val);
    localStorage.setItem("anticore_github_repo", val);
  };

  const toggleAutoUpdate = (val: boolean) => {
    setAutoUpdate(val);
    localStorage.setItem("anticore_auto_update", val ? "true" : "false");
  };

  const runCompatScan = async () => {
    setCompatBusy(true);
    try {
      const rep = await api.checkCompatibility();
      setCompat(rep);
      const avCnt = rep.av_detected.length;
      const vpnCnt = rep.vpn_detected.length;
      const legCnt = rep.legacy_services.length;
      pushLog(`[*] Uyumluluk taraması: ${avCnt} antivirüs, ${vpnCnt} VPN/adaptör, ${legCnt} eski servis`);
    } catch (e) {
      pushLog(`[!] Uyumluluk taraması hatası: ${String(e)}`);
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
      pushLog(`[*] DNS Testi: ${res}`);
    } catch (e) {
      const err = `Hata: ${String(e)}`;
      setLeakResult(err);
      pushLog(`[!] DNS Test hatası: ${String(e)}`);
    } finally {
      setLeakBusy(false);
    }
  };

  const scanLegacy = async () => {
    setLegacyBusy("scan");
    try {
      const res = await api.scanLegacyServices();
      setLegacyServices(res);
      const installed = res.filter((s) => s.installed).map((s) => s.id);
      setLegacySelected(new Set(installed));
      pushLog(`[*] Eski servis taraması: ${installed.length} kurulu servis bulundu`);
    } catch (e) {
      pushLog(`[!] Servis tarama hatası: ${String(e)}`);
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
      const ids = Array.from(legacySelected);
      const res = await api.cleanupLegacyServices(ids);
      pushLog(`[+] ${res.length} servis temizlendi: ${res.join(", ")}`);
      await scanLegacy();
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
    } catch (e) {
      const msg = String(e);
      setInstallState("error");
      pushLog(`[!] Güncelleme kurulum hatası: ${msg}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="pb-3 border-b border-white/[0.08]">
        <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("settings_title")}</h2>
      </header>

      {/* Görünüm ve Tema */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Monitor size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("settings_theme_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("settings_theme_desc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { id: "system", label: t("settings_theme_system"), icon: Monitor },
            { id: "dark", label: t("settings_theme_dark"), icon: Moon },
            { id: "light", label: t("settings_theme_light"), icon: Sun },
          ].map((item) => {
            const active = theme === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as "system" | "dark" | "light")}
                className={`py-3 px-4 flex flex-col items-center gap-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-live/15 text-live border-live/35 shadow-sm"
                    : "bg-surface-subtle/60 text-paper-muted border-white/[0.06] hover:text-paper hover:border-white/[0.12]"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dil Seçimi */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Languages size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("settings_lang_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("settings_lang_desc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => setLang("tr")}
            className={`py-3 px-4 flex items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              lang === "tr"
                ? "bg-live/15 text-live border-live/35 shadow-sm"
                : "bg-surface-subtle/60 text-paper-muted border-white/[0.06] hover:text-paper hover:border-white/[0.12]"
            }`}
          >
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${lang === "tr" ? "bg-live text-void" : "bg-white/[0.08] text-paper-muted"}`}>TR</span>
            <span>TÜRKÇE ({t("settings_lang_default")})</span>
          </button>
          <button
            onClick={() => setLang("en")}
            className={`py-3 px-4 flex items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              lang === "en"
                ? "bg-live/15 text-live border-live/35 shadow-sm"
                : "bg-surface-subtle/60 text-paper-muted border-white/[0.06] hover:text-paper hover:border-white/[0.12]"
            }`}
          >
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${lang === "en" ? "bg-live text-void" : "bg-white/[0.08] text-paper-muted"}`}>EN</span>
            <span>ENGLISH</span>
          </button>
        </div>
      </section>

      {/* Windows Başlangıcı */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("settings_startup_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("settings_startup_desc")}</p>
          </div>
          <button
            role="switch"
            aria-checked={startup}
            aria-label={t("settings_startup_title")}
            disabled={startupBusy}
            onClick={() => void toggleStartup()}
            className={`toggle-track ${startup ? "is-active" : ""}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Kapatınca Tray'e Küçült */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
              <PictureInPicture2 size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">{t("settings_tray_title")}</h3>
              <p className="text-xs text-paper-muted mt-0.5">{t("settings_tray_desc")}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={trayMinimize}
            aria-label={t("settings_tray_title")}
            disabled={trayBusy}
            onClick={() => void toggleTrayMinimize()}
            className={`toggle-track ${trayMinimize ? "is-active" : ""}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Motor Savunma Katmanları */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <ShieldCheck size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("settings_defense_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("settings_defense_desc")}</p>
          </div>
        </div>

        {config === null ? (
          <p className="flex items-center gap-2 text-xs text-paper-muted">
            <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={2.5} />
            <span>{t("loading")}</span>
          </p>
        ) : (
          <div className="space-y-3 pt-1">
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

      {/* Uyumluluk ve Güvenlik Raporu */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warn/10 border border-warn/25 text-warn">
              <AlertTriangle size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">{t("settings_compat_title")}</h3>
              <p className="text-xs text-paper-muted mt-0.5">{t("settings_compat_desc")}</p>
            </div>
          </div>
          <button
            className="btn btn-secondary text-xs self-start sm:self-auto"
            onClick={() => void runCompatScan()}
            disabled={compatBusy}
          >
            {compatBusy ? <LoaderCircle size={14} className="animate-spin text-live" strokeWidth={2.5} /> : <RefreshCw size={14} strokeWidth={2} />}
            <span>{t("btn_scan")}</span>
          </button>
        </div>

        {compat && (
          <div className="space-y-3 pt-1 text-xs">
            {compat.av_detected.length === 0 &&
            compat.vpn_detected.length === 0 &&
            compat.legacy_services.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-live/30 bg-live/10 p-3 text-live">
                <CheckCircle2 size={16} strokeWidth={2} />
                <span className="font-semibold">{t("settings_compat_clean")}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {compat.av_detected.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/10 p-3.5 text-warn">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={2} />
                    <div>
                      <p className="font-semibold">{t("settings_compat_av_found")}: {compat.av_detected.join(", ")}</p>
                      <p className="text-xs mt-1 text-paper-muted">{t("settings_compat_av_hint")}</p>
                    </div>
                  </div>
                )}

                {compat.legacy_services.length > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-alert/30 bg-alert/10 p-3.5 text-alert">
                    <div>
                      <p className="font-semibold">{t("settings_compat_legacy_found")}: {compat.legacy_services.join(", ")}</p>
                      <p className="text-xs mt-1 text-paper-muted">{t("settings_compat_legacy_hint")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Legacy Servis Tarayıcısı */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-alert/10 border border-alert/25 text-alert">
              <Trash2 size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">{t("settings_legacy_title")}</h3>
              <p className="text-xs text-paper-muted mt-0.5">{t("settings_legacy_desc")}</p>
            </div>
          </div>
          <button
            className="btn btn-secondary text-xs self-start sm:self-auto"
            onClick={() => void scanLegacy()}
            disabled={legacyBusy !== null}
          >
            {legacyBusy === "scan" ? <LoaderCircle size={14} className="animate-spin" strokeWidth={2.5} /> : <RefreshCw size={14} strokeWidth={2} />}
            <span>{t("btn_scan")}</span>
          </button>
        </div>

        {legacyServices && (
          <div className="space-y-2 pt-1">
            {legacyServices.filter((s) => s.installed).length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-live/30 bg-live/10 p-3 text-xs text-live">
                <CheckCircle2 size={16} strokeWidth={2} />
                <span className="font-semibold">{t("settings_legacy_none")}</span>
              </div>
            ) : (
              <>
                {legacyServices
                  .filter((s) => s.installed)
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-subtle/50 p-3 text-xs hover:border-white/[0.14] transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={legacySelected.has(s.id)}
                        onChange={() => toggleLegacySelected(s.id)}
                        className="w-4 h-4 accent-alert rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-paper-bright">{s.name}</p>
                        <p className="text-xs text-paper-muted font-mono">{s.id} — {s.status}</p>
                      </div>
                    </label>
                  ))}
                <button
                  className="btn btn-danger text-xs mt-2"
                  onClick={() => void cleanSelectedLegacy()}
                  disabled={legacyBusy !== null || legacySelected.size === 0}
                >
                  {legacyBusy === "clean" ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{t("btn_clean")} ({legacySelected.size})</span>
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* DNS Sızıntı & Çözümleme Testi */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
              <Activity size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">{t("settings_dnscheck_title")}</h3>
              <p className="text-xs text-paper-muted mt-0.5">{t("settings_dnscheck_desc")}</p>
            </div>
          </div>
          <button
            className="btn btn-primary text-xs self-start sm:self-auto"
            onClick={() => void runDnsLeakTest()}
            disabled={leakBusy}
          >
            {leakBusy ? <LoaderCircle size={14} className="animate-spin text-void" strokeWidth={2.5} /> : <Radio size={14} strokeWidth={2} />}
            <span>{t("btn_test")}</span>
          </button>
        </div>
        {leakResult && (
          <p className="font-mono text-xs p-3 rounded-xl bg-live/10 text-live border border-live/30">
            {leakResult}
          </p>
        )}
      </section>

      {/* GitHub Güncelleyici & Dağıtım */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
              <Download size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">{t("settings_updates_title")}</h3>
              <p className="text-xs text-paper-muted mt-0.5">{t("settings_updates_desc")}</p>
            </div>
          </div>
          <button
            className="btn btn-secondary text-xs shrink-0 self-start sm:self-auto"
            onClick={() => void checkUpdate()}
            disabled={updState === "checking"}
          >
            {updState === "checking" ? (
              <LoaderCircle size={14} className="animate-spin text-live" strokeWidth={2.5} />
            ) : (
              <RefreshCw size={14} strokeWidth={2} />
            )}
            <span>{t("settings_check_updates_btn")}</span>
          </button>
        </div>

        {/* Depo Yapılandırması & Otomatik Kontrol */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div>
            <label className="block text-xs font-semibold text-paper-muted mb-1.5">
              {t("settings_repo_label")}
            </label>
            <div className="relative">
              <GitBranch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-faint" />
              <input
                value={repoInput}
                onChange={(e) => handleSaveRepo(e.target.value)}
                placeholder="MonarchDevLab/Anticore"
                className="input pl-9 text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-subtle/50 p-3.5 border border-white/[0.06]">
            <div>
              <p className="text-xs font-bold text-paper-bright">{t("settings_autocheck_title")}</p>
              <p className="text-[11px] text-paper-muted">{t("settings_autocheck_desc")}</p>
            </div>
            <button
              role="switch"
              aria-checked={autoUpdate}
              onClick={() => toggleAutoUpdate(!autoUpdate)}
              className={`toggle-track ${autoUpdate ? "is-active" : ""}`}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Sonuç Kartı */}
        {updState === "done" && updInfo && (
          <div className="rounded-xl border border-white/[0.08] bg-surface-subtle/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                {updInfo.has_update ? (
                  <span className="badge badge-live flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> {t("settings_update_available")}
                  </span>
                ) : (
                  <span className="badge badge-muted flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-live" /> {t("settings_update_current")}
                  </span>
                )}
              </div>
              {updInfo.published_at && (
                <span className="font-mono text-[11px] text-paper-faint">
                  {new Date(updInfo.published_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {updInfo.has_update && updInfo.release_notes && (
              <div className="rounded-xl bg-void/60 p-3 border border-white/[0.06]">
                <p className="text-xs font-semibold text-paper-muted mb-1">{t("settings_release_notes")}:</p>
                <div className="font-mono text-[11px] text-paper max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {updInfo.release_notes}
                </div>
              </div>
            )}

            {updInfo.has_update && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => void installUpdate()}
                  disabled={installState === "installing"}
                  className="btn btn-primary text-xs"
                >
                  {installState === "installing" ? (
                    <LoaderCircle size={14} className="animate-spin text-void" strokeWidth={2.5} />
                  ) : (
                    <Download size={14} strokeWidth={2} />
                  )}
                  <span>
                    {installState === "installing"
                      ? installProgress && installProgress.total > 0
                        ? `${t("settings_downloading")}… ${Math.round((installProgress.downloaded / installProgress.total) * 100)}%`
                        : `${t("settings_downloading")}…`
                      : t("settings_update_now_btn")}
                  </span>
                </button>
                {updInfo.download_url && (
                  <button
                    onClick={() => void api.openBrowserUrl(updInfo.download_url!)}
                    className="btn btn-secondary text-xs"
                  >
                    <Download size={13} /> <span>{t("settings_manual_download_btn")}</span>
                  </button>
                )}
                <button
                  onClick={() => void api.openBrowserUrl(updInfo.html_url)}
                  className="btn btn-secondary text-xs"
                >
                  <ExternalLink size={13} /> <span>{t("settings_release_page_btn")}</span>
                </button>
              </div>
            )}
            {installState === "error" && (
              <p className="text-xs text-alert bg-alert/10 p-3 rounded-xl border border-alert/25 font-semibold">
                {t("settings_install_failed")}
              </p>
            )}
          </div>
        )}

        {updState === "error" && updError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-alert/10 p-3.5 text-xs text-alert border border-alert/25">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <p className="font-semibold">{t("settings_update_check_failed")}</p>
              <p className="mt-0.5 text-xs text-paper-muted">{updError}</p>
            </div>
          </div>
        )}
      </section>

      {/* Fabrika Sıfırlama */}
      <section className="card p-5 lg:p-6 border border-alert/30 rounded-2xl bg-surface-card space-y-3 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-alert/10 border border-alert/25 text-alert">
            <RotateCcw size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-alert">{t("settings_factory_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("settings_factory_desc")}</p>
          </div>
        </div>
        <button
          className="btn btn-danger text-xs mt-2"
          onClick={() => setFactoryConfirm(true)}
          disabled={factoryBusy}
        >
          {factoryBusy ? <LoaderCircle size={14} className="animate-spin" strokeWidth={2.5} /> : <RotateCcw size={14} strokeWidth={2} />}
          <span>{t("settings_factory_btn")}</span>
        </button>
      </section>

      {/* Güvenlik Modeli */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-3 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Lock size={18} aria-hidden strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-live">{t("settings_security_title")}</h3>
        </div>
        <ul className="list-disc space-y-2 pl-5 text-xs leading-relaxed text-paper-muted">
          <li>{t("settings_security_1")}</li>
          <li>{t("settings_security_2")}</li>
          <li>{t("settings_security_3")}</li>
        </ul>
      </section>

      {/* Kurulum Sihirbazı */}
      {onOpenWizard && (
        <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("settings_rerun_wizard_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("settings_rerun_wizard_desc")}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary text-xs self-start sm:self-auto"
            onClick={onOpenWizard}
          >
            <span>{t("settings_rerun_wizard_btn")}</span>
          </button>
        </section>
      )}

      {/* Hakkında */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-3 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Info size={18} aria-hidden strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-paper-bright">{t("settings_about_title")}</h3>
        </div>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-xs">
          <dt className="text-paper-muted font-medium">{t("settings_about_engine")}</dt>
          <dd className="text-paper-bright font-mono">{t("settings_about_engine_value")}</dd>
          <dt className="text-paper-muted font-medium">{t("settings_about_license")}</dt>
          <dd className="text-paper-bright font-semibold">MIT License — Monolith Works</dd>
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
    <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-subtle/50 p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all">
      <div className="min-w-0">
        <p className="text-xs font-bold text-paper-bright">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-paper-muted">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={busy}
        onClick={() => onChange(!checked)}
        className={`toggle-track ${checked ? "is-active" : ""}`}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}
