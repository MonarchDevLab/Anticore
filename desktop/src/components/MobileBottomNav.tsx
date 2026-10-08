import { LayoutDashboard, Globe2, Layers, Activity, Settings, Power, LoaderCircle } from "lucide-react";
import { useI18n } from "../lib/i18n";
import type { ViewId } from "./AppNavigation";

interface MobileBottomNavProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  running: boolean;
  busy: boolean;
  onToggle: () => void;
}

export default function MobileBottomNav({
  view,
  onNavigate,
  running,
  busy,
  onToggle,
}: MobileBottomNavProps) {
  const { t } = useI18n();

  const navItems = [
    { id: "dashboard", label: t("nav_dashboard") || "Panel", icon: LayoutDashboard },
    { id: "sites", label: t("nav_sites") || "Siteler", icon: Globe2 },
    { id: "profiles", label: t("nav_profiles") || "Profiller", icon: Layers },
    { id: "test", label: t("nav_test") || "Test", icon: Activity },
    { id: "settings", label: t("nav_settings") || "Ayarlar", icon: Settings },
  ] as const;

  return (
    <nav
      aria-label="Mobil Gezinme Çubuğu"
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1d]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 pt-1 pb-[max(env(safe-area-inset-bottom,8px),8px)] shadow-2xl flex items-center justify-around"
    >
      {navItems.map(({ id, label, icon: Icon }) => {
        const isActive =
          view === id ||
          (id === "settings" &&
            (view === "network" ||
              view === "lan_share" ||
              view === "changelog" ||
              view === "support" ||
              view === "destek" ||
              view === "setup"));
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id as ViewId)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-90 ${
              isActive
                ? "text-live font-bold"
                : "text-paper-muted hover:text-paper-bright"
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-colors ${isActive ? "bg-live/15" : "bg-transparent"}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-live rounded-full shadow-[0_0_8px_#10b981]" />
              )}
            </div>
            <span className="text-[10px] font-mono mt-0.5 tracking-tight truncate max-w-[58px]">
              {label}
            </span>
          </button>
        );
      })}

      {/* Hızlı Güç Düğmesi (Dashboard Dışındayken Hızlı Aç/Kapat) */}
      {view !== "dashboard" && (
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          title={running ? t("btn_stop") : t("btn_start")}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1 rounded-xl transition-transform active:scale-90 ${
            running ? "text-live" : "text-red-400"
          }`}
        >
          <div
            className={`p-1.5 rounded-full border transition-all ${
              running
                ? "border-live/40 bg-live/20 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "border-red-500/40 bg-red-500/15"
            }`}
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Power size={18} strokeWidth={2.5} />
            )}
          </div>
          <span className="text-[9px] font-mono font-bold mt-0.5">
            {running ? "DURDUR" : "BAŞLAT"}
          </span>
        </button>
      )}
    </nav>
  );
}
