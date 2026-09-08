import { useEffect } from "react";
import { Activity, ArrowRight, ArrowUpRight, Clock3, Globe2, Layers, LoaderCircle, Power, Shield, TriangleAlert, Wrench } from "lucide-react";
import { STEP_LABELS, type Status } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import type { ViewId } from "../components/AppNavigation";
import { connectionCopy } from "../features/connection/copy";
import { useConnectionData } from "../features/connection/useConnectionData";
import ConnectionActivity from "../features/connection/ConnectionActivity";
import ConnectionTargets from "../features/connection/ConnectionTargets";

interface Props {
  status: Status | null; running: boolean; logs: string[]; selectedProfile: string;
  onSelectedProfileChange: (id: string) => void; onNavigate: (view: ViewId) => void;
  busy: boolean; onToggle: () => void;
}

function uptime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor(seconds / 60 % 60).toString().padStart(2, "0");
  return `${h}:${m}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

export default function Dashboard({ status, running, logs, selectedProfile, onSelectedProfileChange, onNavigate, busy, onToggle }: Props) {
  const { lang } = useI18n();
  const copy = connectionCopy[lang];
  const data = useConnectionData();
  const profile = data.profiles.find((item) => item.id === selectedProfile);
  useEffect(() => {
    if (status?.running && data.profiles.some((item) => item.id === status.profile_id)) onSelectedProfileChange(status.profile_id);
    else if (data.profiles.length && !data.profiles.some((item) => item.id === selectedProfile)) onSelectedProfileChange(data.profiles[0].id);
  }, [status?.running, status?.profile_id, data.profiles, selectedProfile, onSelectedProfileChange]);
  const known = status !== null;
  const stateText = !known ? copy.unavailable : running ? copy.online : copy.standby;

  return (
    <div className="connection-workspace">
      <header className="workspace-heading"><div><p className="workspace-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.subtitle}</p></div><span className="workspace-badge"><Shield size={14} />{copy.local}</span></header>
      {data.error && <div className="workspace-notice" role="alert"><TriangleAlert size={18} /><span>{copy.loadError}</span><button onClick={data.reload} disabled={data.loading}>{copy.retry}</button></div>}
      {data.dns?.poisoned && <div className="workspace-notice" role="alert"><TriangleAlert size={18} /><span>{copy.dnsWarning}</span><button onClick={() => onNavigate("network")}>{copy.dnsInspect}</button></div>}
      <div className="connection-top-grid">
        <section className={`workspace-panel connection-hero ${running && known ? "is-active" : ""}`}>
          <div className="hero-status"><span className={`status-dot ${running && known ? "online" : ""}`} /><span role="status">{stateText}</span><span className="hero-local">{copy.noTunnel}</span></div>
          <div className="hero-copy"><h2>{!known ? copy.unknown : running ? copy.active : copy.ready}</h2><p>{!known ? copy.unknownHint : running ? copy.activeHint : copy.readyHint}</p></div>
          <div className="power-control">
            <button className={`power-switch ${running && known ? "is-running" : ""}`} onClick={onToggle} disabled={busy || !known || (!running && !profile)} aria-busy={busy} aria-label={busy ? copy.busy : running ? copy.stop : copy.start}>
              {busy ? <LoaderCircle size={46} className="animate-spin" /> : <Power size={46} strokeWidth={1.5} />}
              <span>{busy ? copy.busy : running ? copy.stop : copy.start}</span>
            </button>
          </div>
          <div className="hero-actions"><span className="hero-profile"><Layers size={14} />{profile?.name ?? selectedProfile}</span><span className="hero-protocol">WIN DIVERT / LOCAL</span></div>
        </section>
        <section className="workspace-panel profile-panel">
          <div className="panel-heading"><div><span className="panel-icon"><Layers size={18} /></span><h2>{copy.profile}</h2><p>{copy.profileHint}</p></div></div>
          <label className="profile-label" htmlFor="connection-profile">{copy.profile}</label>
          <select id="connection-profile" className="workspace-select" value={selectedProfile} disabled={running || busy || data.loading || !data.profiles.length} onChange={(event) => onSelectedProfileChange(event.target.value)}>
            {!data.profiles.length && <option value={selectedProfile}>{data.loading ? copy.busy : copy.profileEmpty}</option>}
            {data.profiles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <p className="profile-description">{running ? copy.profileLocked : profile?.description ?? copy.profileHint}</p>
          <button className="workspace-text-button" onClick={() => onNavigate("profiles")}>{copy.configure}<ArrowUpRight size={16} /></button>
          <div className="profile-summary"><span><Globe2 size={15} />{copy.manageTargets}</span><strong>{data.loading ? "—" : data.hosts.length.toLocaleString()}</strong></div>
        </section>
      </div>
      <dl className="connection-stats">
        <div><dt><Activity size={16} />{copy.seen}</dt><dd>{status ? status.packets_seen.toLocaleString() : "—"}</dd></div>
        <div><dt><Layers size={16} />{copy.processed}</dt><dd>{status ? status.packets_touched.toLocaleString() : "—"}</dd></div>
        <div><dt><Clock3 size={16} />{copy.uptime}</dt><dd>{status ? uptime(status.uptime_sec) : "—"}</dd></div>
      </dl>
      <div className="connection-bottom-grid">
        <div className="connection-activity-stack"><ConnectionActivity status={status} copy={copy} /><div className="speed-note"><Activity size={17} /><div><strong>{copy.speed}</strong><span>{copy.speedHint}</span></div></div></div>
        <ConnectionTargets hosts={data.hosts} session={`${known}:${running}:${status?.profile_id}`} copy={copy} onManage={() => onNavigate("sites")} />
      </div>
      <div className="connection-shortcuts">
        <button onClick={() => onNavigate("test")}><span className="shortcut-icon"><Activity size={20} /></span><span><strong>{copy.diagnostics}</strong><small>{copy.diagnosticsHint}</small></span><ArrowRight size={18} /></button>
        <button onClick={() => onNavigate("network")}><span className="shortcut-icon"><Wrench size={20} /></span><span><strong>{copy.repair}</strong><small>{copy.repairHint}</small></span><ArrowRight size={18} /></button>
      </div>
      <section className="workspace-panel recent-events"><div className="panel-heading"><h2>{copy.logs}</h2><button className="workspace-text-button" onClick={() => onNavigate("logs")}>{copy.allLogs}<ArrowUpRight size={15} /></button></div><ul>{logs.length ? logs.slice(-3).reverse().map((line, index) => <li key={`${index}-${line}`}><span className="event-marker" /><span>{line}</span></li>) : <li>{copy.noLogs}</li>}</ul></section>
      {profile && <details className="profile-details"><summary>{copy.details}<span>{profile.steps.length}</span></summary><ol>{profile.steps.map((step, index) => <li key={index}><span>{index + 1}</span>{lang === "tr" ? STEP_LABELS[step.type] : step.type.replaceAll("_", " ")}</li>)}</ol></details>}
    </div>
  );
}
