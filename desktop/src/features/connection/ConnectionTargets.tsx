import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Globe2, LoaderCircle, RefreshCw } from "lucide-react";
import { api, type ProbeDto } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";

export default function ConnectionTargets({ hosts, session, copy, onManage }: { hosts: string[]; session: string; copy: ConnectionCopy; onManage: () => void }) {
  const [results, setResults] = useState<ProbeDto[]>([]);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const lock = useRef(false);
  useEffect(() => { generation.current++; setResults([]); setBusy(false); lock.current = false; return () => { generation.current++; }; }, [session, hosts]);
  const run = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    const id = generation.current;
    const checked = await Promise.all(hosts.slice(0, 3).map(async (host) => {
      try { return await api.probeTarget(host); }
      catch { return { host, result: "error", latency_ms: null }; }
    }));
    if (id === generation.current) { setResults(checked); setBusy(false); lock.current = false; }
  };
  const label = (result?: string) => result === "open" ? copy.reachable : result === "blocked" ? copy.blocked : result === "filtered" ? copy.filtered : result ? copy.error : copy.unchecked;
  return (
    <section className="workspace-panel target-panel">
      <div className="panel-heading"><div><h2>{copy.targets}</h2><p>{copy.targetHint}</p></div><button className="workspace-icon-button" onClick={onManage} aria-label={copy.manageTargets}><ArrowUpRight size={18} /></button></div>
      <div className="target-list" aria-live="polite">
        {!hosts.length && <p className="workspace-empty">{copy.emptyTargets}</p>}
        {hosts.slice(0, 3).map((host) => {
          const result = results.find((row) => row.host === host);
          return <div className="target-row" key={host}><span className="target-symbol"><Globe2 size={17} /></span><div><strong>{host}</strong><span className={result?.result === "open" ? "result-open" : ""}>{busy ? copy.checking : label(result?.result)}</span></div><span className="target-latency">{result?.latency_ms != null ? `${result.latency_ms} ms` : "—"}</span></div>;
        })}
      </div>
      <button className="workspace-button secondary full-width" disabled={busy || !hosts.length} onClick={() => void run()}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}{busy ? copy.checking : copy.check}</button>
    </section>
  );
}
