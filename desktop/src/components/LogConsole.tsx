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
    <section aria-label="Canlı log" className={`card p-4 space-y-2.5 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-fog">
          <TerminalSquare size={14} aria-hidden />
          <span>{t("log_title")}</span>
          <span className="font-mono text-xs text-fog/70">({logs.length})</span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Arama Inputu */}
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-fog/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrele..."
              className="rounded-none bg-black border-2 border-white/20 pl-7 pr-2 py-1 text-xs font-mono text-paper placeholder:text-fog/50 w-28 sm:w-36 focus:outline-none focus:border-live"
            />
          </div>

          {/* Seviye Butonları */}
          <div className="flex rounded-none bg-black p-0.5 border-2 border-white/20">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 text-xs font-mono rounded-none uppercase transition-none ${
                filter === "all" ? "bg-white text-black font-bold" : "text-fog hover:text-paper"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("error")}
              className={`px-2 py-0.5 text-xs font-mono rounded-none uppercase transition-none ${
                filter === "error" ? "bg-alert text-black font-bold" : "text-fog hover:text-alert"
              }`}
            >
              Hata
            </button>
            <button
              onClick={() => setFilter("success")}
              className={`px-2 py-0.5 text-xs font-mono rounded-none uppercase transition-none ${
                filter === "success" ? "bg-live text-black font-bold" : "text-fog hover:text-live"
              }`}
            >
              Başarı
            </button>
          </div>

          {/* Kopyala Butonu */}
          <button
            onClick={copyLogs}
            className="btn btn-ghost !p-1.5 !text-xs"
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
        style={{ height: height ?? "calc(100% - 2rem)" }}
        className="overflow-y-auto rounded-none bg-black border-2 border-white/10 p-3 font-mono text-xs leading-relaxed divide-y divide-white/[0.05]"
      >
        {filteredLogs.length === 0 && (
          <span className="text-fog/60">{t("log_empty")}</span>
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
                    ? "text-sky"
                    : "text-fog"
            }`}
          >
            {l}
          </div>
        ))}
      </div>
    </section>
  );
}
