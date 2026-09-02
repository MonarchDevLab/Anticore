import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckSquare, Download, Globe, LoaderCircle, Plus, Search, Square, Trash2, Upload } from "lucide-react";
import { api } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

const PRESET_GROUPS = [
  {
    id: "tr-bypass",
    label: "TÜRKİYE MEGA-PAKETİ",
    domains: [
      "discord.com", "gateway.discord.gg", "cdn.discordapp.com", "discordapp.net", "discordapp.com",
      "roblox.com", "rbxcdn.com", "roblox.qq.com",
      "pastebin.com", "imgur.com", "reddit.com", "wattpad.com",
      "instagram.com", "cdninstagram.com", "x.com", "twitter.com", "twimg.com",
      "kick.com", "twitch.tv"
    ],
  },
  {
    id: "sohbet",
    label: "SOHBET / CHAT",
    domains: ["telegram.org", "wa.me", "signal.org"],
  },
  {
    id: "sosyal",
    label: "SOSYAL / SOCIAL",
    domains: ["tiktok.com", "facebook.com"],
  },
  {
    id: "oyun",
    label: "OYUN / GAMING",
    domains: ["steamcommunity.com", "steampowered.com", "geforcenow.com", "nvidiagrid.net"],
  },
  {
    id: "ai",
    label: "PLATFORM & AI",
    domains: ["openai.com", "anthropic.com", "gemini.google.com", "huggingface.co"],
  },
];

export default function Sites({ pushLog }: { pushLog: (l: string) => void }) {
  const { t } = useI18n();
  const [sites, setSites] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [unresolved, setUnresolved] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const refresh = () =>
    void api.getBlacklist().then((s) => {
      setSites(s);
      setLoaded(true);
    });
  useEffect(refresh, []);

  const addUnchecked = async (domain: string) => {
    setError(null);
    try {
      await api.addSite(domain);
      setDraft("");
      setUnresolved(null);
      refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const add = async (domain: string) => {
    const d = domain.trim().toLowerCase();
    if (!d.includes(".")) return;
    setError(null);
    setResolving(true);
    try {
      const ok = await api.resolveDomain(d);
      if (!ok) {
        setUnresolved(d);
        return;
      }
      await addUnchecked(d);
    } catch (e) {
      setError(String(e));
    } finally {
      setResolving(false);
    }
  };

  const addBatch = async (domains: string[]) => {
    setError(null);
    for (const d of domains) {
      try {
        await api.addSite(d);
      } catch {}
    }
    pushLog(`[+] ${domains.length} domain eklendi`);
    refresh();
  };

  const filtered = useMemo(() => {
    let list = sites.filter((s) => s.includes(query.trim().toLowerCase()));
    if (activeCategory !== "all") {
      const grp = PRESET_GROUPS.find((g) => g.id === activeCategory);
      if (grp) {
        list = list.filter((s) => grp.domains.includes(s));
      }
    }
    return list;
  }, [sites, query, activeCategory]);

  const toggleSelected = (d: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selected.has(d));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((d) => next.delete(d));
        return next;
      }
      return new Set([...prev, ...filtered]);
    });
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      for (const d of selected) {
        await api.removeSite(d).catch(() => {});
      }
      pushLog(`[-] ${selected.size} hedef silindi`);
      setSelected(new Set());
      refresh();
    } finally {
      setBulkBusy(false);
    }
  };

  const exportList = async () => {
    try {
      const saved = await api.exportSitesToFile();
      if (saved) pushLog("[+] Liste dışa aktarıldı");
    } catch (e) {
      pushLog(`[!] Dışa aktarma hatası: ${String(e)}`);
    }
  };

  const importList = async (file: File) => {
    const text = await file.text();
    let added = 0;
    for (const line of text.split(/\r?\n/)) {
      const d = line.trim().toLowerCase();
      if (d && d.includes(".") && !d.startsWith("#")) {
        try {
          await api.addSite(d);
          added += 1;
        } catch {}
      }
    }
    pushLog(`[+] ${added} domain içe aktarıldı`);
    refresh();
  };

  const missingPresets = PRESET_GROUPS.map((g) => ({
    ...g,
    domains: g.domains.filter((d) => !sites.includes(d)),
  })).filter((g) => g.domains.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 font-mono pb-8">
      <header className="flex items-end justify-between border-b-[3px] border-white/20 pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-paper">{t("sites_title")}</h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-widest text-live">{t("sites_desc")}</p>
        </div>
        <div className="bg-black border-[3px] border-white/20 shadow-[4px_4px_0px_rgba(255,255,255,0.1)] px-4 py-2 font-black uppercase">
          {sites.length} {t("sites_count")}
        </div>
      </header>

      <div className="bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.1)] p-6 space-y-4">
        <h3 className="text-xl font-black uppercase tracking-widest text-paper mb-2">{t("sites_whitelist_title")}</h3>
        <p className="text-sm font-bold text-fog uppercase leading-relaxed">
          {t("sites_whitelist_desc")} 
          <span className="text-live ml-1">{t("sites_zero_loss_note")}</span>
        </p>
      </div>

      <section className="bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.1)] p-6 space-y-4">
        <form
          className="flex gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void add(draft);
          }}
        >
          <div className="relative flex-1">
            <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fog" aria-hidden />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="DOMAIN EKLE... (örn: discord.com)"
              aria-label="Eklenecek domain"
              className="w-full bg-black border-[3px] border-white/20 p-3 pl-12 font-bold uppercase placeholder:text-fog focus:outline-none focus:border-live transition-colors"
            />
          </div>
          <button type="submit" disabled={!draft.includes(".") || resolving} className="bg-live text-black border-[3px] border-live hover:bg-black hover:text-live shadow-[4px_4px_0px_var(--color-neon-live)] transition-none px-6 py-3 font-black uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {resolving ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <Plus size={18} aria-hidden />}
            {t("sites_add_btn")}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-sm font-bold uppercase text-alert bg-alert/10 p-3 border-[3px] border-alert/30">
            {error}
          </p>
        )}

        {unresolved && (
          <div className="flex items-center gap-3 border-[3px] border-warn/50 bg-warn/10 p-3 text-sm font-bold uppercase text-warn">
            <AlertTriangle size={18} className="shrink-0" aria-hidden />
            <span className="flex-1">ÇÖZÜMLENEMEDİ: {unresolved}</span>
            <button onClick={() => void addUnchecked(unresolved)} className="border-[2px] border-warn px-3 py-1 hover:bg-warn hover:text-black transition-none">
              {t("sites_add_anyway")}
            </button>
            <button onClick={() => setUnresolved(null)} className="text-fog hover:text-white transition-colors">
              {t("sites_search_clear")}
            </button>
          </div>
        )}
      </section>

      {missingPresets.length > 0 && (
        <section className="bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.1)] p-6 space-y-4">
          <p className="text-xl font-black uppercase tracking-widest text-live">HAZIR MEGA PAKETLER</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingPresets.map((g) => (
              <div key={g.label} className="p-4 border-[3px] border-white/10 hover:border-white/30 transition-colors flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-black text-paper uppercase">{g.label}</span>
                  <button
                    onClick={() => void addBatch(g.domains)}
                    className="border-2 border-live text-live hover:bg-live hover:text-black px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 transition-none"
                  >
                    <Plus size={14} /> PAKETİ EKLE ({g.domains.length})
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.domains.map((d) => (
                    <button
                      key={d}
                      onClick={() => void add(d)}
                      className="border border-white/20 text-fog hover:text-white hover:border-live px-2 py-1 text-xs uppercase font-bold flex items-center gap-1 transition-none"
                    >
                      <Plus size={10} aria-hidden /> {d}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.1)] p-6 space-y-4">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fog" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="LİSTEDE ARA..."
            aria-label="Listede ara"
            className="w-full bg-black border-[3px] border-white/20 p-3 pl-12 pr-12 font-bold uppercase placeholder:text-fog focus:outline-none focus:border-white/50 transition-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-fog hover:text-alert transition-none"
            >
              X
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "all", label: "TÜMÜ" },
            { id: "tr-bypass", label: "TR YASAKLILAR" },
            { id: "sohbet", label: "SOHBET" },
            { id: "sosyal", label: "SOSYAL" },
            { id: "oyun", label: "OYUN" },
            { id: "ai", label: "PLATFORM" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`border-2 px-4 py-2 text-xs font-black uppercase transition-none ${
                activeCategory === cat.id
                  ? "border-live text-live shadow-[2px_2px_0px_#fff]"
                  : "border-white/20 text-fog hover:border-white/50 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!loaded ? (
          <div className="p-8 text-center text-fog font-bold uppercase">YÜKLENİYOR...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center border-[3px] border-white/10 border-dashed">
            <Globe size={48} className="mx-auto mb-4 text-white/20" aria-hidden />
            <p className="text-lg font-black text-paper uppercase">
              {query ? "EŞLEŞEN DOMAİN YOK" : "LİSTE BOŞ"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 pb-4 border-b-[3px] border-white/10">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-black uppercase text-fog hover:text-white transition-none"
              >
                {allFilteredSelected ? <CheckSquare size={18} className="text-live" /> : <Square size={18} />}
                TÜMÜNÜ SEÇ
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => void removeSelected()}
                  disabled={bulkBusy}
                  className="bg-alert text-black border-2 border-alert hover:bg-black hover:text-alert px-4 py-2 text-xs font-black uppercase flex items-center gap-2 transition-none disabled:opacity-50"
                >
                  {bulkBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  SİL ({selected.size})
                </button>
              )}
            </div>
            <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filtered.map((d) => (
                <li key={d} className="flex items-center justify-between p-3 border-2 border-white/10 hover:border-white/30 bg-black transition-none">
                  <label className="flex items-center gap-4 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={selected.has(d)}
                      onChange={() => toggleSelected(d)}
                      className="w-5 h-5 accent-live bg-black border-2 border-white/20"
                    />
                    <span className="font-bold text-paper uppercase truncate">{d}</span>
                  </label>
                  <button
                    onClick={() => void api.removeSite(d).then(refresh)}
                    className="text-fog hover:text-alert p-2 transition-none"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="flex gap-4 pt-4">
        <button className="flex-1 border-[3px] border-white/20 hover:border-white/50 text-paper px-6 py-3 font-black uppercase flex items-center justify-center gap-2 transition-none disabled:opacity-50" onClick={() => void exportList()} disabled={!sites.length}>
          <Download size={18} /> LİSTEYİ DIŞA AKTAR
        </button>
        <label className="flex-1 border-[3px] border-white/20 hover:border-live hover:text-live text-paper px-6 py-3 font-black uppercase flex items-center justify-center gap-2 cursor-pointer transition-none">
          <Upload size={18} /> LİSTE İÇE AKTAR
          <input
            type="file"
            accept=".txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && void importList(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
