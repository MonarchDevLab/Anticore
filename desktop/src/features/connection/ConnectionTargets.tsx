import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Globe2, LoaderCircle, RefreshCw, Shuffle } from "lucide-react";
import { api, type ProbeDto } from "../../lib/tauri";
import type { ConnectionCopy } from "./copy";

function extractServiceBrand(host: string): string {
  const clean = host.trim().toLowerCase();
  const domain = clean.split(":")[0];

  // Specific service family aliases:
  if (/(?:discord(?:app)?|dis)\.(?:com|gg|net|media)/i.test(domain)) return "discord.com";
  if (/(?:roblox|rbxcdn)\.(?:com|cn)/i.test(domain)) return "roblox.com";
  if (/(?:wattpad|wp-assets)\./i.test(domain)) return "wattpad.com";
  if (/eksisozluk[0-9]*\.(?:com|org)/i.test(domain)) return "eksisozluk.com";
  if (/imgur\.(?:com|io)/i.test(domain)) return "imgur.com";
  if (/proton(?:mail|vpn)?\.(?:me|com)/i.test(domain)) return "proton.me";
  if (/mullvad\.(?:net|com)/i.test(domain)) return "mullvad.net";
  if (/steam(?:community|powered)\.com/i.test(domain)) return "steamcommunity.com";
  if (/(?:archive|wayback)\.org/i.test(domain)) return "archive.org";

  const parts = domain.split(".");
  if (parts.length <= 2) return domain;

  const last2 = parts.slice(-2).join(".");
  if (["com.tr", "org.tr", "net.tr", "edu.tr", "gov.tr", "co.uk", "com.br"].includes(last2) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return last2;
}

export function getDistinctTargets(hosts: string[]): string[] {
  const groups = new Map<string, string[]>();

  for (const raw of hosts) {
    const host = raw.trim();
    if (!host || host.startsWith("#")) continue;
    const brand = extractServiceBrand(host);
    const list = groups.get(brand) || [];
    list.push(host);
    groups.set(brand, list);
  }

  const result: string[] = [];
  for (const [brand, list] of groups.entries()) {
    // Prefer exact root brand match (e.g. "roblox.com", "discord.com") if present in list
    const exact = list.find((h) => h.toLowerCase() === brand.toLowerCase());
    if (exact) {
      result.push(exact);
    } else {
      // Otherwise pick the shortest hostname (least subdomains, e.g. "rbxcdn.com" over "setup.rbxcdn.com")
      const shortest = [...list].sort((a, b) => a.length - b.length)[0];
      result.push(shortest);
    }
  }

  return result;
}

export default function ConnectionTargets({ hosts, session, copy, onManage }: { hosts: string[]; session: string; copy: ConnectionCopy; onManage: () => void }) {
  const [results, setResults] = useState<Record<string, ProbeDto>>({});
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const generation = useRef(0);
  const lock = useRef(false);

  const distinctHosts = useMemo(() => getDistinctTargets(hosts), [hosts]);
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(distinctHosts.length / pageSize));

  useEffect(() => {
    generation.current++;
    setResults({});
    setBusy(false);
    lock.current = false;
    return () => { generation.current++; };
  }, [session]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(0);
    }
  }, [totalPages, page]);

  const activePage = page % totalPages;
  const visibleHosts = useMemo(() => {
    const start = activePage * pageSize;
    return distinctHosts.slice(start, start + pageSize);
  }, [distinctHosts, activePage, pageSize]);

  const run = async () => {
    if (lock.current || !visibleHosts.length) return;
    lock.current = true;
    setBusy(true);
    const id = generation.current;

    const checked = await Promise.all(
      visibleHosts.map(async (host) => {
        try {
          return await api.probeTarget(host);
        } catch {
          return { host, result: "error", latency_ms: null };
        }
      })
    );

    if (id === generation.current) {
      setResults((prev) => {
        const next = { ...prev };
        for (const item of checked) {
          next[item.host] = item;
        }
        return next;
      });
      setBusy(false);
      lock.current = false;
    }
  };

  const handleCycle = () => {
    if (totalPages <= 1) return;
    setPage((prev) => (prev + 1) % totalPages);
  };

  const label = (result?: string) =>
    result === "open"
      ? copy.reachable
      : result === "blocked"
      ? copy.blocked
      : result === "filtered"
      ? copy.filtered
      : result
      ? copy.error
      : copy.unchecked;

  const startNum = distinctHosts.length ? activePage * pageSize + 1 : 0;
  const endNum = Math.min(activePage * pageSize + visibleHosts.length, distinctHosts.length);

  return (
    <section className="workspace-panel target-panel">
      <div className="panel-heading">
        <div>
          <h2>{copy.targets}</h2>
          <p>
            {distinctHosts.length > pageSize
              ? `${copy.targetHint} (${startNum}-${endNum} / ${distinctHosts.length})`
              : copy.targetHint}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          {totalPages > 1 && (
            <button
              className="workspace-icon-button"
              onClick={handleCycle}
              title={copy.cycleTargets}
              aria-label={copy.cycleTargets}
            >
              <Shuffle size={16} />
            </button>
          )}
          <button className="workspace-icon-button" onClick={onManage} aria-label={copy.manageTargets}>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
      <div className="target-list" aria-live="polite">
        {!visibleHosts.length && <p className="workspace-empty">{copy.emptyTargets}</p>}
        {visibleHosts.map((host) => {
          const result = results[host];
          const res = result?.result;
          const rowClass = !res ? "" : res === "open" ? "is-open" : res === "blocked" ? "is-blocked" : res === "filtered" ? "is-filtered" : "is-error";
          const textClass = !res ? "" : res === "open" ? "result-open" : res === "blocked" ? "result-blocked" : res === "filtered" ? "result-filtered" : "result-error";
          return (
            <div className={`target-row ${rowClass}`} key={host}>
              <span className="target-symbol"><Globe2 size={17} /></span>
              <div>
                <strong>{host}</strong>
                <span className={busy ? "" : textClass}>{busy ? copy.checking : label(res)}</span>
              </div>
              <span className="target-latency">{result?.latency_ms != null ? `${result.latency_ms} ms` : "—"}</span>
            </div>
          );
        })}
      </div>
      <button
        className="workspace-button secondary full-width"
        disabled={busy || !visibleHosts.length}
        onClick={() => void run()}
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        {busy ? copy.checking : copy.check}
      </button>
    </section>
  );
}
