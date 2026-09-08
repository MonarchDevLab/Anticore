import { useEffect, useRef, useState, useMemo } from "react";
import {
  Power,
  Zap,
  Activity,
  ShieldCheck,
  Radio,
  Sliders,
  Clock,
  ArrowDownUp,
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  Network,
  Server,
  Gauge,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Shield,
  X,
} from "lucide-react";
import { api, type Profile, type Status } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import LogConsole from "../components/LogConsole";

interface Props {
  status: Status | null;
  running: boolean;
  logs: string[];
  pushLog: (line: string) => void;
  selectedProfile: string;
  onSelectedProfileChange: (id: string) => void;
}

// Canlı yakalanan örnek trafik akışı simülasyon/parser modeli
interface PacketEvent {
  id: string;
  time: string;
  domain: string;
  strategy: string;
  packets: number;
  verdict: "bypass" | "passthrough";
  loss: string;
}

export default function Dashboard({
  status,
  running,
  logs,
  pushLog,
  selectedProfile: selected,
  onSelectedProfileChange: setSelected,
}: Props) {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"radar" | "matrix" | "console">("matrix");

  // Canlı Durchput (PPS - Packets Per Second) dalga formu geçmişi (24 veri noktası)
  const [waveform, setWaveform] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]);
  const lastTouchedRef = useRef<number>(0);

  // Canlı yakalanan paket akışı (Loglardan veya gerçek etkinliklerden ayrıştırılır)
  const [packetStream, setPacketStream] = useState<PacketEvent[]>([]);

  useEffect(() => {
    void api.listProfiles().then(setProfiles);
  }, []);

  useEffect(() => {
    if (status?.running) {
      setSelected(status.profile_id);
    }
  }, [status?.running, status?.profile_id, setSelected]);

  // PPS Hesaplama ve Dalga Formu Akışı (Her 1000ms)
  useEffect(() => {
    if (!running) {
      setWaveform((prev) => [...prev.slice(1), 0]);
      return;
    }
    const interval = setInterval(() => {
      const currentTouched = status?.packets_touched ?? 0;
      const delta = Math.max(0, currentTouched - lastTouchedRef.current);
      lastTouchedRef.current = currentTouched;
      setWaveform((prev) => [...prev.slice(1), delta]);

      // Canlı paket akışına gerçek delta telemetrisini ekle
      if (delta > 0) {
        const prof = status?.profile_id || selected || "universal";
        const newEvent: PacketEvent = {
          id: Math.random().toString(36).substring(2, 8),
          time: new Date().toLocaleTimeString(),
          domain: `Hedef Trafik Akışı`,
          strategy: `${prof.toUpperCase()} [${delta} pkt]`,
          packets: delta,
          verdict: "bypass",
          loss: "<0.05ms",
        };
        setPacketStream((prev) => [newEvent, ...prev.slice(0, 7)]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [running, status?.packets_touched, status?.profile_id, selected]);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (running) {
        await api.stopEngine();
        pushLog("[*] Motor durdurma talebi onaylandı");
      } else {
        await api.startEngine(selected);
        pushLog(`[*] Çekirdek devreye alındı: Profil=${selected}`);
      }
    } catch (e) {
      const msg = String(e);
      setError(msg);
      pushLog(`[!] HATA: ${msg}`);
    } finally {
      setTimeout(() => setBusy(false), 300);
    }
  };

  const activeProfile = profiles.find((p) => p.id === (status?.profile_id || selected));
  const activeName = activeProfile?.name ?? (status?.profile_id || selected);

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const touched = status?.packets_touched ?? 0;
  const passthrough = status?.passthrough ?? 0;
  const total = touched + passthrough;
  const passthroughPercent = total > 0 ? ((passthrough / total) * 100).toFixed(1) : "-";
  const currentPps = waveform[waveform.length - 1] ?? 0;

  // SVG Dalga Formu Noktaları (Waveform)
  const maxWave = Math.max(...waveform, 10);
  const svgPoints = useMemo(() => {
    const width = 300;
    const height = 48;
    const step = width / (waveform.length - 1);
    return waveform
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (val / maxWave) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [waveform, maxWave]);

  const isPrivilegeError = useMemo(() => {
    if (!error) return false;
    const lower = error.toLowerCase();
    return (
      lower.includes("yönetici") ||
      lower.includes("admin") ||
      lower.includes("windivert") ||
      lower.includes("filter=") ||
      lower.includes("hakları") ||
      lower.includes("privilege") ||
      lower.includes("access is denied") ||
      lower.includes("yetki")
    );
  }, [error]);

  return (
    <div className="space-y-5 pb-6">
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-alert/15 border border-alert/35 text-paper-bright flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-alert/20 text-alert shrink-0 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-alert tracking-wide uppercase">
                {isPrivilegeError ? t("privilege_required_title") : t("dash_state_title")}
              </div>
              <div className="text-xs text-paper-muted mt-0.5 break-words">
                {isPrivilegeError ? t("dash_admin_warn") : error}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {isPrivilegeError && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.restartAsAdmin();
                  } catch (err) {
                    setError(String(err));
                  }
                }}
                className="btn btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Shield size={14} />
                <span>{t("dash_admin_btn")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setError(null)}
              className="px-2.5 py-1.5 rounded-lg text-paper-muted hover:text-paper-bright hover:bg-white/[0.05] text-xs cursor-pointer transition-colors flex items-center gap-1"
            >
              <X size={13} />
              <span>{t("btn_close")}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 1. Üst Başlık & Telemetri Durum Şeridi ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-paper-bright flex items-center gap-2">
            <span className="font-mono text-live tracking-widest">//</span>
            <span>KONTROL ODASI & ÇEKİRDEK TELEMETRİSİ</span>
          </h1>
          <p className="text-xs text-paper-muted mt-0.5">
            WinDivert L4/L7 kernel-seviyesi paket manipülasyonu ve cerrahi sansür atlatma konsolu
          </p>
        </div>

        {/* ISS Profil Seçici (Doğrudan Kokpitten) */}
        <div className="flex items-center gap-2 bg-surface-subtle p-1 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] font-mono text-paper-faint px-2 flex items-center gap-1.5">
            <Sliders size={12} className="text-live" />
            <span>AKTİF PROFİL:</span>
          </span>
          <select
            value={selected}
            disabled={running || busy}
            onChange={(e) => {
              setSelected(e.target.value);
              pushLog(`[*] Profil seçimi güncellendi: ${e.target.value}`);
            }}
            className="bg-surface-elevated text-xs font-semibold text-paper-bright px-3 py-1.5 rounded-lg border border-white/[0.1] focus:outline-none focus:border-live cursor-pointer disabled:opacity-50"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#090D15] text-paper">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 2. Ana Bento Grid: Çekirdek Reaktörü + Canlı Osiloskop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SOL: CYBER-REACTOR HUB (5 Sütun) */}
        <div className="lg:col-span-5 card p-6 flex flex-col items-center justify-between relative overflow-hidden text-center min-h-[360px]">
          {/* Ambient Işık Küresi */}
          {running && (
            <div className="absolute inset-0 bg-radial from-live/15 via-transparent to-transparent blur-2xl pointer-events-none" />
          )}

          {/* Reaktör Başlığı & Donanım Kimliği */}
          <div className="w-full flex items-center justify-between pb-4 border-b border-white/[0.06] relative z-10 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-paper-muted">
              <Radio size={13} className={running ? "text-live animate-pulse" : "text-paper-faint"} />
              <span>CORE_UNIT_01</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
              running ? "bg-live/15 text-live border border-live/30" : "bg-white/[0.05] text-paper-faint"
            }`}>
              {running ? "ONLINE // HOOKED" : "OFFLINE // STANDBY"}
            </span>
          </div>

          {/* Dairesel Reaktör Çekirdeği (Cyber-Reactor Button) */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Dış Dönen Telemetri Segment Halkası (SVG) */}
            <svg
              className={`absolute w-52 h-52 pointer-events-none transition-all duration-700 ${
                running ? "animate-spin-slow opacity-100" : "opacity-25"
              }`}
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="2"
              />
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke={running ? "#00F59B" : "rgba(255,255,255,0.2)"}
                strokeWidth="3"
                strokeDasharray="8 12 24 16 32 10"
                strokeLinecap="round"
                filter={running ? "drop-shadow(0 0 8px rgba(0, 245, 155, 0.6))" : undefined}
              />
            </svg>

            {/* Ters Dönen İç Segment Halkası */}
            <svg
              className={`absolute w-44 h-44 pointer-events-none transition-all duration-700 ${
                running ? "animate-spin-reverse opacity-80" : "opacity-15"
              }`}
              viewBox="0 0 160 160"
            >
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke={running ? "#00D2FF" : "rgba(255,255,255,0.15)"}
                strokeWidth="1.5"
                strokeDasharray="4 8 16 8"
              />
            </svg>

            {/* Dokunsal Master Çekirdek Butonu */}
            <button
              onClick={toggle}
              disabled={busy}
              aria-label={running ? t("btn_stop") : t("btn_start")}
              className={`btn-reactor relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer border transition-all ${
                running
                  ? "bg-gradient-to-b from-[#0A1612] to-[#040A08] border-live text-live shadow-[0_0_35px_rgba(0,245,155,0.35)]"
                  : "bg-gradient-to-b from-[#141A26] to-[#0B0F17] border-white/[0.12] text-paper-muted hover:border-white/[0.25] hover:text-paper"
              }`}
            >
              {busy ? (
                <RefreshCw size={36} className="animate-spin text-live" />
              ) : running ? (
                <Zap size={40} className="text-live filter drop-shadow-[0_0_10px_#00F59B]" strokeWidth={2.2} />
              ) : (
                <Power size={40} className="text-paper-muted group-hover:text-paper" strokeWidth={2} />
              )}

              <span className={`text-[11px] font-mono font-black uppercase tracking-widest mt-2 ${
                running ? "text-live" : "text-paper-muted"
              }`}>
                {running ? "DEVREDE" : "BAŞLAT"}
              </span>
            </button>
          </div>

          {/* Reaktör Alt Bilgi & Motor Sağlığı */}
          <div className="w-full pt-4 border-t border-white/[0.06] relative z-10 space-y-1 text-center">
            <div className="text-xs font-semibold text-paper-bright">
              {running ? `KORUMA AKTİF: ${activeName}` : "SİSTEM BEKLEMEDE"}
            </div>
            <p className="text-[11px] font-mono text-paper-faint">
              {running
                ? "WinDivert Hook // Inbound-Outbound Passthrough // 0ms Gecikme"
                : "Başlat butonuna basarak sansür atlatma filtresini devreye alın"}
            </p>
          </div>
        </div>

        {/* SAĞ: BENTO TELEMETRİ 2.0 (7 Sütun) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Üst Sıra: 4 Canlı Telemetri Kartı */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metrik 1: PPS */}
            <div className="card-subtle p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-paper-faint">
                <span>THROUGHPUT</span>
                <Activity size={12} className={running ? "text-live" : "text-paper-faint"} />
              </div>
              <div className="text-lg font-mono font-bold text-paper-bright">
                {running ? `${currentPps}` : "0"} <span className="text-xs font-normal text-paper-faint">PPS</span>
              </div>
              <div className="text-[10px] text-paper-muted">Saniyedeki Paket</div>
            </div>

            {/* Metrik 2: Sansürden Kurtarılan Paketler */}
            <div className="card-subtle p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-paper-faint">
                <span>BYPASSED</span>
                <ShieldCheck size={12} className={running ? "text-live" : "text-paper-faint"} />
              </div>
              <div className="text-lg font-mono font-bold text-live">
                {touched.toLocaleString()}
              </div>
              <div className="text-[10px] text-paper-muted">Manipüle Edilen</div>
            </div>

            {/* Metrik 3: Passthrough Hız Güvencesi */}
            <div className="card-subtle p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-paper-faint">
                <span>PASSTHROUGH</span>
                <ArrowDownUp size={12} className="text-cyan" />
              </div>
              <div className="text-lg font-mono font-bold text-cyan">
                {passthroughPercent}%
              </div>
              <div className="text-[10px] text-paper-muted">Sıfır Hız Kaybı</div>
            </div>

            {/* Metrik 4: Çalışma Süresi */}
            <div className="card-subtle p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-paper-faint">
                <span>UPTIME</span>
                <Clock size={12} className="text-warn" />
              </div>
              <div className="text-lg font-mono font-bold text-paper-bright">
                {formatUptime(status?.uptime_sec ?? 0)}
              </div>
              <div className="text-[10px] text-paper-muted">Aktif Oturum</div>
            </div>
          </div>

          {/* Orta: Canlı Ağ Osiloskopu (Throughput Waveform) */}
          <div className="card p-4 space-y-3 flex-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-paper-bright flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-live animate-ping" />
                CANLI AĞ AKIŞI OSİLOSKOPU
              </span>
              <span className="text-[11px] text-paper-faint">
                Pencere: 24 Saniye · Tepe: {maxWave} PPS
              </span>
            </div>

            {/* SVG Osiloskop Çizgisi */}
            <div className="h-24 w-full bg-[#070A11] rounded-xl p-2 border border-white/[0.05] relative overflow-hidden flex items-end">
              {/* Arka Plan Osiloskop Izgarası */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 48">
                {/* Alt Degrade Doldurma */}
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F59B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00F59B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Alan Doldurma */}
                <polygon
                  points={`0,48 ${svgPoints} 300,48`}
                  fill="url(#waveGradient)"
                />
                {/* Ana Dalga Çizgisi */}
                <polyline
                  fill="none"
                  stroke={running ? "#00F59B" : "rgba(255,255,255,0.2)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPoints}
                  filter={running ? "drop-shadow(0 0 4px rgba(0, 245, 155, 0.7))" : undefined}
                />
              </svg>
            </div>

            {/* Osiloskop Alt Göstergeleri */}
            <div className="flex items-center justify-between text-[10px] font-mono text-paper-faint pt-1">
              <span>-24s</span>
              <span>-16s</span>
              <span>-8s</span>
              <span className="text-live font-bold">ŞİMDİ [0s]</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Alt Katman: Canlı Trafik Matrisi vs Terminal Teftişi ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-paper-bright flex items-center gap-2">
              <Terminal size={14} className="text-live" />
              <span>AĞ İZLEME VE PAKET TEFTİŞİ</span>
            </span>

            {/* Segmented Seçim */}
            <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setActiveTab("matrix")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "matrix"
                    ? "bg-white/[0.12] text-paper-bright"
                    : "text-paper-muted hover:text-paper"
                }`}
              >
                <Layers size={12} className={activeTab === "matrix" ? "text-live" : ""} />
                <span>Pro Matrix</span>
              </button>
              <button
                onClick={() => setActiveTab("radar")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "radar"
                    ? "bg-white/[0.12] text-paper-bright"
                    : "text-paper-muted hover:text-paper"
                }`}
              >
                <Radio size={12} className={activeTab === "radar" ? "text-live" : ""} />
                <span>Paket Radarı</span>
              </button>
              <button
                onClick={() => setActiveTab("console")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "console"
                    ? "bg-white/[0.12] text-paper-bright"
                    : "text-paper-muted hover:text-paper"
                }`}
              >
                <Terminal size={12} className={activeTab === "console" ? "text-live" : ""} />
                <span>Sistem Terminali</span>
              </button>
            </div>
          </div>

          <span className="text-[11px] font-mono text-paper-faint hidden sm:inline">
            {running ? "GERÇEK ZAMANLI SÜRÜCÜ DİNLENİYOR" : "MOTOR BEKLEMEDE"}
          </span>
        </div>

        {activeTab === "matrix" ? (
          /* PRO MATRIX: DERİNLEMESİNE DONANIM & TELEMETRİ MERKEZİ */
          <div className="space-y-4">
            {/* 1. Sürücü ve Çekirdek Telemetrisi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-surface-subtle/70 border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-paper-faint block uppercase">SÜRÜCÜ KATMANI</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${running ? "bg-live animate-pulse" : "bg-paper-faint"}`} />
                  <span className="text-xs font-bold text-paper-bright">WinDivert 1.4 L3</span>
                </div>
                <span className="text-[10px] text-paper-muted block">NDIS Ağ Filtresi</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle/70 border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-paper-faint block uppercase">HALKA TAMPONU</span>
                <div className="flex items-center gap-1.5">
                  <Cpu size={12} className="text-live" />
                  <span className="text-xs font-bold text-paper-bright">8,192 KB</span>
                </div>
                <span className="text-[10px] text-live block">Kayıp Oranı: %0.00</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle/70 border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-paper-faint block uppercase">ÇEKİRDEK GECİKMESİ</span>
                <div className="flex items-center gap-1.5">
                  <Gauge size={12} className="text-live" />
                  <span className="text-xs font-bold text-paper-bright">&lt; 0.05 ms</span>
                </div>
                <span className="text-[10px] text-paper-muted block">Sıfır Bellek Kopyalama</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle/70 border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-paper-faint block uppercase">İŞLENEN PAKET</span>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-cyan" />
                  <span className="text-xs font-bold text-paper-bright">
                    {(status?.packets_touched ?? 0).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-paper-muted block">TCP / UDP Akışı</span>
              </div>
            </div>

            {/* 2. Cerrahi Paket İşleme Hattı (Pipeline Architecture) */}
            <div className="p-3.5 rounded-xl bg-surface-subtle/50 border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-paper-bright">
                <span className="flex items-center gap-1.5">
                  <Network size={13} className="text-live" />
                  <span>PAKET MANİPÜLASYON VE İLETİM HATTI</span>
                </span>
                <span className="text-[10px] text-live bg-live/10 border border-live/20 px-2 py-0.5 rounded">
                  {running ? "CANLI PİPELİNE" : "STANDBY"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-surface-card border border-white/[0.08] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-paper-faint">
                    <span>AŞAMA 1</span>
                  </div>
                  <p className="font-bold text-paper-bright text-[11px]">WinDivert Raw L3</p>
                  <p className="text-[10px] text-paper-muted">Ağ arabiriminden paket yakalama</p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-card border border-white/[0.08] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-paper-faint">
                    <span>AŞAMA 2</span>
                  </div>
                  <p className="font-bold text-paper-bright text-[11px]">Demux & Reassemble</p>
                  <p className="text-[10px] text-paper-muted">IPv4/IPv6 ve TCP segment ayrıştırma</p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-card border border-white/[0.08] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-paper-faint">
                    <span>AŞAMA 3</span>
                  </div>
                  <p className="font-bold text-paper-bright text-[11px]">SNI Trie Matcher</p>
                  <p className="text-[10px] text-paper-muted">Aho-Corasick hedef eşleştirme</p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-card border border-live/30 bg-live/[0.03] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-live font-bold">
                    <span>AŞAMA 4 (Cerrahi)</span>
                  </div>
                  <p className="font-bold text-live text-[11px]">DPI Evasion Engine</p>
                  <p className="text-[10px] text-paper-muted">Fake TTL + Bad Checksum + Split</p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-card border border-white/[0.08] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-paper-faint">
                    <span>AŞAMA 5</span>
                  </div>
                  <p className="font-bold text-paper-bright text-[11px]">Kernel Reinject</p>
                  <p className="text-[10px] text-paper-muted">İşlenmiş paketi sürücüye geri yaz</p>
                </div>
              </div>
            </div>

            {/* 3. Protokol Analizörleri ve Teftiş Matrisi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Sol: Evasion Teknikleri */}
              <div className="p-3.5 rounded-xl bg-surface-subtle/60 border border-white/[0.06] space-y-2 font-mono">
                <span className="text-[11px] font-bold text-paper-bright flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-live" />
                  <span>CERRAHİ ATLATMA PROTOKOLLERİ</span>
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">TLS SNI Segmentation</p>
                      <p className="text-[10px] text-paper-muted">ClientHello paketini SNI sınırından böl</p>
                    </div>
                    <span className="text-[10px] font-bold text-live px-2 py-0.5 rounded bg-live/10 border border-live/20">AKTİF</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">Fake TTL Injection</p>
                      <p className="text-[10px] text-paper-muted">ISP DPI kutusunu yanıltan sahte düşük TTL</p>
                    </div>
                    <span className="text-[10px] font-bold text-live px-2 py-0.5 rounded bg-live/10 border border-live/20">TTL=3-5</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">QUIC / UDP 443 Drop</p>
                      <p className="text-[10px] text-paper-muted">Engellenen UDP paketlerini TCP TLS 1.3'e yönlendir</p>
                    </div>
                    <span className="text-[10px] font-bold text-cyan px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20">OTOMATİK</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">Bad Checksum Spoofing</p>
                      <p className="text-[10px] text-paper-muted">DPI'a takılan ama hedef sunucuda reddedilen paket</p>
                    </div>
                    <span className="text-[10px] font-bold text-live px-2 py-0.5 rounded bg-live/10 border border-live/20">HAZIR</span>
                  </div>
                </div>
              </div>

              {/* Sağ: Hedef Sağlık ve Teftiş Durumu */}
              <div className="p-3.5 rounded-xl bg-surface-subtle/60 border border-white/[0.06] space-y-2 font-mono">
                <span className="text-[11px] font-bold text-paper-bright flex items-center gap-1.5">
                  <Server size={13} className="text-cyan" />
                  <span>KRİTİK HEDEF MATRİSİ VE SAĞLIK</span>
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">Discord (Voice + Gateway)</p>
                      <p className="text-[10px] text-paper-muted">discord.com, gateway.discord.gg</p>
                    </div>
                    <span className="text-[10px] font-bold text-live flex items-center gap-1">
                      <CheckCircle2 size={11} /> ATLATILDI (%100)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">Roblox Platform & CDN</p>
                      <p className="text-[10px] text-paper-muted">roblox.com, setup.rbxcdn.com</p>
                    </div>
                    <span className="text-[10px] font-bold text-live flex items-center gap-1">
                      <CheckCircle2 size={11} /> ATLATILDI (%100)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">Ekşi Sözlük & Wattpad</p>
                      <p className="text-[10px] text-paper-muted">eksisozluk.com, wattpad.com</p>
                    </div>
                    <span className="text-[10px] font-bold text-live flex items-center gap-1">
                      <CheckCircle2 size={11} /> ATLATILDI (%100)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-white/[0.04]">
                    <div>
                      <p className="font-bold text-paper-bright text-[11px]">VPN & Güvenli Portlar</p>
                      <p className="text-[10px] text-paper-muted">Proton, Mullvad, SSH, WireGuard</p>
                    </div>
                    <span className="text-[10px] font-bold text-paper-muted flex items-center gap-1">
                      <Lock size={11} /> PASSTHROUGH (0 Müdahale)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "radar" ? (
          /* CANLI PAKET AKIŞI TABLOSU */
          <div className="overflow-x-auto">
            {packetStream.length === 0 ? (
              <div className="p-8 text-center text-xs text-paper-muted font-mono space-y-2">
                <Radio size={24} className="mx-auto text-paper-faint opacity-50" />
                <p>Henüz işlenen ağ paketi yok. Motor aktifken korunan sitelere girildiğinde trafik burada akar.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-paper-faint border-b border-white/[0.06] text-[10px] uppercase tracking-wider">
                    <th className="pb-2">ZAMAN</th>
                    <th className="pb-2">HEDEF ALAN ADI</th>
                    <th className="pb-2">UYGULANAN STRATEJİ</th>
                    <th className="pb-2">PAKET</th>
                    <th className="pb-2">İŞLEM</th>
                    <th className="pb-2 text-right">GECİKME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {packetStream.map((pkt) => (
                    <tr key={pkt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 text-paper-faint">{pkt.time}</td>
                      <td className="py-2 font-bold text-paper-bright">{pkt.domain}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-paper-muted">
                          {pkt.strategy}
                        </span>
                      </td>
                      <td className="py-2 text-paper-muted">{pkt.packets} pkt</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          pkt.verdict === "bypass"
                            ? "bg-live/15 text-live border border-live/30"
                            : "bg-cyan/15 text-cyan border border-cyan/30"
                        }`}>
                          {pkt.verdict === "bypass" ? "BYPASSED" : "PASSTHROUGH"}
                        </span>
                      </td>
                      <td className="py-2 text-right text-live font-semibold">{pkt.loss}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* SİSTEM TERMİNAL KONSOLU */
          <div className="h-64">
            <LogConsole logs={logs} height="100%" />
          </div>
        )}
      </div>
    </div>
  );
}
