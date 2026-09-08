import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Status } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";

export default function ConnectionActivity({ status, copy }: { status: Status | null; copy: ConnectionCopy }) {
  const [samples, setSamples] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const last = useRef<{ count: number; time: number; uptime: number } | null>(null);
  useEffect(() => {
    if (!status?.running) { last.current = null; setSamples([]); return; }
    if (paused || document.hidden) { last.current = null; return; }
    const now = performance.now();
    const previous = last.current;
    last.current = { count: status.packets_touched, time: now, uptime: status.uptime_sec };
    if (!previous) return;
    if (status.packets_touched < previous.count || status.uptime_sec < previous.uptime) { setSamples([]); return; }
    const seconds = (now - previous.time) / 1000;
    if (seconds > 0) setSamples((values) => [...values.slice(-29), Math.round((status.packets_touched - previous.count) / seconds)]);
  }, [status, paused]);
  const peak = Math.max(...samples, 1);
  const points = samples.map((value, i) => `${(i / Math.max(samples.length - 1, 1)) * 600},${85 - (value / peak) * 70}`).join(" ");
  return (
    <section className="workspace-panel activity-panel" aria-label={copy.activity}>
      <div className="panel-heading"><div><h2>{copy.activity}</h2><p>{copy.activityHint}</p></div>
        <button className="workspace-icon-button" aria-label={paused ? copy.resume : copy.paused} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
      </div>
      <div className="activity-value">{status?.running && samples.length ? samples[samples.length - 1].toLocaleString() : "—"}<span>PPS</span></div>
      <div className="activity-chart">
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={`${copy.activityHint}: ${samples.join(", ") || copy.noActivity}`}>
          {[15, 50, 85].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} className="chart-grid" />)}
          {samples.length > 1 && <polyline points={points} fill="none" className="chart-line" />}
        </svg>
        {!samples.length && <span className="chart-empty">{copy.noActivity}</span>}
      </div>
      <div className="chart-caption"><span>{copy.sampleWindow}</span><span>{paused ? copy.paused : status?.running ? copy.online : copy.standby}</span></div>
    </section>
  );
}
