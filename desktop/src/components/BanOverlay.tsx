import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Power,
  Clock,
  Infinity as InfinityIcon,
  AlertOctagon,
} from 'lucide-react';
import { api } from '../lib/tauri';

export interface BanOverlayProps {
  reason?: string;
  bannedAt?: string;
  bannedUntil?: string | null;
  onRefresh?: () => Promise<void>;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateRemaining(bannedUntilStr?: string | null): TimeRemaining | null {
  if (!bannedUntilStr) return null;
  const target = new Date(bannedUntilStr).getTime();
  if (Number.isNaN(target)) return null;

  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: false };
}

function formatDate(isoStr?: string | null): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('tr-TR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return isoStr;
  }
}

export const BanOverlay: React.FC<BanOverlayProps> = ({
  reason = 'Yönetici tarafından erişiminiz kısıtlandı.',
  bannedAt,
  bannedUntil,
  onRefresh,
}) => {
  const isPermanent = !bannedUntil;
  const [remaining, setRemaining] = useState<TimeRemaining | null>(() =>
    calculateRemaining(bannedUntil)
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isPermanent) return;

    const interval = setInterval(() => {
      const rem = calculateRemaining(bannedUntil);
      setRemaining(rem);

      // Süre bittiğinde otomatik durum yenilemesi tetikle
      if (rem && rem.isExpired && onRefresh) {
        onRefresh().catch(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bannedUntil, isPermanent, onRefresh]);

  const handleManualCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  const handleCloseApp = () => {
    try {
      void api.closeWindow();
    } catch {
      window.close();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030712]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 select-none font-mono text-slate-200">
      {/* Arka Plan Siber Parıltı Efekti */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-[#0b0e17]/90 border border-rose-500/30 rounded-3xl shadow-[0_0_60px_-15px_rgba(225,29,72,0.3)] p-8 text-center flex flex-col items-center">
        {/* Güvenlik Kalkanı İkonu */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-[#0b0e17] flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        </div>

        {/* Durum Etiketi */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold tracking-wider uppercase mb-3">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Erişim Askıya Alındı</span>
        </div>

        {/* Ana Başlık */}
        <h1 className="text-xl font-extrabold tracking-tight text-white uppercase mb-2">
          Yönetici Tarafından Erişiminiz Kısıtlandı
        </h1>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-sm">
          Bu cihaz ve ağ adresi güvenlik politikaları gereğince sistem yöneticisi tarafından geçici veya kalıcı olarak sınırlandırılmıştır.
        </p>

        {/* Gerekçe Kutusu */}
        <div className="w-full mb-6 p-4 rounded-2xl bg-black/40 border border-rose-500/20 text-left space-y-1">
          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Kısıtlama Gerekçesi</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            &ldquo;{reason}&rdquo;
          </p>
        </div>

        {/* Canlı Geri Sayım Kartları (Süreli Yasak) */}
        {!isPermanent && remaining && !remaining.isExpired ? (
          <div className="w-full mb-6 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Erişimin Açılmasına Kalan Süre</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {/* Gün */}
              <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {String(remaining.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Gün
                </span>
              </div>

              {/* Saat */}
              <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {String(remaining.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Saat
                </span>
              </div>

              {/* Dakika */}
              <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
                  {String(remaining.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Dakika
                </span>
              </div>

              {/* Saniye */}
              <div className="p-3 bg-white/[0.03] border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center bg-rose-500/5">
                <span className="text-2xl font-black text-rose-400 font-mono tracking-tight animate-pulse">
                  {String(remaining.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Saniye
                </span>
              </div>
            </div>

            {/* Tarih Aralığı */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
              <span>Başlangıç: <strong className="text-slate-300">{formatDate(bannedAt)}</strong></span>
              <span>Bitiş: <strong className="text-white">{formatDate(bannedUntil)}</strong></span>
            </div>
          </div>
        ) : !isPermanent && remaining?.isExpired ? (
          <div className="w-full mb-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-1">
            <span className="font-bold block">Kısıtlama Süresi Tamamlandı</span>
            <span className="text-[11px] text-slate-400">
              Erişim kilidini kaldırmak için aşağıdaki durum kontrol butonuna tıklayın.
            </span>
          </div>
        ) : (
          /* Kalıcı Yasaklama */
          <div className="w-full mb-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
              <InfinityIcon className="w-4 h-4" />
              <span>Süresiz / Kalıcı Kısıtlama</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bu cihaz ve ağ adresi kalıcı olarak engellenmiştir. Erişim talebi için yetkili sistem yöneticisiyle iletişime geçiniz.
            </p>
            {bannedAt && (
              <div className="text-[10px] text-slate-500">
                Kayıt Tarihi: {formatDate(bannedAt)}
              </div>
            )}
          </div>
        )}

        {/* Aksiyon Butonları */}
        <div className="w-full flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={checking}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.12] hover:border-cyan-400/50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Kontrol Ediliyor...' : 'Durumu Yeniden Kontrol Et'}</span>
          </button>

          <button
            type="button"
            onClick={handleCloseApp}
            className="py-3 px-5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>Uygulamayı Kapat</span>
          </button>
        </div>

        {/* Dipnot / Güvenlik Filigranı */}
        <div className="pt-6 mt-6 border-t border-white/[0.06] w-full text-[10px] text-slate-500 flex items-center justify-between">
          <span>Anticore Security Core</span>
          <span>Zero Trust Device Shield</span>
        </div>
      </div>
    </div>
  );
};
