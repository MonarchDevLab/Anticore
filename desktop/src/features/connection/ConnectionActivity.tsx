import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Status } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";

function ActivityChart3D({ samples, copy, running }: { samples: number[]; copy: ConnectionCopy; running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let req: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const active = running && samples.length > 0;
      const front = active ? "#10b981" : "#475569";
      const top = active ? "#34d399" : "#64748b";
      const right = active ? "#059669" : "#334155";
      const grid = "rgba(100, 116, 139, 0.15)";

      // İzometrik arka plan ızgarası
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      const drawIsoLine = (yOff: number) => {
        ctx.beginPath();
        ctx.moveTo(0, yOff);
        ctx.lineTo(w, yOff);
        ctx.stroke();
      };
      drawIsoLine(h * 0.2);
      drawIsoLine(h * 0.5);
      drawIsoLine(h * 0.8);

      const maxSamples = 30;
      const peak = Math.max(...samples, 5); 
      
      const step = w / maxSamples;
      const barW = step * 0.6;
      const depth = barW * 0.8;
      
      const baseY = h * 0.9;
      const maxH = h * 0.7;

      const padded = [...Array(Math.max(0, maxSamples - samples.length)).fill(0), ...samples.slice(-maxSamples)];

      for (let i = 0; i < maxSamples; i++) {
        const val = padded[i];
        let barH = (val / peak) * maxH;
        // Duran veya sıfır olan kısımlarda ufak bir canlılık hissi için 1px'lik bir taban
        if (active && val === 0) barH = 1.5 + Math.sin(time + i) * 0.5; 
        if (!active && val === 0) barH = 1;

        const x = i * step + (step - barW) / 2;
        const y = baseY;
        
        if (active && val > 0) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = top;
        } else {
          ctx.shadowBlur = 0;
        }

        // Ön Yüz
        ctx.fillStyle = front;
        ctx.fillRect(x, y - barH, barW, barH);
        
        ctx.shadowBlur = 0;

        // Üst Yüz (İzometrik paralelkenar)
        ctx.fillStyle = top;
        ctx.beginPath();
        ctx.moveTo(x, y - barH);
        ctx.lineTo(x + depth, y - barH - depth * 0.5);
        ctx.lineTo(x + barW + depth, y - barH - depth * 0.5);
        ctx.lineTo(x + barW, y - barH);
        ctx.fill();

        // Sağ Yüz (İzometrik paralelkenar)
        ctx.fillStyle = right;
        ctx.beginPath();
        ctx.moveTo(x + barW, y - barH);
        ctx.lineTo(x + barW + depth, y - barH - depth * 0.5);
        ctx.lineTo(x + barW + depth, y - depth * 0.5);
        ctx.lineTo(x + barW, y);
        ctx.fill();
      }

      req = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(req);
  }, [samples, running]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} width={600} height={100} style={{ width: "100%", height: "100%", display: "block" }} aria-label={copy.activityHint} />
      {!samples.length && (
        <span className="chart-empty" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          {copy.noActivity}
        </span>
      )}
    </div>
  );
}

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
  return (
    <section className="workspace-panel activity-panel" aria-label={copy.activity}>
      <div className="panel-heading"><div><h2>{copy.activity}</h2><p>{copy.activityHint}</p></div>
        <button className="workspace-icon-button" aria-label={paused ? copy.resume : copy.paused} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
      </div>
      <div className="activity-value">{status?.running && samples.length ? samples[samples.length - 1].toLocaleString() : "—"}<span>PPS</span></div>
      <div className="activity-chart" style={{ height: "100px", padding: 0 }}>
        <ActivityChart3D samples={samples} copy={copy} running={status?.running ?? false} />
      </div>
      <div className="chart-caption"><span>{copy.sampleWindow}</span><span>{paused ? copy.paused : status?.running ? copy.online : copy.standby}</span></div>
    </section>
  );
}
