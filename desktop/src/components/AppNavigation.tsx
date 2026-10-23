import { Activity, Globe2, Layers, LayoutDashboard, LoaderCircle, Power, Settings, Shield, FileText, Wrench, LifeBuoy } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { isAndroid } from "../lib/platform";
import { connectionCopy } from "../features/connection/copy";

export type ViewId = "dashboard" | "sites" | "profiles" | "test" | "network" | "setup" | "destek" | "settings" | "wizard" | "logs" | "changelog" | "support";
interface Props { view: ViewId; onNavigate: (view: ViewId) => void; running: boolean; known: boolean; busy: boolean; onToggle: () => void; }

export default function AppNavigation({ view, onNavigate, running, known, busy, onToggle }: Props) {
  const { t, lang } = useI18n();
  const copy = connectionCopy[lang];
  const supportItems = [
    { id: "changelog", label: t("nav_changelog"), icon: FileText },
    ...(!isAndroid ? [{ id: "setup", label: t("nav_setup"), icon: Shield }] : []),
    { id: "destek", label: t("nav_destek"), icon: LifeBuoy },
    { id: "settings", label: t("nav_settings"), icon: Settings },
  ];
  const groups = [
    { label: copy.workspace, items: [{ id: "dashboard", label: t("nav_dashboard"), icon: LayoutDashboard }, { id: "sites", label: t("nav_sites"), icon: Globe2 }, { id: "profiles", label: t("nav_profiles"), icon: Layers }] },
    { label: copy.tools, items: [{ id: "test", label: t("nav_test"), icon: Activity }, { id: "network", label: t("nav_network"), icon: Wrench }] },
    { label: copy.support, items: supportItems },
  ];
  return (
    <aside className="workspace-sidebar hidden md:flex" aria-busy={busy}>
      <nav aria-label={copy.workspace}>
        {groups.length === 0 ? null : groups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map(({ id, label, icon: Icon }) => <button type="button" key={id} className="active:scale-[0.97] transition-transform duration-150" aria-current={view === id ? "page" : undefined} title={label} aria-label={label} onClick={() => onNavigate(id as ViewId)}><Icon size={18} aria-hidden="true" /><span>{label}</span>{view === id && <span className="nav-active-marker" />}</button>)}</div>)}
      </nav>
      {view !== "dashboard" && (
        <div className="sidebar-footer">
          <button className="workspace-button secondary full-width active:scale-[0.97] transition-transform duration-150" disabled={busy || !known} onClick={onToggle}>
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Power size={16} />}
            <span>{running ? t("btn_stop") : t("btn_start")}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
