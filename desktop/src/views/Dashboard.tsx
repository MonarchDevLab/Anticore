import { useEffect, useRef, useState } from "react";
import { Power, UserCheck, LoaderCircle, Activity, Clock, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { api, type Profile, type Status } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import LogConsole from "../components/LogConsole";
import Guide from "../components/Guide";

const DASHBOARD_GUIDE_TR = [
  {
    q: "Bu uygulama tam olarak ne yapıyor?",
    a: "Sitelere bağlanırken ilk 'el sıkışma' paketi, sağlayıcının denetim cihazı (DPI) tarafından okunup engellenir. Anticore bu ilk paketi parçalayıp yanıltıcı bir kopya göndererek denetimi atlatır; gerisi normal internet gibi akar.",
  },
  {
    q: "Neden hızım düşmüyor?",
    a: "Yalnızca bağlantının ilk anındaki bir-iki pakete dokunulur. İndirme/yükleme verisi asla bu uygulamadan geçmez — doğrudan siteye gider. Bu yüzden hız testlerinde fark görülmez.",
  },
  {
    q: "Profil nedir, hangisini seçmeliyim?",
    a: "Profil, sağlayıcının engel davranışına göre hazırlanmış ayar setidir. Sağlayıcınızı biliyorsanız doğrudan onu seçin (ör. Superonline, Türk Telekom), bilmiyorsanız 'Evrensel' ile başlayın veya Test Merkezi'nde otomatik tarama yapın.",
  },
  {
    q: "Passthrough (dokunulmayan geçiş) sayısı ne demek?",
    a: "Hedef listeniz dışındaki trafiğin kaç paketinin hiç dokunulmadan geçtiğini gösterir. Bu sayı hızla artıyorsa uygulama yalnızca gerektiğinde devreye giriyor demektir — istenen ideal davranış.",
  },
];

const DASHBOARD_GUIDE_EN = [
  {
    q: "What does this application do exactly?",
    a: "When connecting to certain websites, the initial handshake packet is inspected and blocked by ISP DPI hardware. Anticore fragments this first packet and injects fake headers to bypass inspection; the rest of the stream flows directly.",
  },
  {
    q: "Why is there zero speed loss?",
    a: "Only the first one or two handshake packets are touched. Heavy download and upload payload never passes through this app — it connects directly to the server. Zero latency and zero throughput degradation.",
  },
  {
    q: "What is a profile, and which should I pick?",
    a: "A profile is a tuned sequence of strategies matched to an ISP's filtering behavior. If you know your ISP (e.g. Superonline, Turk Telekom), select it directly; otherwise use Universal or run Auto-Discovery in Test Center.",
  },
  {
    q: "What is the Passthrough packet count?",
    a: "It shows how many packets outside your target list were forwarded untouched without processing. A rapidly increasing count confirms the engine acts only when strictly required.",
  },
];

interface Props {
  status: Status | null;
  running: boolean;
  logs: string[];
  pushLog: (line: string) => void;
  selectedProfile: string;
  onSelectedProfileChange: (id: string) => void;
}

export default function Dashboard({
  status,
  running,
  logs,
  pushLog,
  selectedProfile: selected,
  onSelectedProfileChange: setSelected,
}: Props) {
  const { lang, t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashMode, setDashMode] = useState<"simple" | "matrix">(() => {
    return (localStorage.getItem("anticore_dash_mode") as "simple" | "matrix") || "simple";
  });

  const handleModeChange = (mode: "simple" | "matrix") => {
    setDashMode(mode);
    localStorage.setItem("anticore_dash_mode", mode);
  };

  const [history, setHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const lastTouchedRef = useRef<number>(0);

  useEffect(() => {
    void api.listProfiles().then(setProfiles);
  }, []);

  useEffect(() => {
    if (status?.running) {
      setSelected(status.profile_id);
    }
  }, [status?.running, status?.profile_id]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const currentTouched = status?.packets_touched ?? 0;
      const delta = Math.max(0, currentTouched - lastTouchedRef.current);
      lastTouchedRef.current = currentTouched;
      setHistory((prev) => [...prev.slice(1), delta]);
    }, 1000);
    return () => clearInterval(interval);
  }, [running, status?.packets_touched]);

  const needsAdmin = error !== null && /Yönetici|yönetici|erişim|access|admin/i.test(error);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (running) {
        await api.stopEngine();
        pushLog("[*] durdurma isteği gönderildi");
      } else {
        await api.startEngine(selected);
        pushLog(`[*] başlatma isteği: profil=${selected}`);
      }
    } catch (e) {
      const msg = String(e);
      setError(msg);
      pushLog(`[!] HATA: ${msg}`);
    } finally {
      setTimeout(() => setBusy(false), 400);
    }
  };

  const elevate = async () => {
    setBusy(true);
    try {
      await api.restartAsAdmin();
    } catch (e) {
      pushLog(`[!] yükseltme: ${String(e)}`);
      setBusy(false);
    }
  };

  const activeProfile = profiles.find((p) => p.id === (status?.profile_id || selected));
  const activeName = activeProfile?.name ?? status?.profile_id;
  const guideItems = lang === "tr" ? DASHBOARD_GUIDE_TR : DASHBOARD_GUIDE_EN;

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const maxHistory = Math.max(...history, 5);

  const POPULAR_SERVICES = [
    { name: "Discord", category: "VoIP & CDN", domain: "discord.com / discordapp.net" },
    { name: "Roblox", category: "Game Engine", domain: "roblox.com / rbxcdn.com" },
    { name: "YouTube", category: "4K Video Stream", domain: "googlevideo.com / ytimg.com" },
    { name: "Twitch", category: "Live Stream", domain: "twitch.tv / ttvnw.net" },
    { name: "Instagram", category: "Social Media", domain: "instagram.com / cdninstagram.com" },
    { name: "X / Twitter", category: "Microblogging", domain: "x.com / twimg.com" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Guide items={guideItems} />

      {/* Görünüm Modu Seçici (Basit vs Pro Matrix) */}
      <div className="flex items-center justify-between border-[3px] border-white/20 bg-black p-3 shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-white/50">
            {t("dash_mode_toggle")}:
          </span>
          <span className={`font-mono text-xs font-bold uppercase ${dashMode === "simple" ? "text-live" : "text-neon-cyan"}`}>
            [{dashMode === "simple" ? t("dash_mode_simple") : t("dash_mode_matrix")}]
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleModeChange("simple")}
            className={`btn py-1.5 px-4 text-xs font-mono font-bold uppercase transition-none ${
              dashMode === "simple"
                ? "bg-white text-black border-white shadow-[2px_2px_0px_rgba(255,255,255,0.4)]"
                : "bg-black text-white/60 border-white/20 hover:text-white"
            }`}
          >
            {t("dash_mode_simple")}
          </button>
          <button
            onClick={() => handleModeChange("matrix")}
            className={`btn py-1.5 px-4 text-xs font-mono font-bold uppercase transition-none ${
              dashMode === "matrix"
                ? "bg-neon-cyan text-black border-neon-cyan shadow-[2px_2px_0px_var(--color-neon-cyan)]"
                : "bg-black text-white/60 border-white/20 hover:text-white"
            }`}
          >
            {t("dash_mode_matrix")}
          </button>
        </div>
      </div>

      {dashMode === "simple" ? (
        /* ══════════════ BASİT MOD ARAYÜZÜ ══════════════ */
        <div className="space-y-6">
          <section className="relative overflow-hidden flex min-w-0 flex-wrap items-center gap-8 p-8 lg:gap-12 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
            <button
              onClick={toggle}
              disabled={busy}
              aria-label={running ? t("btn_stop") : t("btn_start")}
              className={`group relative flex h-48 w-48 shrink-0 flex-col items-center justify-center gap-4 border-[3px] transition-none active:translate-y-1 active:shadow-none overflow-hidden ${
                running
                  ? "border-live bg-live/10 shadow-[6px_6px_0px_var(--color-neon-live)]"
                  : "border-white/30 bg-black hover:border-white/60 hover:bg-white/5 shadow-[6px_6px_0px_rgba(255,255,255,0.2)]"
              }`}
            >
              {busy ? (
                <LoaderCircle className="animate-spin text-live relative z-10" size={56} aria-hidden strokeWidth={3} />
              ) : running ? (
                <Zap className="text-live relative z-10 animate-pulse" size={60} aria-hidden strokeWidth={2} />
              ) : (
                <Power className="text-white/70 group-hover:text-white relative z-10" size={60} aria-hidden strokeWidth={2} />
              )}

              <div className="relative z-10 font-mono text-sm font-black tracking-[0.25em] uppercase">
                {running ? (
                  <span className="text-live">{t("btn_stop")}</span>
                ) : (
                  <span className="text-white/70 group-hover:text-white">{t("btn_start")}</span>
                )}
              </div>
            </button>

            <div className="min-w-0 flex-1 relative z-10">
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50 bg-white/10 px-2.5 py-1 inline-block border border-white/20">
                  {t("dash_state_title")}
                </p>
                {running && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-black tracking-widest text-black bg-live px-3 py-1 uppercase shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                    <ShieldCheck size={14} /> {t("status_active")}
                  </span>
                )}
              </div>
              <h2 className={`font-mono text-5xl font-black tracking-tighter mt-3 uppercase ${running ? "text-live" : "text-white"}`}>
                {running ? t("dash_state_active") : t("dash_state_passive")}
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/70 max-w-xl border-l-4 border-white/20 pl-4">
                {running
                  ? `${activeName ?? ""} ${t("dash_active_desc")}`
                  : t("dash_passive_desc")}
              </p>

              {!running && (
                <div className="mt-6 max-w-md bg-black border-2 border-white/20 p-4 shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
                  <label htmlFor="simple-profile-sel" className="mb-2 block text-xs font-black tracking-widest text-white/50 uppercase">
                    {t("dash_start_profile")}
                  </label>
                  <select
                    id="simple-profile-sel"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="w-full bg-black border-2 border-white/20 text-white font-mono text-xs py-2 px-3 font-bold focus:border-live focus:outline-none focus:ring-0 rounded-none"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && !needsAdmin && (
                <div role="alert" className="mt-4 bg-black border-2 border-alert p-3 text-xs font-bold text-alert shadow-[4px_4px_0px_#fff] uppercase font-mono">
                  [HATA] {error}
                </div>
              )}

              {needsAdmin && (
                <div className="mt-4 bg-black border-2 border-warn p-4 shadow-[4px_4px_0px_#fff] text-warn font-mono">
                  <p className="text-xs font-black uppercase tracking-wide leading-relaxed">
                    {t("dash_admin_warn")}
                  </p>
                  <button className="mt-3 w-full flex items-center justify-center bg-warn text-black border-2 border-warn font-black uppercase tracking-widest py-2 text-xs hover:bg-white hover:text-black hover:border-white transition-none active:translate-y-1" onClick={() => void elevate()} disabled={busy}>
                    <UserCheck size={14} aria-hidden className="mr-2" strokeWidth={3} />
                    {t("dash_admin_btn")}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Korunan Popüler Servisler Grid */}
          <section className="border-[3px] border-white/20 bg-black p-6 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-mono text-xs font-black uppercase tracking-widest text-white">
                  {t("dash_protected_platforms")}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  {t("dash_protected_hint")}
                </p>
              </div>
              <span className="badge badge-live">
                {running ? "DPI FİLTRESİ DEVREDE" : "BEKLEMEDE"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_SERVICES.map((srv, idx) => (
                <div key={idx} className="border-2 border-white/15 bg-surface-subtle p-3 flex items-center justify-between hover:border-white/40 transition-none">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white uppercase">{srv.name}</span>
                      <span className="text-[10px] font-mono text-white/40 uppercase bg-white/5 px-1.5 py-0.5 border border-white/10">{srv.category}</span>
                    </div>
                    <p className="font-mono text-[11px] text-white/50 mt-1 truncate max-w-[180px]">{srv.domain}</p>
                  </div>
                  {running ? (
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-live">
                      <CheckCircle2 size={13} /> SIFIR KAYIP
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-white/30">HAZIR</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ══════════════ PRO MATRIX ARAYÜZÜ ══════════════ */
        <div className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
            {/* Ana Durum Bloğu - MATRIX */}
            <section className="relative overflow-hidden flex min-w-0 flex-wrap items-center gap-10 p-10 lg:gap-14 bg-black border-[3px] border-white/20 shadow-[8px_8px_0px_rgba(255,255,255,0.05)]">
              <button
                onClick={toggle}
                disabled={busy}
                aria-label={running ? t("btn_stop") : t("btn_start")}
                className={`group relative flex h-56 w-56 shrink-0 flex-col items-center justify-center gap-5 border-[3px] transition-none active:translate-y-2 active:shadow-none overflow-hidden ${
                  running
                    ? "border-live bg-live/10 shadow-[8px_8px_0px_var(--color-neon-live)]"
                    : "border-white/30 bg-black hover:border-white/60 hover:bg-white/5 shadow-[8px_8px_0px_rgba(255,255,255,0.2)]"
                }`}
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '1rem 1rem' }} />
                
                {busy ? (
                  <LoaderCircle className="animate-spin text-live relative z-10" size={64} aria-hidden strokeWidth={3} />
                ) : running ? (
                  <Zap className="text-live relative z-10 animate-pulse" size={72} aria-hidden strokeWidth={2} />
                ) : (
                  <Power className="text-white/70 group-hover:text-white relative z-10" size={72} aria-hidden strokeWidth={2} />
                )}

                <div className="relative z-10 font-mono text-sm font-black tracking-[0.3em] uppercase">
                  {running ? (
                    <span className="text-live">{t("btn_stop")}</span>
                  ) : (
                    <span className="text-white/70 group-hover:text-white">{t("btn_start")}</span>
                  )}
                </div>
              </button>

              <div className="min-w-0 flex-1 relative z-10">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-white/50 bg-white/10 px-2 py-1 inline-block border border-white/20">
                    {t("dash_state_title")}
                  </p>
                  {running && (
                    <span className="flex items-center gap-2 text-xs font-mono font-black tracking-widest text-black bg-live px-3 py-1 uppercase shadow-[3px_3px_0px_rgba(255,255,255,0.2)]">
                      <Activity size={12} className="animate-bounce" /> CANLI
                    </span>
                  )}
                </div>
                <h2 className={`font-mono text-6xl font-black tracking-tighter mt-4 uppercase ${running ? "text-live drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]" : "text-white"}`}>
                  {running ? t("dash_state_active") : t("dash_state_passive")}
                </h2>
                <p className="mt-4 text-base font-medium leading-relaxed text-white/70 max-w-lg border-l-4 border-white/20 pl-4">
                  {running
                    ? `${activeName ?? ""} ${t("dash_active_desc")}`
                    : t("dash_passive_desc")}
                </p>

                {/* Aktif Profil Rozetleri */}
                {running && activeProfile && activeProfile.steps.length > 0 && (
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                    <span className="text-xs font-black tracking-widest text-white/50 mr-2 uppercase block w-full mb-1">
                      {t("dash_strategy_chain")}
                    </span>
                    {activeProfile.steps.map((st, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center bg-black border border-live px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-live shadow-[2px_2px_0px_var(--color-neon-live)] uppercase"
                      >
                        {st.type === "fake_ttl"
                          ? `TTL:${st.ttl}`
                          : st.type === "fragment_tls"
                          ? `TLS:${st.mode}`
                          : st.type}
                      </span>
                    ))}
                  </div>
                )}

                {!running && (
                  <div className="mt-8 max-w-sm bg-black border-2 border-white/10 p-4 shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
                    <label htmlFor="profile-sel" className="mb-3 block text-xs font-black tracking-widest text-white/50 uppercase">
                      {t("dash_start_profile")}
                    </label>
                    <select
                      id="profile-sel"
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                      className="w-full bg-black border-2 border-white/20 text-white font-mono text-sm py-3 px-3 font-bold focus:border-white focus:outline-none focus:ring-0 appearance-none rounded-none"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.id.toUpperCase()}] - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Canlı Throughput Sparkline */}
                {running && (
                  <div className="mt-6 p-5 bg-black border-2 border-live/30 max-w-md shadow-[4px_4px_0px_var(--color-neon-live)]">
                    <div className="flex items-center justify-between text-xs text-live mb-4 font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        <Activity size={14} className="text-live" /> {t("dash_throughput")}
                      </span>
                      <span className="text-sm">
                        {history[history.length - 1]} PPS
                      </span>
                    </div>
                    <div className="flex items-end gap-[2px] h-12">
                      {history.map((val, i) => {
                        const hPercent = Math.max(10, Math.round((val / maxHistory) * 100));
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-live hover:bg-white transition-none"
                            style={{ height: `${hPercent}%` }}
                            title={`${val} pps`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {error && !needsAdmin && (
                  <div role="alert" className="mt-6 bg-black border-4 border-alert p-4 text-sm font-bold text-alert shadow-[6px_6px_0px_#fff] uppercase font-mono">
                    [HATA] {error}
                  </div>
                )}

                {needsAdmin && (
                  <div className="mt-6 bg-black border-4 border-warn p-5 shadow-[6px_6px_0px_#fff] text-warn font-mono">
                    <p className="text-sm font-black uppercase tracking-wide leading-relaxed">
                      {t("dash_admin_warn")}
                    </p>
                    <button className="mt-4 w-full flex items-center justify-center bg-warn text-black border-2 border-warn font-black uppercase tracking-widest py-3 hover:bg-white hover:text-black hover:border-white transition-none active:translate-y-1" onClick={() => void elevate()} disabled={busy}>
                      <UserCheck size={18} aria-hidden className="mr-2" strokeWidth={3} />
                      {t("dash_admin_btn")}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Dikey istatistik kolonu */}
            <aside className="flex flex-col gap-4" aria-label="Canlı istatistikler">
              <Stat label={t("dash_stat_seen")} value={status?.packets_seen ?? 0} />
              <Stat label={t("dash_stat_bypassed")} value={status?.packets_touched ?? 0} accent />
              <Stat label={t("dash_stat_passthrough")} value={status?.passthrough ?? 0} tone="text-neon-cyan" />
              <Stat
                label={t("dash_stat_uptime")}
                stringValue={running ? formatUptime(status?.uptime_sec ?? 0) : "--:--:--"}
                tone={running ? "text-white" : "text-white/50"}
                icon={<Clock size={16} className="text-white/50" />}
              />
            </aside>
          </div>

          <div className="border-[3px] border-white/20 p-1 bg-black">
            <LogConsole logs={logs} height="16rem" />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  stringValue,
  accent,
  tone,
  icon,
}: {
  label: string;
  value?: number;
  stringValue?: string;
  accent?: boolean;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-1 flex-col justify-center p-5 bg-black border-[3px] transition-none hover:-translate-y-1 ${accent ? 'border-live shadow-[4px_4px_0px_var(--color-neon-live)]' : 'border-white/20 shadow-[4px_4px_0px_rgba(255,255,255,0.05)] hover:border-white/40'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">{label}</p>
        {icon}
      </div>
      <p
        className={`mt-2 font-mono text-3xl font-black tabular-nums tracking-tighter ${
          tone ?? (accent ? "text-live" : "text-white")
        }`}
      >
        {stringValue !== undefined ? stringValue : (value ?? 0).toLocaleString()}
      </p>
    </div>
  );
}
