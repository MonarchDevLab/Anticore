import { useEffect, useMemo, useRef, useState } from "react";
import { Download, LoaderCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { api } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import ConfirmDialog from "../components/ConfirmDialog";

interface Props {
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("nav_logs")}</h2>
          <p className="mt-0.5 text-xs text-paper-muted">{t("logs_view_desc")}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            className="btn btn-secondary text-xs !py-1.5"
            onClick={loadHistory}
            disabled={loading}
          >
            {loading ? <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={2.5} /> : <RefreshCw size={14} aria-hidden strokeWidth={2} />}
            <span>{t("btn_refresh")}</span>
          </button>
          <button
            className="btn btn-secondary text-xs !py-1.5"
            onClick={() => void doExport()}
            disabled={busy !== null}
          >
            {busy === "export" ? <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={2.5} /> : <Download size={14} aria-hidden strokeWidth={2} />}
            <span>{t("logs_export_btn")}</span>
          </button>
          <button
            className="btn btn-danger text-xs !py-1.5"
            onClick={() => setConfirmClear(true)}
            disabled={busy !== null}
          >
            <Trash2 size={14} aria-hidden strokeWidth={2} />
            <span>{t("logs_clear_btn")}</span>
          </button>
        </div>
      </header>

      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl" aria-label="Log görüntüleyici">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-faint" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("logs_search_placeholder")}
              aria-label={t("logs_search_placeholder")}
              className="input pl-9 text-xs"
            />
          </div>
          <div className="flex rounded-xl bg-surface-subtle p-1 border border-white/[0.06] shrink-0">
            {levels.map((lv) => {
              const active = level === lv;
              return (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? lv === "error"
                        ? "bg-alert/20 text-alert shadow-sm"
                        : lv === "success"
                        ? "bg-live/20 text-live shadow-sm"
                        : "bg-white/[0.12] text-paper-bright shadow-sm"
                      : "text-paper-muted hover:text-paper"
                  }`}
                >
                  {t(`logs_level_${lv}`)}
                </button>
              );
            })}
          </div>
          <span className="font-mono text-xs text-paper-faint self-center">
            {filtered.length} / {allLogs.length}
          </span>
        </div>

        <div
          ref={boxRef}
          role="log"
          aria-live="polite"
          className="h-[32rem] overflow-y-auto rounded-xl border border-white/[0.06] bg-void/80 p-4 font-mono text-xs leading-relaxed space-y-0.5 divide-y divide-white/[0.03]"
        >
          {filtered.length === 0 ? (
            <span className="text-paper-faint text-xs">{t("log_empty")}</span>
          ) : (
            filtered.map((l, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  l.includes("[!]")
                    ? "font-semibold text-alert"
                    : l.includes("[+]")
                    ? "font-semibold text-live"
                    : l.includes("[*]")
                    ? "text-cyan"
                    : "text-paper-muted"
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
