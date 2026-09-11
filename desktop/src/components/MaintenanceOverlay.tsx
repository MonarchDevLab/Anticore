import React, { useEffect, useRef } from 'react';
import { Wrench } from 'lucide-react';

interface MaintenanceOverlayProps {
  title?: string;
  message?: string;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  title = 'SİSTEM BAKIMDA',
  message = 'Ağ optimizasyonu ve altyapı güncellemeleri nedeniyle servis geçici olarak bakım modundadır.',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0;
    let angleY = 0;

    // 3D Küre Noktaları (Sphere Points)
    const points: Array<[number, number, number]> = [];
    const numLat = 24;
    const numLon = 36;
    const radius = 95;

    for (let i = 0; i <= numLat; i++) {
      const theta = (i * Math.PI) / numLat;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let j = 0; j <= numLon; j++) {
        const phi = (j * 2 * Math.PI) / numLon;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = radius * sinTheta * cosPhi;
        const y = radius * cosTheta;
        const z = radius * sinTheta * sinPhi;
        points.push([x, y, z]);
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const fov = 300;

      angleX += 0.006;
      angleY += 0.01;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Küre Arkası & Derinlik Parıltısı (Backlight Radial Glow)
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
      grad.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
      grad.addColorStop(0.5, 'rgba(71, 85, 105, 0.08)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();

      // Noktaları 3D Döndür ve Yansıt
      for (let i = 0; i < points.length; i++) {
        const [px, py, pz] = points[i];

        // Y ekseni rotasyonu
        const x1 = px * cosY - pz * sinY;
        const z1 = pz * cosY + px * sinY;

        // X ekseni rotasyonu
        const y2 = py * cosX - z1 * sinX;
        const z2 = z1 * cosX + py * sinX;

        // Perspektif izdüşümü
        const distance = fov / (fov + z2 + 120);
        const screenX = cx + x1 * distance;
        const screenY = cy + y2 * distance;

        // Derinliğe göre parlaklık (Z-depth metallic grey shading)
        const alpha = Math.max(0.1, (z2 + radius) / (2 * radius));
        const pointSize = Math.max(0.8, distance * 2.2);

        ctx.fillStyle = `rgba(203, 213, 225, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, pointSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // İç Çekirdek Işıltısı (Metallic Core)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 3D Gri Orb Tuvali */}
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="w-72 h-72 drop-shadow-[0_0_40px_rgba(148,163,184,0.15)]"
        />
        {/* Merkez İkon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center backdrop-blur-sm shadow-xl">
            <Wrench className="w-5 h-5 text-slate-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bakım Başlığı ve Mesajı */}
      <div className="max-w-md text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
          <span>BAKIM MODU DEVREDE</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
          {title}
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          {message}
        </p>

        <div className="pt-4 border-t border-slate-800/80 mt-4">
          <p className="text-[11px] text-slate-500 font-mono">
            Ağ motoru güvenle duraklatıldı. Bakım tamamlandığında sistem otomatik olarak açılacaktır.
          </p>
        </div>
      </div>
    </div>
  );
};
