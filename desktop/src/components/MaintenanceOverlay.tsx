import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Wrench, RotateCw, Clock } from 'lucide-react';

interface MaintenanceOverlayProps {
  title?: string;
  message?: string;
  until?: string | null;
  onCheckStatus?: () => Promise<void>;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  title = 'SİSTEM BAKIMDA',
  message = 'Ağ optimizasyonu ve altyapı güncellemeleri nedeniyle servis geçici olarak bakım modundadır.',
  until,
  onCheckStatus,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [checking, setChecking] = useState<boolean>(false);
  const hasTriggeredAutoCheck = useRef<boolean>(false);

  // Canlı Geri Sayım Zamanlayıcısı
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3D Metalik Küre Tuvali
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

  // Geri Sayım Parametreleri
  const countdown = useMemo(() => {
    if (!until) return null;
    const targetMs = new Date(until).getTime();
    if (Number.isNaN(targetMs)) return null;

    const diffMs = targetMs - now;
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, isExpired: false };
  }, [until, now]);

  // Süre dolduğunda istemciyi otomatik uyandır ve bakımın bittiğini teyit et
  useEffect(() => {
    if (countdown?.isExpired && !hasTriggeredAutoCheck.current && onCheckStatus) {
      hasTriggeredAutoCheck.current = true;
      void onCheckStatus();
    }
  }, [countdown?.isExpired, onCheckStatus]);

  const handleManualCheck = async () => {
    if (checking || !onCheckStatus) return;
    setChecking(true);
    try {
      await onCheckStatus();
    } finally {
      setChecking(false);
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 3D Gri Orb Tuvali */}
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-[0_0_40px_rgba(148,163,184,0.15)]"
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
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>KÜRESEL BAKIM DEVREDE</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
          {title}
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          {message}
        </p>

        {/* ── Dijital Geri Sayım Kartı ($10K Neon Monospace) ── */}
        {countdown && !countdown.isExpired && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-lg shadow-amber-500/10 backdrop-blur-md mt-2">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-2.5">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Tahmini Bakım Bitiş Sayacı</span>
            </div>

            <div className="flex items-center justify-center gap-2 font-mono">
              {countdown.days > 0 && (
                <>
                  <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 min-w-[52px]">
                    <span className="text-lg font-black text-white">{pad(countdown.days)}</span>
                    <span className="text-[9px] text-slate-400 uppercase">GÜN</span>
                  </div>
                  <span className="text-amber-500 font-bold text-sm">:</span>
                </>
              )}

              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 min-w-[52px]">
                <span className="text-lg font-black text-amber-300">{pad(countdown.hours)}</span>
                <span className="text-[9px] text-slate-400 uppercase">SAAT</span>
              </div>

              <span className="text-amber-500 font-bold text-sm">:</span>

              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 min-w-[52px]">
                <span className="text-lg font-black text-amber-300">{pad(countdown.minutes)}</span>
                <span className="text-[9px] text-slate-400 uppercase">DAKİKA</span>
              </div>

              <span className="text-amber-500 font-bold text-sm">:</span>

              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 min-w-[52px]">
                <span className="text-lg font-black text-amber-400 animate-pulse">
                  {pad(countdown.seconds)}
                </span>
                <span className="text-[9px] text-slate-400 uppercase">SANİYE</span>
              </div>
            </div>
          </div>
        )}

        {countdown?.isExpired && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>Süre tamamlandı. Sistem açılışı kontrol ediliyor...</span>
          </div>
        )}

        {/* Aksiyon Butonu */}
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-amber-400' : ''}`} />
            <span>{checking ? 'Kontrol Ediliyor...' : 'Durumu Yeniden Kontrol Et'}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-800/80 mt-2">
          <p className="text-[11px] text-slate-400 font-mono">
            Ağ motoru güvenle duraklatıldı. Bakım tamamlandığında sistem otomatik olarak açılacaktır.
          </p>
        </div>
      </div>
    </div>
  );
};
