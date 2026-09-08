import { Activity, ArrowUpRight, Globe2, Layers, LayoutDashboard, LoaderCircle, Power, ScrollText, Settings, Shield, Wrench } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { connectionCopy } from "../features/connection/copy";

export type ViewId = "dashboard" | "sites" | "profiles" | "test" | "network" | "setup" | "settings" | "wizard" | "logs";
interface Props { view: ViewId; onNavigate: (view: ViewId) => void; running: boolean; known: boolean; busy: boolean; onToggle: () => void; }

export default function AppNavigation({ view, onNavigate, running, known, busy, onToggle }: Props) {
  const { t, lang } = useI18n();
  const copy = connectionCopy[lang];
  const groups = [
    { label: copy.workspace, items: [{ id: "dashboard", label: t("nav_dashboard"), icon: LayoutDashboard }, { id: "sites", label: t("nav_sites"), icon: Globe2 }, { id: "profiles", label: t("nav_profiles"), icon: Layers }] },
    { label: copy.tools, items: [{ id: "test", label: t("nav_test"), icon: Activity }, { id: "network", label: t("nav_network"), icon: Wrench }, { id: "logs", label: t("nav_logs"), icon: ScrollText }] },
    { label: copy.support, items: [{ id: "setup", label: t("nav_setup"), icon: Shield }, { id: "settings", label: t("nav_settings"), icon: Settings }] },
  ];
  return (
    <aside className="workspace-sidebar">
      <nav aria-label={copy.workspace}>
        {groups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-current={view === id ? "page" : undefined} title={label} aria-label={label} onClick={() => onNavigate(id as ViewId)}><Icon size={18} aria-hidden="true" /><span>{label}</span>{view === id && <span className="nav-active-marker" />}</button>)}</div>)}
      </nav>
      <div className="sidebar-footer"><div className="sidebar-status"><span className={`status-dot ${running && known ? "online" : ""}`} /><span>{copy.localEngine}<strong>{!known ? copy.unavailable : running ? copy.online : copy.standby}</strong></span><ArrowUpRight size={16} aria-hidden="true" /></div>
        {view !== "dashboard" && <button className="workspace-button secondary full-width" disabled={busy || !known} onClick={onToggle}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Power size={16} />}<span>{running ? t("btn_stop") : t("btn_start")}</span></button>}
      </div>
    </aside>
  );
}
