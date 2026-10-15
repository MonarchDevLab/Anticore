import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Layers, LoaderCircle, Power } from "lucide-react";
import type { Profile } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";
import { isMobile, isAndroid } from "../../lib/platform";
import ProfilePickerSheet from "./ProfilePickerSheet";

interface Props {
  known: boolean; running: boolean; busy: boolean; loading: boolean;
  profiles: Profile[]; selectedProfile: string; copy: ConnectionCopy;
  onToggle: () => void; onSelect: (id: string) => void; onConfigure: () => void;
}

function CoreOrb({ running, known, copy, busy = false, onToggle }: { running: boolean; known: boolean; copy: ConnectionCopy; busy?: boolean; onToggle?: () => void }) {
  const active = running && known;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active, busy, ripple: 0 });
  stateRef.current.active = active;
  stateRef.current.busy = busy;

  const triggerToggle = () => {
    if (!busy && known && onToggle) {
      stateRef.current.ripple = 1.0;
      onToggle();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let req: number;
    let time = 0;
    let blend = stateRef.current.active ? 1 : 0;

    // Küre üzerindeki 3D noktalar
    const numPoints = 140;
    const points: { phi: number; theta: number; size: number; speed: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        phi: Math.acos(Math.random() * 2 - 1),
        theta: Math.random() * 2 * Math.PI,
        size: Math.random() * 2 + 0.5,
        speed: (Math.random() - 0.5) * 0.03,
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const isAct = stateRef.current.active;
      const isBsy = stateRef.current.busy;
      const targetBlend = isAct ? 1 : 0;
      blend += (targetBlend - blend) * 0.08;

      const cx = w / 2;
      const cy = h / 2 - 10;
      const baseRadius = w * (0.31 + blend * 0.025);

      const speedMult = isBsy ? 2.8 : 0.5 + blend * 1.6;
      time += 0.008 * speedMult;

      const r = Math.round(100 + (16 - 100) * blend + (isBsy ? 140 : 0));
      const g = Math.round(116 + (185 - 116) * blend);
      const b = Math.round(139 + (129 - 139) * blend);

      // Arka plan ışıması (Aura)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.85);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.1 + blend * 0.18})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Tıklama şok dalgası (Shockwave Ripple)
      if (stateRef.current.ripple > 0.01) {
        const rip = stateRef.current.ripple;
        const ripRadius = baseRadius * (0.6 + (1 - rip) * 1.35);
        ctx.beginPath();
        ctx.arc(cx, cy, ripRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rip * 0.65})`;
        ctx.lineWidth = 2.5 * rip;
        ctx.stroke();
        stateRef.current.ripple *= 0.9;
      }

      // Merkezi kalp
      const pulse = Math.sin(time * 3) * (1 + blend * 3);
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.45 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowBlur = 10 + blend * 16;
      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3D Parçacıkları Çiz (Z-Eksenine göre sırala)
      const rotX = time * 0.6;
      const rotY = time * 0.8;

      const projected = [];
      for (const p of points) {
        const theta = p.theta + time * p.speed * speedMult;
        let x = baseRadius * Math.sin(p.phi) * Math.cos(theta);
        let y = baseRadius * Math.sin(p.phi) * Math.sin(theta);
        let z = baseRadius * Math.cos(p.phi);

        // X dönüşü
        let tY = y * Math.cos(rotX) - z * Math.sin(rotX);
        let tZ = y * Math.sin(rotX) + z * Math.cos(rotX);
        y = tY;
        z = tZ;
        // Y dönüşü
        let tX = x * Math.cos(rotY) - z * Math.sin(rotY);
        tZ = x * Math.sin(rotY) + z * Math.cos(rotY);
        x = tX;
        z = tZ;

        const perspective = 300 / (300 + z);
        projected.push({
          x: cx + x * perspective,
          y: cy + y * perspective,
          z,
          size: p.size * perspective,
        });
      }

      // Derinliğe göre sırala (Arkadan öne)
      projected.sort((a, b) => b.z - a.z);

      const pr = Math.round(148 + (52 - 148) * blend);
      const pg = Math.round(163 + (211 - 163) * blend);
      const pb = Math.round(184 + (153 - 184) * blend);

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const alpha = 0.2 + 0.8 * ((baseRadius - p.z) / (baseRadius * 2));
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      }

      // Yörünge halkaları (Gyroscope etkisi)
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + blend * 0.18})`;

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
  }, []);

  return (
    <div
      onClick={triggerToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={busy ? copy.busy : running ? copy.stop : copy.start}
      className={`core-orb-container ${active ? "is-active" : "is-idle"} cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-[0.96]`}
      style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <canvas ref={canvasRef} width={220} height={220} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
      <span className="orb-label" style={{ position: "absolute", bottom: "5px", left: 0, right: 0, textAlign: "center", zIndex: 10, fontSize: "11px", fontWeight: 600, color: active ? "#10b981" : "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
        {!known ? "—" : active ? copy.online : copy.standby}
      </span>
    </div>
  );
}

export default function ConnectionConsole({ known, running, busy, loading, profiles, selectedProfile, copy, onToggle, onSelect, onConfigure }: Props) {
  const profile = profiles.find((item) => item.id === selectedProfile);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className={`workspace-panel engine-console ${running && known ? "is-active" : ""}`}>
      <div className="console-body">
        <div className="console-copy"><p className="workspace-eyebrow">{copy.engineControl}</p><h2>{!known ? copy.unknown : running ? copy.active : copy.ready}</h2><p>{!known ? copy.unknownHint : running ? copy.activeHint : copy.readyHint}</p></div>
        <CoreOrb running={running} known={known} copy={copy} busy={busy} onToggle={onToggle} />
      </div>
      <div className="console-controls">
        <button className={`power-switch active:scale-[0.97] ${running && known ? "is-running" : ""}`} onClick={onToggle} disabled={busy || !known || (!running && !profile)} aria-busy={busy} aria-label={busy ? copy.busy : running ? copy.stop : copy.start}>
          {busy ? <LoaderCircle size={19} className="animate-spin" /> : <Power size={19} />}<span>{busy ? copy.busy : running ? copy.stop : copy.start}</span>
        </button>
        <div className="console-profile">
          <label htmlFor="connection-profile"><Layers size={12} />{copy.profile}</label>
          {isMobile || isAndroid ? (
            <button
              type="button"
              id="connection-profile"
              onClick={() => !running && !busy && setSheetOpen(true)}
              disabled={running || busy || loading || !profiles.length}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg border border-white/[0.12] bg-surface-subtle text-paper flex items-center justify-between text-xs font-mono cursor-pointer transition-transform duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate font-semibold text-paper-bright">
                {profile?.name || (loading ? copy.busy : copy.profileEmpty)}
              </span>
              <ChevronDown size={15} className="text-paper-muted shrink-0 ml-2" />
            </button>
          ) : (
            <select id="connection-profile" className="workspace-select" value={selectedProfile} disabled={running || busy || loading || !profiles.length} onChange={(event) => onSelect(event.target.value)}>
              {!profiles.length && <option value={selectedProfile}>{loading ? copy.busy : copy.profileEmpty}</option>}
              {profiles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          )}
        </div>
        <button className="workspace-icon-button active:scale-[0.97]" onClick={onConfigure} aria-label={copy.configure} title={copy.configure}><ArrowUpRight size={18} /></button>
      </div>
      <p className="profile-description">{running ? copy.profileLocked : profile?.description || copy.profileHint}</p>

      {/* Siber Mobil Profil Seçici Alt Sayfası */}
      <ProfilePickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        profiles={profiles}
        selectedProfile={selectedProfile}
        onSelect={onSelect}
        disabled={running || busy}
      />
    </section>
  );
}
