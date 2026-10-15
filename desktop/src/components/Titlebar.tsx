import { useState, useEffect } from "react";
import { Minus, Square, X, Plus, ArrowDownCircle, HelpCircle, Palette, Globe, Check } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useI18n, type Language } from "../lib/i18n";
import { isMac, isMobile, isAndroid } from "../lib/platform";
import { api, type Status } from "../lib/tauri";
import BrandLogo from "./BrandLogo";

const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
];

interface Props {
  status: Status | null;
  running: boolean;
  selectedProfile: string;
  updateAvailable: string | null;
  onOpenUpdateModal: () => void;
  onToggleGuide: () => void;
}

export default function Titlebar({
  status,
  running,
  selectedProfile,
  updateAvailable,
  onOpenUpdateModal,
  onToggleGuide,
}: Props) {
  const { theme, setTheme, options } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [isMaximized, setIsMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("0.3.8");
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Tauri window instance lazy-loader (fallback)
  const getWindow = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      return getCurrentWindow();
    } catch {
      return null;
    }
  };

  const handleNextTheme = () => {
    const ids = options.map((o) => o.id);
    const currIdx = Math.max(0, ids.indexOf(theme));
    const next = ids[(currIdx + 1) % ids.length] ?? ids[0];
    setTheme(next);
  };

  const currentThemeObj = options.find((o) => o.id === theme) || options[0];

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void api.getAppVersion().then((v) => {
      if (v) setAppVersion(v);
    }).catch(() => {});

    void api.isWindowMaximized().then((max) => {
      if (!cancelled) setIsMaximized(max);
    }).catch(() => {});

    void getWindow().then((win) => {
      if (!win || cancelled) return;
      void win.isMaximized().then((max) => {
        if (!cancelled) setIsMaximized(max);
      }).catch(() => {});

      void win.onResized(() => {
        if (!cancelled) {
          void win.isMaximized().then(setIsMaximized).catch(() => {});
        }
      }).then((u) => {
        if (cancelled) {
          u();
        } else {
          unlisten = u;
        }
      }).catch(() => {});
    });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async () => {
    try {
      await api.minimizeWindow();
    } catch {
      const win = await getWindow();
      if (win) void win.minimize();
    }
  };

  const handleToggleMaximize = async () => {
    try {
      const max = await api.toggleMaximizeWindow();
      setIsMaximized(max);
    } catch {
      const win = await getWindow();
      if (win) {
        await win.toggleMaximize();
        const max = await win.isMaximized();
        setIsMaximized(max);
      }
    }
  };

  const handleClose = async () => {
    try {
      await api.closeWindow();
    } catch {
      const win = await getWindow();
      if (win) void win.close();
    }
  };

  return (
    <header
      data-tauri-drag-region
      aria-busy={!status}
      onDoubleClick={isMobile || isAndroid ? undefined : handleToggleMaximize}
      className="workspace-titlebar min-h-12 shrink-0 select-none flex items-center justify-between px-3 bg-surface-subtle border-b border-border-brutal relative z-50 text-xs font-mono cursor-default"
    >
      {/* Sol: macOS Traffic Lights + Logo VEYA Sadece Logo (Windows) */}
      <div className="flex items-center gap-3">
        {isMac && (
          <div className="flex items-center gap-2 group pr-1">
            {/* Kırmızı - Kapat */}
            <button
              type="button"
              onClick={handleClose}
              aria-label={lang === "tr" ? "Pencereyi Kapat" : "Close Window"}
              title={lang === "tr" ? "Kapat" : "Close"}
              className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-[0.97]"
            >
              <X size={8} strokeWidth={3} className="text-rose-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {/* Sarı - Simge Durumuna Küçült */}
            <button
              type="button"
              onClick={handleMinimize}
              aria-label={lang === "tr" ? "Küçült" : "Minimize Window"}
              title={lang === "tr" ? "Küçült" : "Minimize"}
              className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-[0.97]"
            >
              <Minus size={8} strokeWidth={3} className="text-amber-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {/* Yeşil - Büyüt / Geri Yükle */}
            <button
              type="button"
              onClick={handleToggleMaximize}
              aria-label={lang === "tr" ? (isMaximized ? "Geri Yükle" : "Büyüt") : (isMaximized ? "Restore" : "Maximize")}
              title={lang === "tr" ? (isMaximized ? "Geri Yükle" : "Büyüt") : (isMaximized ? "Restore" : "Maximize")}
              className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-[0.97]"
            >
              <Plus size={8} strokeWidth={3} className="text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

        {isMac && <div className="h-3.5 w-px bg-white/[0.1] mr-0.5" />}

        {/* Logo & Versiyon */}
        <div className="flex items-center gap-2 pointer-events-none">
          <BrandLogo size={isMobile || isAndroid ? 24 : 22} running={running} showText={false} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-widest text-paper-bright text-xs">
              ANTICORE
            </span>
            <span className="text-[10px] font-mono text-paper-muted font-semibold bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08] tabular-nums">
              v{appVersion}
            </span>
            {/* Mobilde Başlık İçi Canlı Durum Noktası */}
            {(isMobile || isAndroid) && (
              <span
                className={`w-2 h-2 rounded-full ml-0.5 ${
                  running ? "bg-live shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-red-500/80"
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Orta: Canlı Telemetri LED Durum Hapı (Masaüstü) */}
      <div className="pointer-events-none hidden md:flex items-center gap-2 px-3 py-0.5 rounded-full border border-white/[0.06] bg-surface-subtle/80">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-opacity duration-150 ${
            running
              ? "bg-live animate-pulse"
              : "bg-red-500"
          }`}
        />
        <span className="text-xs uppercase tracking-wider text-paper-muted">
          {!status ? ( <span>{lang === "tr" ? "Durum doğrulanamadı" : "Status unverified"}</span> ) : running ? (
            <span className="text-paper-bright">
              <strong className="text-live font-bold">{t("status_active")}</strong> · {
                status?.profile_id === "detached"
                  ? (lang === "tr" ? "Bağımsız" : "Detached")
                  : status?.profile_id === "service"
                  ? (lang === "tr" ? "Servis" : "Service")
                  : (status?.profile_id || selectedProfile)
              }
            </span>
          ) : (
            <span className="text-red-400 font-medium">
              <strong className="text-red-500 font-bold">{t("status_inactive")}</strong> · {t("dash_matrix_sys_standby")}
            </span>
          )}
        </span>
      </div>

      {/* Sağ: Aksiyonlar & Yerel Pencere Kontrolleri */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Güncelleme Bildirimi */}
        {updateAvailable && (
          <button
            onClick={onOpenUpdateModal}
            className="flex items-center gap-1.5 text-xs font-bold text-live bg-live/10 hover:bg-live/20 border border-live/30 px-2 py-0.5 rounded transition-[transform,opacity] duration-150 active:scale-[0.97] cursor-pointer mr-1 animate-pulse"
            title={lang === "tr" ? "Yeni sürüm hazır" : "New version available"}
          >
            <ArrowDownCircle size={12} className="text-live" />
            <span className="hidden sm:inline">{lang === "tr" ? "GÜNCELLE" : "UPDATE"}</span>
          </button>
        )}

        {/* Kılavuz Çekmecesi Butonu */}
        <button
          onClick={onToggleGuide}
          className="h-11 w-10 sm:w-11 flex items-center justify-center rounded text-paper-muted hover:text-paper-bright hover:bg-white/[0.06] transition-transform duration-150 active:scale-[0.97] cursor-pointer"
          title={isMobile || isAndroid ? (lang === "tr" ? "Kullanım Rehberi & Bilgi Bankası" : "User Guide & Knowledge Base") : (lang === "tr" ? "Kullanım Rehberi & Bilgi Bankası (F1)" : "User Guide & Knowledge Base (F1)")}
        >
          <HelpCircle size={15} />
        </button>

        {/* Dil Değiştirici (5 Dil Popover) */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen((v) => !v)}
            className={`h-11 px-2 flex items-center gap-1.5 rounded transition-transform duration-150 active:scale-[0.97] text-xs font-bold cursor-pointer ${
              langMenuOpen
                ? "text-live bg-live/10 border border-live/30"
                : "text-paper-muted hover:text-paper-bright hover:bg-white/[0.06]"
            }`}
            title="Dili Değiştir / Select Language"
          >
            <Globe size={13} className={langMenuOpen ? "text-live" : "text-paper-muted"} />
            <span className="font-mono">{lang.toUpperCase()}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-12 mt-1 w-36 rounded-xl bg-surface-card border border-white/[0.12] shadow-2xl p-1 z-[100] backdrop-blur-md">
              {LANGUAGES.length === 0 ? null : LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLang(item.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    lang === item.code
                      ? "bg-live/15 text-live font-bold"
                      : "text-paper-muted hover:text-paper-bright hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1 py-0.2 rounded text-[10px] font-mono font-bold ${
                      lang === item.code ? "bg-live text-void" : "bg-white/[0.08] text-paper-muted"
                    }`}>
                      {item.label}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {lang === item.code && <Check size={13} className="text-live" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tema Değiştirici (5 Donanım Teması) */}
        <button
          onClick={handleNextTheme}
          className="h-11 px-1.5 flex items-center gap-1 rounded text-paper-muted hover:text-paper-bright hover:bg-white/[0.06] transition-transform duration-150 active:scale-[0.97] cursor-pointer"
          title={lang === "tr" ? `Tema: ${currentThemeObj.name} (Tıkla ve Değiştir)` : `Theme: ${currentThemeObj.name} (Click to Switch)`}
        >
          <Palette size={13} style={{ color: currentThemeObj.accent }} />
          <span className="text-xs font-mono hidden md:inline">{currentThemeObj.name.split(" ")[0]}</span>
        </button>

        {/* Dikey ayırıcı ve Masaüstü Pencere Kontrolleri (Yalnızca Masaüstü Windows/Linux) */}
        {!isMac && !isMobile && !isAndroid && (
          <>
            <div className="h-4 w-px bg-white/[0.1] mx-1" />
            <div className="flex items-center">
              <button
                onClick={handleMinimize}
                className="h-11 w-9 flex items-center justify-center text-paper-muted hover:text-paper-bright hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label={lang === "tr" ? "Küçült" : "Minimize"}
                title={lang === "tr" ? "Küçült" : "Minimize"}
              >
                <Minus size={13} />
              </button>
              <button
                onClick={handleToggleMaximize}
                className="h-11 w-9 flex items-center justify-center text-paper-muted hover:text-paper-bright hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label={lang === "tr" ? (isMaximized ? "Geri Yükle" : "Büyüt") : (isMaximized ? "Restore" : "Maximize")}
                title={lang === "tr" ? (isMaximized ? "Geri Yükle" : "Büyüt") : (isMaximized ? "Restore" : "Maximize")}
              >
                <Square size={11} />
              </button>
              <button
                onClick={handleClose}
                className="h-11 w-9 flex items-center justify-center text-paper-muted hover:text-white hover:bg-alert transition-colors cursor-pointer"
                aria-label={lang === "tr" ? "Kapat" : "Close"}
                title={lang === "tr" ? "Kapat" : "Close"}
              >
                <X size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
