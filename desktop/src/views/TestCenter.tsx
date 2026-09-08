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
    return () => unbind?.();
  }, []);

  const runSingle = async () => {
    setBusy(true);
    try {
      const res = await api.probeTarget(host.trim());
      setRows((prev) => [{ ...res, id: nextId() }, ...prev]);
      pushLog(`[*] sonda: ${res.host} → ${res.result} (${res.latency_ms ?? "-"} ms)`);
    } catch (e) {
      pushLog(`[!] sonda hatası: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const runBatch = async () => {
    setBatchBusy(true);
    try {
      for (const target of BATCH_TARGETS) {
        const res = await api.probeTarget(target);
        setRows((prev) => [{ ...res, id: nextId() }, ...prev]);
        pushLog(`[*] toplu: ${res.host} → ${res.result} (${res.latency_ms ?? "-"} ms)`);
      }
    } catch (e) {
      pushLog(`[!] toplu hata: ${String(e)}`);
    } finally {
      setBatchBusy(false);
    }
  };

  const runComparison = async () => {
    const target = host.trim();
    if (!target.includes(".")) return;
    setCompareBusy(true);
    setCompareResult(null);
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="pb-3 border-b border-white/[0.08]">
        <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("test_title")}</h2>
        <p className="mt-0.5 text-xs text-paper-muted">{t("test_desc")}</p>
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
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
              <Sparkles size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">
                {t("test_blockcheck_btn")}
              </h3>
              <p className="text-xs text-paper-muted mt-0.5">
                {t("test_blockcheck_desc")}
              </p>
            </div>
          </div>
          <button
            onClick={() => void runAutoDiscover()}
            disabled={blockcheckBusy}
            className="btn btn-primary text-xs self-start sm:self-auto"
          >
            {blockcheckBusy ? <LoaderCircle size={14} className="animate-spin" strokeWidth={2.5} /> : <Sparkles size={14} strokeWidth={2} />}
            <span>{t("test_blockcheck_start")}</span>
          </button>
        </div>

        {blockcheckProg && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-paper-muted">
              <span>{t("test_testing_label")} <b className="text-live font-semibold">{blockcheckProg.profile_name}</b></span>
              <span className="font-mono">{blockcheckProg.current} / {blockcheckProg.total}</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(blockcheckProg.current / blockcheckProg.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {blockcheckResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {blockcheckResults.map((r) => (
              <div
                key={r.profile_id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  r.success
                    ? "bg-live/[0.06] border-live/30 text-live"
                    : "bg-surface-subtle/50 border-white/[0.06] text-paper-faint"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {r.success ? <CheckCircle2 size={16} className="shrink-0 text-live" /> : <XCircle size={16} className="shrink-0 text-paper-faint" />}
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate text-paper-bright">{r.profile_id}</p>
                    {r.latency_ms != null && (
                      <p className="text-[11px] font-mono text-paper-muted">{r.latency_ms} {t("test_latency_suffix")}</p>
                    )}
                  </div>
                </div>
                {r.success && (
                  <button
                    onClick={async () => {
                      try {
                        await api.startEngine(r.profile_id);
                        localStorage.setItem(LAST_PROFILE_KEY, r.profile_id);
                        pushLog(`[+] ${r.profile_id} profili uygulandı ve başlatıldı.`);
                      } catch (e) {
                        pushLog(`[!] Profil başlatma hatası: ${String(e)}`);
                      }
                    }}
                    className="btn btn-primary !py-1 !px-2.5 text-[11px] shrink-0 ml-2"
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
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-3">
        <form
          className="flex flex-col sm:flex-row gap-2.5"
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
            className="input flex-1 text-xs"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !host.includes(".")}
              className="btn btn-primary text-xs flex-1 sm:flex-initial"
            >
              {busy ? <LoaderCircle size={14} className="animate-spin" /> : <FlaskConical size={14} />}
              <span>{t("test_probe_btn")}</span>
            </button>
            <button
              type="button"
              onClick={() => void runBatch()}
              disabled={batchBusy}
              className="btn btn-secondary text-xs"
              title="Yaygın hedefleri sırayla sonda"
            >
              {batchBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{t("test_batch_btn")}</span>
            </button>
            <button
              type="button"
              onClick={() => void runComparison()}
              disabled={compareBusy || !host.includes(".")}
              className="btn btn-secondary text-xs"
              title={t("test_compare_hint")}
            >
              {compareBusy ? <LoaderCircle size={14} className="animate-spin" /> : <GitCompare size={14} />}
              <span>{t("test_compare_btn")}</span>
            </button>
          </div>
        </form>
        <p className="text-[11px] text-paper-faint">{t("test_compare_hint")}</p>

        {compareResult && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {(["off", "on"] as const).map((k) => {
              const r = compareResult[k];
              const isOpen = r.result.startsWith("open");
              const isBlocked = r.result.startsWith("blocked");
              return (
                <div
                  key={k}
                  className={`rounded-xl border p-3.5 ${
                    isOpen
                      ? "border-live/30 bg-live/10 text-live"
                      : isBlocked
                      ? "border-alert/30 bg-alert/10 text-alert"
                      : "border-white/[0.08] bg-surface-subtle text-paper-muted"
                  }`}
                >
                  <p className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">
                    {k === "off" ? t("test_compare_off") : t("test_compare_on")}
                  </p>
                  <p className="mt-1 font-bold text-sm">
                    {isOpen ? t("test_result_open") : isBlocked ? t("test_result_blocked") : r.result}
                  </p>
                  {r.latency_ms != null && <p className="text-[11px] font-mono opacity-70">{r.latency_ms} ms</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sonda Sonuç Listesi */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl min-h-[12rem] space-y-3" aria-label="Probe sonuçları">
        {rows.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={30} aria-hidden />}
            title={t("test_empty_title")}
            hint={t("test_empty_hint")}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <div className="flex rounded-xl bg-surface-subtle p-1 border border-white/[0.06]">
                {(["all", "open", "blocked", "filtered"] as ResultFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setResultFilter(f)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      resultFilter === f ? "bg-white/[0.12] text-paper-bright shadow-sm" : "text-paper-muted hover:text-paper"
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
                className={`btn btn-secondary !py-1 text-xs ${
                  sortByLatency ? "!border-live/40 !text-live" : ""
                }`}
              >
                <ArrowUpDown size={12} aria-hidden strokeWidth={2} />
                <span>{t("test_sort_latency")}</span>
              </button>
            </div>

            <ul className="divide-y divide-white/[0.06]">
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
                  ? "badge-live"
                  : isBlocked
                    ? "badge-alert"
                    : isFiltered
                      ? "badge-warn"
                      : "badge-muted";

                return (
                  <li key={r.id} className="flex items-center gap-3 py-2.5 px-1 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <span className="w-48 truncate font-mono text-xs font-semibold text-paper-bright">{r.host}</span>
                    <span className={`badge ${cls}`}>
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
                        className="text-xs text-live hover:underline font-semibold ml-2 cursor-pointer"
                        title={t("test_add_to_list_title")}
                      >
                        + {t("test_add_to_list_btn")}
                      </button>
                    )}
                    {r.latency_ms != null && (
                      <span className="ml-auto font-mono text-xs text-paper-faint">{r.latency_ms} ms</span>
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
