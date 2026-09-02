import { useEffect, useMemo, useRef, useState } from "react";
import { Download, LoaderCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { api } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import ConfirmDialog from "../components/ConfirmDialog";

interface Props {
  /** App.tsx'in tuttuğu canlı akış — Dashboard'daki LogConsole ile AYNI kaynak. */
  liveLogs: string[];
  pushLog: (l: string) => void;
}

type Level = "all" | "success" | "info" | "error";

export default function LogsView({ liveLogs, pushLog }: Props) {
  const { t } = useI18n();
  const [historyLogs, setHistoryLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<Level>("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState<"export" | "clear" | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const loadHistory = () => {
    setLoading(true);
    void api
      .getLogFile(2000)
      .then(setHistoryLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(loadHistory, []);

  // Dosyadan yüklenen geçmiş + canlı akış birleşik gösterilir. Mükemmel
  // de-dup yapılmıyor (açılıştaki ilk birkaç canlı satır dosyada da olabilir)
  // — bu bir log görüntüleyici, kayıt bütünlüğü kritik değil.
  const allLogs = useMemo(() => [...historyLogs, ...liveLogs], [historyLogs, liveLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLogs.filter((l) => {
      if (level === "error" && !l.includes("[!]")) return false;
      if (level === "success" && !l.includes("[+]")) return false;
      if (level === "info" && !l.includes("[i]") && !l.includes("[*]")) return false;
      if (q && !l.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allLogs, level, search]);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length]);

  const doExport = async () => {
    setBusy("export");
    try {
      const saved = await api.exportLogToFile();
      if (saved) pushLog("[+] Log dosyası dışa aktarıldı");
    } catch (e) {
      pushLog(`[!] Dışa aktarma hatası: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const doClear = async () => {
    setBusy("clear");
    try {
      await api.clearLogFile();
      setHistoryLogs([]);
      pushLog("[*] Log dosyası temizlendi");
    } catch (e) {
      pushLog(`[!] Temizleme hatası: ${String(e)}`);
    } finally {
      setBusy(null);
      setConfirmClear(false);
    }
  };

  const levels: Level[] = ["all", "success", "info", "error"];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-white/20 pb-4">
        <div>
          <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-white">{t("nav_logs")}</h2>
          <p className="mt-1 text-xs font-mono text-white/60">{t("logs_view_desc")}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3.5 py-1.5 transition-none flex items-center gap-1.5"
            onClick={loadHistory}
            disabled={loading}
          >
            {loading ? <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={3} /> : <RefreshCw size={14} aria-hidden strokeWidth={2.5} />}
            {t("btn_refresh")}
          </button>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3.5 py-1.5 transition-none flex items-center gap-1.5"
            onClick={() => void doExport()}
            disabled={busy !== null}
          >
            {busy === "export" ? <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={3} /> : <Download size={14} aria-hidden strokeWidth={2.5} />}
            {t("logs_export_btn")}
          </button>
          <button
            className="btn rounded-none border-2 border-alert bg-alert/20 text-alert hover:bg-alert hover:text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,51,102,0.3)] active:translate-y-0.5 active:shadow-none px-3.5 py-1.5 transition-none flex items-center gap-1.5"
            onClick={() => setConfirmClear(true)}
            disabled={busy !== null}
          >
            <Trash2 size={14} aria-hidden strokeWidth={2.5} />
            {t("logs_clear_btn")}
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden p-6 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] space-y-4 font-mono" aria-label="Log görüntüleyici">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("logs_search_placeholder")}
              aria-label={t("logs_search_placeholder")}
              className="w-full rounded-none border-2 border-white/20 bg-black pl-9 pr-3 py-1.5 font-mono text-xs text-white focus:border-live shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] focus:outline-none"
            />
          </div>
          <div className="flex rounded-none border-2 border-white/20 bg-black p-0.5">
            {levels.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`rounded-none px-3 py-1 font-mono text-xs uppercase font-bold transition-none ${
                  level === lv
                    ? lv === "error"
                      ? "bg-alert text-black"
                      : lv === "success"
                        ? "bg-live text-black"
                        : "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t(`logs_level_${lv}`)}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-white/40">
            {filtered.length} / {allLogs.length}
          </span>
        </div>

        <div
          ref={boxRef}
          role="log"
          aria-live="polite"
          className="h-[32rem] overflow-y-auto rounded-none border-2 border-white/10 bg-black p-4 font-mono text-xs leading-relaxed divide-y divide-white/5"
        >
          {filtered.length === 0 ? (
            <span className="text-white/40 uppercase">{t("log_empty")}</span>
          ) : (
            filtered.map((l, i) => (
              <div
                key={i}
                className={`py-1 ${
                  l.includes("[!]")
                    ? "font-bold text-alert"
                    : l.includes("[+]")
                      ? "font-bold text-live"
                      : l.includes("[*]")
                        ? "text-cyan"
                        : "text-white/70"
                }`}
              >
                {l}
              </div>
            ))
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title={t("logs_clear_confirm_title")}
        body={t("logs_clear_confirm_body")}
        confirmLabel={t("logs_clear_btn")}
        danger
        busy={busy === "clear"}
        onConfirm={() => void doClear()}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
