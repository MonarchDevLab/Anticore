import { ArrowUpRight, Cpu, Layers, LoaderCircle, Power } from "lucide-react";
import type { Profile } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";

interface Props {
  known: boolean; running: boolean; busy: boolean; loading: boolean;
  profiles: Profile[]; selectedProfile: string; copy: ConnectionCopy;
  onToggle: () => void; onSelect: (id: string) => void; onConfigure: () => void;
}

function CoreIndicator({ running, known }: { running: boolean; known: boolean }) {
  return (
    <div className={`core-indicator ${running && known ? "is-active" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 200 160" fill="none">
        <path className="core-trace" d="M0 40h32l20 20h24M0 80h76M0 120h32l20-20h24M124 60h24l20-20h32M124 80h76M124 100h24l20 20h32M80 0v32M100 0v32M120 0v32M80 128v32M100 128v32M120 128v32" />
        <rect className="core-frame" x="58" y="38" width="84" height="84" rx="4" />
        <path className="core-bracket" d="M50 58V30h28M122 30h28v28M150 102v28h-28M78 130H50v-28" />
        <path className="core-glyph" d="m78 98 22-42 22 42M87 84h26" />
        {[20, 180].map((x) => <rect key={x} className="core-terminal" x={x - 3} y="77" width="6" height="6" />)}
      </svg>
      <span>{!known ? "—" : running ? "RUN" : "IDLE"}</span>
    </div>
  );
}

export default function ConnectionConsole({ known, running, busy, loading, profiles, selectedProfile, copy, onToggle, onSelect, onConfigure }: Props) {
  const profile = profiles.find((item) => item.id === selectedProfile);
  const stateText = !known ? copy.unavailable : running ? copy.online : copy.standby;
  return (
    <section className={`workspace-panel engine-console ${running && known ? "is-active" : ""}`}>
      <div className="console-strip"><span><Cpu size={14} />{copy.localEngine}</span><span className="console-state" role="status"><i className={`status-dot ${running && known ? "online" : ""}`} />{stateText}</span></div>
      <div className="console-body">
        <div className="console-copy"><p className="workspace-eyebrow">{copy.engineControl}</p><h2>{!known ? copy.unknown : running ? copy.active : copy.ready}</h2><p>{!known ? copy.unknownHint : running ? copy.activeHint : copy.readyHint}</p></div>
        <CoreIndicator running={running} known={known} />
      </div>
      <div className="console-controls">
        <button className={`power-switch ${running && known ? "is-running" : ""}`} onClick={onToggle} disabled={busy || !known || (!running && !profile)} aria-busy={busy} aria-label={busy ? copy.busy : running ? copy.stop : copy.start}>
          {busy ? <LoaderCircle size={19} className="animate-spin" /> : <Power size={19} />}<span>{busy ? copy.busy : running ? copy.stop : copy.start}</span>
        </button>
        <div className="console-profile"><label htmlFor="connection-profile"><Layers size={12} />{copy.profile}</label><select id="connection-profile" className="workspace-select" value={selectedProfile} disabled={running || busy || loading || !profiles.length} onChange={(event) => onSelect(event.target.value)}>
          {!profiles.length && <option value={selectedProfile}>{loading ? copy.busy : copy.profileEmpty}</option>}
          {profiles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select></div>
        <button className="workspace-icon-button" onClick={onConfigure} aria-label={copy.configure} title={copy.configure}><ArrowUpRight size={18} /></button>
      </div>
      <p className="profile-description">{running ? copy.profileLocked : profile?.description || copy.profileHint}</p>
    </section>
  );
}
