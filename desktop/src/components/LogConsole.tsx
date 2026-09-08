import { TerminalSquare, Copy, Check, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";

interface Props {
  logs: string[];
  className?: string;
  height?: string;
}

export default function LogConsole({ logs, className, height }: Props) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "error" | "success" | "info">("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filter === "error" && !l.includes("[!]")) return false;
      if (filter === "success" && !l.includes("[+]")) return false;
      if (filter === "info" && !l.includes("[i]") && !l.includes("[*]")) return false;
      if (search && !l.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, filter, search]);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filteredLogs]);

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section aria-label="Canlı log" className={`card p-4 space-y-3 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-paper-bright">
          <TerminalSquare size={15} className="text-live" aria-hidden />
          <span>{t("log_title")}</span>
          <span className="font-mono text-xs text-paper-faint">({logs.length})</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Arama Inputu */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-paper-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrele..."
              className="input pl-7 pr-2.5 py-1 text-xs !w-28 sm:!w-36 font-mono"
            />
          </div>

          {/* Seviye Butonları */}
          <div className="flex rounded-lg bg-surface-subtle p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                filter === "all" ? "bg-white/[0.12] text-paper-bright shadow-sm" : "text-paper-muted hover:text-paper"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("error")}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                filter === "error" ? "bg-alert/20 text-alert shadow-sm" : "text-paper-muted hover:text-alert"
              }`}
            >
              Hata
            </button>
            <button
              onClick={() => setFilter("success")}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                filter === "success" ? "bg-live/20 text-live shadow-sm" : "text-paper-muted hover:text-live"
              }`}
            >
              Başarı
            </button>
          </div>

          {/* Kopyala Butonu */}
          <button
            onClick={copyLogs}
            className="p-1.5 rounded-lg text-paper-muted hover:text-paper hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Logları Panoya Kopyala"
          >
            {copied ? <Check size={14} className="text-live" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        role="log"
        aria-live="polite"
        style={{ height: height ?? "calc(100% - 2.5rem)" }}
        className="overflow-y-auto rounded-xl bg-void/80 border border-white/[0.06] p-3 font-mono text-xs leading-relaxed space-y-0.5 divide-y divide-white/[0.03]"
      >
        {filteredLogs.length === 0 && (
          <span className="text-paper-faint text-xs">{t("log_empty")}</span>
        )}
        {filteredLogs.map((l, i) => (
          <div
            key={i}
            className={`py-0.5 ${
              l.includes("[!]")
                ? "text-alert font-semibold"
                : l.includes("[+]")
                  ? "text-live font-medium"
                  : l.includes("[*]")
                    ? "text-cyan"
                    : "text-paper-muted"
            }`}
          >
            {l}
          </div>
        ))}
      </div>
    </section>
  );
}
