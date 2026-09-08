import { useState, useEffect } from "react";
import { ShieldCheck, Minus, Square, X, ArrowDownCircle, HelpCircle, Palette, Globe } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { api, type Status } from "../lib/tauri";

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
    void api.isWindowMaximized().then(setIsMaximized).catch(() => {});
    let unlisten: (() => void) | undefined;
    void getWindow().then((win) => {
      if (!win) return;
      void win.isMaximized().then(setIsMaximized).catch(() => {});
      void win.onResized(() => {
        void win.isMaximized().then(setIsMaximized).catch(() => {});
      }).then((u) => {
        unlisten = u;
      }).catch(() => {});
    });
    return () => {
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
      className="h-10 shrink-0 select-none flex items-center justify-between px-3 bg-surface-subtle border-b border-border-brutal relative z-50 text-xs font-mono"
    >
      {/* Sol: Logo & Marka Donanım Etiketi */}
      <div className="flex items-center gap-2.5 pointer-events-none">
        <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
          running
            ? "border-live/40 bg-live/15 text-live shadow-[0_0_12px_rgba(0,245,155,0.3)]"
            : "border-white/[0.1] bg-surface-card text-paper-muted"
        }`}>
          <ShieldCheck size={13} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-widest text-paper-bright text-[11px]">
            ANTICORE
          </span>
          <span className="text-[10px] text-paper-faint tracking-wider hidden sm:inline">
            // KERNEL ENGINE
          </span>
        </div>
      </div>

      {/* Orta: Canlı Telemetri LED Durum Hapı */}
      <div className="pointer-events-none hidden md:flex items-center gap-2 px-3 py-0.5 rounded-full border border-white/[0.06] bg-surface-subtle/80">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-all ${
            running ? "bg-live shadow-[0_0_8px_#00F59B] animate-pulse" : "bg-paper-faint"
          }`}
        />
        <span className="text-[10px] uppercase tracking-wider text-paper-muted">
          {running ? (
            <span className="text-paper-bright">
              <strong className="text-live font-bold">{t("status_active")}</strong> · {status?.profile_id || selectedProfile}
            </span>
          ) : (
            <span>{t("status_inactive")} · STANDBY</span>
          )}
        </span>
      </div>

      {/* Sağ: Aksiyonlar & Yerel Pencere Kontrolleri */}
      <div className="flex items-center gap-1">
        {/* Güncelleme Bildirimi */}
        {updateAvailable && (
          <button
            onClick={onOpenUpdateModal}
            className="flex items-center gap-1.5 text-[10px] font-bold text-live bg-live/10 hover:bg-live/20 border border-live/30 px-2 py-0.5 rounded transition-all cursor-pointer mr-1"
            title="Yeni sürüm hazır"
          >
            <ArrowDownCircle size={12} className="text-live" />
            <span className="hidden sm:inline">GÜNCELLE</span>
          </button>
        )}

        {/* Kılavuz Çekmecesi Butonu */}
        <button
          onClick={onToggleGuide}
          className="h-7 w-7 flex items-center justify-center rounded text-paper-muted hover:text-paper-bright hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Kullanım Rehberi & Bilgi Bankası (F1)"
        >
          <HelpCircle size={14} />
        </button>

        {/* Dil Değiştirici */}
        <button
          onClick={() => setLang(lang === "tr" ? "en" : "tr")}
          className="h-7 px-1.5 flex items-center gap-1 rounded text-paper-muted hover:text-paper-bright hover:bg-white/[0.06] transition-colors text-[10px] font-bold cursor-pointer"
          title="Dili Değiştir / Switch Language"
        >
          <Globe size={12} />
          <span>{lang.toUpperCase()}</span>
        </button>

        {/* Tema Değiştirici (5 Donanım Teması) */}
        <button
          onClick={handleNextTheme}
          className="h-7 px-1.5 flex items-center gap-1 rounded text-paper-muted hover:text-paper-bright hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={`Tema: ${currentThemeObj.name} (Tıkla ve Değiştir)`}
        >
          <Palette size={13} style={{ color: currentThemeObj.accent }} />
          <span className="text-[10px] font-mono hidden md:inline">{currentThemeObj.name.split(" ")[0]}</span>
        </button>

        {/* Dikey ayırıcı */}
        <div className="h-4 w-px bg-white/[0.1] mx-1" />

        {/* Windows Tarzı Pencere Kontrolleri */}
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            className="h-7 w-9 flex items-center justify-center text-paper-muted hover:text-paper-bright hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Küçült"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleToggleMaximize}
            className="h-7 w-9 flex items-center justify-center text-paper-muted hover:text-paper-bright hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label={isMaximized ? "Geri Yükle" : "Büyüt"}
          >
            <Square size={11} />
          </button>
          <button
            onClick={handleClose}
            className="h-7 w-9 flex items-center justify-center text-paper-muted hover:text-white hover:bg-alert transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
