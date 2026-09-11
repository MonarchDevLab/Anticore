import { useEffect, useRef } from "react";
import { ArrowUpRight, Layers, LoaderCircle, Power } from "lucide-react";
import type { Profile } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";

interface Props {
  known: boolean; running: boolean; busy: boolean; loading: boolean;
  profiles: Profile[]; selectedProfile: string; copy: ConnectionCopy;
  onToggle: () => void; onSelect: (id: string) => void; onConfigure: () => void;
}

function CoreOrb({ running, known, copy }: { running: boolean; known: boolean; copy: ConnectionCopy }) {
  const active = running && known;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let req: number;
    let time = 0;
    
    // Küre üzerindeki 3D noktalar
    const numPoints = 140;
    const points: { phi: number; theta: number; size: number; speed: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        phi: Math.acos(Math.random() * 2 - 1),
        theta: Math.random() * 2 * Math.PI,
        size: Math.random() * 2 + 0.5,
        speed: (Math.random() - 0.5) * 0.03
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const cx = w / 2;
      const cy = h / 2 - 10;
      const baseRadius = w * 0.32;
      
      time += active ? 0.025 : 0.005;

      const r = active ? 16 : 100;
      const g = active ? 185 : 116;
      const b = active ? 129 : 139;
      
      // Arka plan ışıması (Aura)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.8);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${active ? 0.25 : 0.1})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Merkezi kalp
      const pulse = Math.sin(time * 3) * (active ? 4 : 1);
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.45 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowBlur = active ? 25 : 10;
      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3D Parçacıkları Çiz (Z-Eksenine göre sırala)
      const rotX = time * 0.6;
      const rotY = time * 0.8;
      
      const projected = [];
      for (const p of points) {
        const theta = p.theta + time * p.speed * (active ? 2 : 0.5);
        let x = baseRadius * Math.sin(p.phi) * Math.cos(theta);
        let y = baseRadius * Math.sin(p.phi) * Math.sin(theta);
        let z = baseRadius * Math.cos(p.phi);

        // X dönüşü
        let tY = y * Math.cos(rotX) - z * Math.sin(rotX);
        let tZ = y * Math.sin(rotX) + z * Math.cos(rotX);
        y = tY; z = tZ;
        // Y dönüşü
        let tX = x * Math.cos(rotY) - z * Math.sin(rotY);
        tZ = x * Math.sin(rotY) + z * Math.cos(rotY);
        x = tX; z = tZ;

        const perspective = 300 / (300 + z);
        projected.push({
           x: cx + x * perspective,
           y: cy + y * perspective,
           z,
           size: p.size * perspective
        });
      }

      // Derinliğe göre sırala (Arkadan öne)
      projected.sort((a, b) => b.z - a.z);

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const alpha = 0.2 + 0.8 * ((baseRadius - p.z) / (baseRadius * 2));
        ctx.fillStyle = `rgba(${active ? '52, 211, 153' : '148, 163, 184'}, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      }

      // Yörünge halkaları (Gyroscope etksi)
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${active ? 0.35 : 0.2})`;
      
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseRadius * 1.35, baseRadius * 0.45, time * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, baseRadius * 1.55, baseRadius * 0.35, -time * 0.2, 0, Math.PI * 2);
      ctx.stroke();

      req = requestAnimationFrame(draw);
    };
    draw();
    
    return () => cancelAnimationFrame(req);
  }, [active]);

  return (
    <div className={`core-orb-container ${active ? "is-active" : "is-idle"}`} aria-hidden="true" style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} width={220} height={220} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
      <span className="orb-label" style={{ position: "absolute", bottom: "5px", left: 0, right: 0, textAlign: "center", zIndex: 10, fontSize: "11px", fontWeight: 600, color: active ? "#10b981" : "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
        {!known ? "—" : active ? copy.online : copy.standby}
      </span>
    </div>
  );
}

export default function ConnectionConsole({ known, running, busy, loading, profiles, selectedProfile, copy, onToggle, onSelect, onConfigure }: Props) {
  const profile = profiles.find((item) => item.id === selectedProfile);
  return (
    <section className={`workspace-panel engine-console ${running && known ? "is-active" : ""}`}>
      <div className="console-body">
        <div className="console-copy"><p className="workspace-eyebrow">{copy.engineControl}</p><h2>{!known ? copy.unknown : running ? copy.active : copy.ready}</h2><p>{!known ? copy.unknownHint : running ? copy.activeHint : copy.readyHint}</p></div>
        <CoreOrb running={running} known={known} copy={copy} />
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
