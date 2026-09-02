import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  FlaskConical,
  GitCompare,
  LoaderCircle,
  Play,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api, onBlockcheckProgress, type BlockcheckProgress, type BlockcheckResult, type ProbeDto } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import EmptyState from "../components/EmptyState";
import Guide from "../components/Guide";

interface Row extends ProbeDto {
  id: number;
}

const BATCH_TARGETS = ["discord.com", "gateway.discord.gg", "instagram.com", "roblox.com"];
const LAST_PROFILE_KEY = "anticore_last_profile";
type ResultFilter = "all" | "open" | "blocked" | "filtered";

export default function TestCenter({ pushLog }: { pushLog: (l: string) => void }) {
  const { t, lang } = useI18n();
  const [host, setHost] = useState("discord.com");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);

  // Blockcheck state
  const [blockcheckBusy, setBlockcheckBusy] = useState(false);
  const [blockcheckProg, setBlockcheckProg] = useState<BlockcheckProgress | null>(null);
  const [blockcheckResults, setBlockcheckResults] = useState<BlockcheckResult[]>([]);

  // AÇIK/KAPALI kıyaslama
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareResult, setCompareResult] = useState<{ off: ProbeDto; on: ProbeDto } | null>(null);

  // Sonuç listesi filtre/sıralama
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [sortByLatency, setSortByLatency] = useState(false);

  const seq = useRef(0);
  const nextId = () => ++seq.current;

  const displayedRows = useMemo(() => {
    let list = rows;
    if (resultFilter !== "all") {
      list = list.filter((r) => r.result.startsWith(resultFilter));
    }
    if (sortByLatency) {
      list = [...list].sort((a, b) => (a.latency_ms ?? Infinity) - (b.latency_ms ?? Infinity));
    }
    return list;
  }, [rows, resultFilter, sortByLatency]);

  useEffect(() => {
    let unbind: (() => void) | undefined;
    void onBlockcheckProgress((p) => {
      setBlockcheckProg(p);
    }).then((u) => {
      unbind = u;
    });
    return () => {
      if (unbind) unbind();
    };
  }, []);

  const probe = async (target: string): Promise<ProbeDto> => {
    const r = await api.probeTarget(target);
    setRows((prev) => [{ ...r, id: nextId() }, ...prev].slice(0, 40));
    pushLog(
      `[i] probe ${r.host} → ${r.result}${r.latency_ms != null ? ` (${r.latency_ms}ms)` : ""}`,
    );
    return r;
  };

  const runSingle = async () => {
    if (!host.includes(".")) return;
    setBusy(true);
    try {
      await probe(host.trim().toLowerCase());
    } catch (e) {
      pushLog(`[!] probe hatası: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const runBatch = async () => {
    setBatchBusy(true);
    try {
      for (const t of BATCH_TARGETS) {
        await probe(t);
      }
    } catch (e) {
      pushLog(`[!] toplu test hatası: ${String(e)}`);
    } finally {
      setBatchBusy(false);
    }
  };

  /**
   * Motoru sırayla KAPALI ve AÇIK durumda aynı hedefe sondalayıp sonuçları
   * karşılaştırır. WinDivert sistem genelinde 443/80 çıkışını yakaladığı
   * için (kaynak süreç ayrımı yapmadan) bu sondanın kendisi de motor
   * AÇIKKEN gerçekten bypass zincirinden geçer — kıyaslama gerçek.
   * Motorun önceki durumu (çalışıyorsa hangi profille) korunur.
   */
  const runComparison = async () => {
    if (!host.includes(".")) return;
    setCompareBusy(true);
    setCompareResult(null);
    const target = host.trim().toLowerCase();
    try {
      const initial = await api.getStatus();
      const wasRunning = initial.running;
      const restoreProfile = wasRunning ? initial.profile_id : null;
      const compareProfile = initial.profile_id || localStorage.getItem(LAST_PROFILE_KEY) || "universal";

      if (wasRunning) {
        await api.stopEngine();
        await new Promise((r) => setTimeout(r, 200));
      }
      const off = await api.probeTarget(target);

      await api.startEngine(compareProfile);
      await new Promise((r) => setTimeout(r, 300));
      const on = await api.probeTarget(target);

      if (!wasRunning) {
        await api.stopEngine();
      } else if (restoreProfile && restoreProfile !== compareProfile) {
        await api.stopEngine();
        await api.startEngine(restoreProfile);
      }

      setCompareResult({ off, on });
      pushLog(`[i] Kıyaslama (${target}): KAPALI=${off.result} → AÇIK=${on.result}`);
    } catch (e) {
      pushLog(`[!] Kıyaslama hatası: ${String(e)}`);
    } finally {
      setCompareBusy(false);
    }
  };

  const runAutoDiscover = async () => {
    setBlockcheckBusy(true);
    setBlockcheckProg(null);
    setBlockcheckResults([]);
    try {
      pushLog("[*] Otomatik profil keşfi (Blockcheck) başlatıldı...");
      const res = await api.autoDiscoverProfile();
      setBlockcheckResults(res);
      pushLog(`[+] Keşif tamamlandı. ${res.filter((r) => r.success).length} uyumlu profil bulundu.`);
    } catch (e) {
      pushLog(`[!] Blockcheck hatası: ${String(e)}`);
    } finally {
      setBlockcheckBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b-2 border-white/20 pb-4">
        <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-white">{t("test_title")}</h2>
        <p className="mt-1 text-xs font-mono text-white/60">{t("test_desc")}</p>
      </header>

      <Guide
        title={lang === "tr" ? "Sonda ve Otomatik Keşif Nasıl Çalışır?" : "How Do Probing and Auto-Discovery Work?"}
        items={
          lang === "tr"
            ? [
                {
                  q: "Engel tespiti nasıl anlaşılıyor?",
                  a: "Hedefe sentetik bir TLS el sıkışması gönderilir. Gerçek sunucu bunu sessizce düşürmez; engel cihazı bağlantıyı hemen sıfırlar (RST) ya da paketleri düşürür.",
                },
                {
                  q: "Otomatik Strateji Keşfi (Blockcheck) ne yapar?",
                  a: "Tüm yerleşik ISP profillerini sırayla test ederek internet sağlayıcınızın engelini en düşük gecikmeyle aşan en ideal profili otomatik olarak tespit eder.",
                },
              ]
            : [
                {
                  q: "How is a block detected?",
                  a: "A synthetic TLS handshake is sent to the target. A real server never silently drops it; a blocking device resets the connection (RST) immediately or drops the packets.",
                },
                {
                  q: "What does Auto-Discovery (Blockcheck) do?",
                  a: "It tests every built-in ISP profile in sequence and automatically identifies whichever one bypasses your provider's block with the lowest latency.",
                },
              ]
        }
      />

      {/* Otomatik Keşif Bölümü */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-live" strokeWidth={2.5} />
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                {t("test_blockcheck_btn")}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-white/60">
                {t("test_blockcheck_desc")}
              </p>
            </div>
          </div>
          <button
            onClick={() => void runAutoDiscover()}
            disabled={blockcheckBusy}
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-2 hover:bg-live/90"
          >
            {blockcheckBusy ? <LoaderCircle size={15} className="animate-spin text-black" strokeWidth={3} /> : <Sparkles size={15} strokeWidth={2.5} />}
            {t("test_blockcheck_start")}
          </button>
        </div>

        {blockcheckProg && (
          <div className="mt-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-white/60 uppercase">
              <span>{t("test_testing_label")} <b className="text-live font-bold">{blockcheckProg.profile_name}</b></span>
              <span>{blockcheckProg.current} / {blockcheckProg.total}</span>
            </div>
            <div className="h-2 w-full bg-black border border-white/20 rounded-none overflow-hidden">
              <div
                className="h-full bg-live transition-all duration-150"
                style={{ width: `${(blockcheckProg.current / blockcheckProg.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {blockcheckResults.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2.5 font-mono text-xs">
            {blockcheckResults.map((r) => (
              <div
                key={r.profile_id}
                className={`flex items-center justify-between p-3.5 rounded-none border-2 shadow-[2px_2px_0px_rgba(255,255,255,0.03)] ${
                  r.success ? "bg-black border-live text-live" : "bg-black border-white/10 text-white/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {r.success ? <CheckCircle2 size={16} className="shrink-0 text-live" strokeWidth={2.5} /> : <XCircle size={16} className="shrink-0 text-white/30" strokeWidth={2.5} />}
                  <div className="min-w-0">
                    <p className="font-bold truncate uppercase">{r.profile_id}</p>
                    {r.latency_ms != null && (
                      <p className="text-[10px] text-white/50">{r.latency_ms} {t("test_latency_suffix")}</p>
                    )}
                  </div>
                </div>
                {r.success && (
                  <button
                    onClick={async () => {
                      try {
                        await api.startEngine(r.profile_id);
                        localStorage.setItem(LAST_PROFILE_KEY, r.profile_id);
                        pushLog(`[+] ${r.profile_id} profili başarıyla uygulandı, başlatıldı ve varsayılan yapıldı.`);
                      } catch (e) {
                        pushLog(`[!] Profil başlatma hatası: ${String(e)}`);
                      }
                    }}
                    className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase !text-[10px] !py-1 !px-2.5 shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none shrink-0 ml-2"
                  >
                    {t("test_apply_btn")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manuel Sonda */}
      <section className="relative overflow-hidden p-6 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <form
          className="flex gap-2 font-mono"
          onSubmit={(e) => {
            e.preventDefault();
            void runSingle();
          }}
        >
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            aria-label="Test edilecek domain"
            placeholder="discord.com"
            className="flex-1 rounded-none border-2 border-white/20 bg-black px-3 py-2 font-mono text-xs text-white focus:border-live shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !host.includes(".")}
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5 hover:bg-live/90"
          >
            {busy ? <LoaderCircle size={14} className="animate-spin text-black" strokeWidth={3} /> : <FlaskConical size={14} strokeWidth={2.5} />}
            {t("test_probe_btn")}
          </button>
          <button
            type="button"
            onClick={() => void runBatch()}
            disabled={batchBusy}
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3.5 py-2 transition-none flex items-center gap-1.5"
            title="Yaygın hedefleri sırayla sonda"
          >
            {batchBusy ? <LoaderCircle size={14} className="animate-spin text-live" strokeWidth={3} /> : <Play size={14} strokeWidth={2.5} />}
            {t("test_batch_btn")}
          </button>
          <button
            type="button"
            onClick={() => void runComparison()}
            disabled={compareBusy || !host.includes(".")}
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3.5 py-2 transition-none flex items-center gap-1.5"
            title={t("test_compare_hint")}
          >
            {compareBusy ? <LoaderCircle size={14} className="animate-spin text-live" strokeWidth={3} /> : <GitCompare size={14} strokeWidth={2.5} />}
            {t("test_compare_btn")}
          </button>
        </form>
        <p className="mt-2 font-mono text-[11px] text-white/50">{t("test_compare_hint")}</p>

        {compareResult && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono text-xs">
            {(["off", "on"] as const).map((k) => {
              const r = compareResult[k];
              const isOpen = r.result.startsWith("open");
              const isBlocked = r.result.startsWith("blocked");
              return (
                <div
                  key={k}
                  className={`rounded-none border-2 p-3.5 shadow-[2px_2px_0px_rgba(255,255,255,0.05)] bg-black ${
                    isOpen ? "border-live text-live" : isBlocked ? "border-alert text-alert" : "border-white/20 text-white/60"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider font-black opacity-70">
                    {k === "off" ? t("test_compare_off") : t("test_compare_on")}
                  </p>
                  <p className="mt-1 font-bold uppercase text-sm">
                    {isOpen ? t("test_result_open") : isBlocked ? t("test_result_blocked") : r.result}
                  </p>
                  {r.latency_ms != null && <p className="text-xs text-white/50">{r.latency_ms} ms</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sonda Sonuç Listesi */}
      <section className="relative overflow-hidden p-6 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] min-h-[14rem]" aria-label="Probe sonuçları">
        {rows.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={30} aria-hidden />}
            title={t("test_empty_title")}
            hint={t("test_empty_hint")}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex rounded-none border-2 border-white/20 bg-black p-0.5">
                {(["all", "open", "blocked", "filtered"] as ResultFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setResultFilter(f)}
                    className={`rounded-none px-3 py-1 font-mono text-xs uppercase font-bold transition-none ${
                      resultFilter === f ? "bg-live text-black" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {f === "all"
                      ? t("logs_level_all")
                      : f === "open"
                        ? t("test_result_open")
                        : f === "blocked"
                          ? t("test_result_blocked")
                          : t("test_result_filtered")}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSortByLatency((v) => !v)}
                className={`btn rounded-none border-2 border-white/20 bg-black font-mono text-xs uppercase px-3 py-1 shadow-[2px_2px_0px_rgba(255,255,255,0.05)] transition-none flex items-center gap-1.5 ${
                  sortByLatency ? "border-live text-live" : "text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                <ArrowUpDown size={12} aria-hidden strokeWidth={2.5} />
                {t("test_sort_latency")}
              </button>
            </div>
            <ul className="divide-y divide-white/10 font-mono">
              {displayedRows.map((r) => {
              const isBlocked = r.result.startsWith("blocked");
              const isOpen = r.result.startsWith("open");
              const isFiltered = r.result.startsWith("filtered");
              const label = isOpen
                ? t("test_result_open")
                : isBlocked
                  ? t("test_result_blocked")
                  : isFiltered
                    ? t("test_result_filtered")
                    : r.result.toUpperCase();
              const cls = isOpen
                ? "text-live border-live/60 bg-live/10"
                : isBlocked
                  ? "text-alert border-alert/60 bg-alert/10"
                  : isFiltered
                    ? "text-warn border-warn/60 bg-warn/10"
                    : "text-white/50 border-white/20 bg-black";
              return (
                <li key={r.id} className="flex items-center gap-3 py-3 px-1 hover:bg-white/[0.02]">
                  <span className="w-52 truncate font-mono text-xs font-bold text-white uppercase">{r.host}</span>
                  <span className={`rounded-none px-2.5 py-0.5 font-mono text-xs font-black uppercase border ${cls}`}>
                    {label}
                  </span>
                  {isBlocked && (
                    <button
                      onClick={async () => {
                        try {
                          await api.addSite(r.host);
                          pushLog(`[+] ${r.host} hedef listesine eklendi.`);
                        } catch (e) {
                          pushLog(`[!] Hata: ${String(e)}`);
                        }
                      }}
                      className="text-[11px] text-live hover:underline font-mono ml-2 uppercase font-bold"
                      title={t("test_add_to_list_title")}
                    >
                      + {t("test_add_to_list_btn")}
                    </button>
                  )}
                  {r.latency_ms != null && (
                    <span className="ml-auto font-mono text-xs text-white/50">{r.latency_ms} ms</span>
                  )}
                </li>
              );
            })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
