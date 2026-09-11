import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Globe,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Upload,
  CloudDownload,
  Check,
  X,
} from "lucide-react";
import { api } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

const PRESET_GROUPS = [
  {
    id: "tr-core",
    label: "Türkiye Mega Paketi",
    domains: [
      "discord.com", "gateway.discord.gg", "cdn.discordapp.com", "discordapp.net", "discordapp.com",
      "roblox.com", "rbxcdn.com", "roblox.qq.com",
      "eksisozluk.com", "eksisozluk1923.com", "eksisozluk2023.com", "eksisozluk111.com",
      "wattpad.com", "pastebin.com", "imgur.com", "archive.org", "archive.is",
      "kick.com", "twitch.tv", "patreon.com",
      "instagram.com", "cdninstagram.com", "x.com", "twitter.com", "twimg.com",
      "threads.net", "reddit.com"
    ],
  },
  {
    id: "discord-roblox",
    label: "Discord & Roblox Tam Altyapı",
    domains: [
      "discord.com", "discord.gg", "discord.media", "discordapp.com", "discordapp.net",
      "discordstatus.com", "gateway.discord.gg", "cdn.discordapp.com", "media.discordapp.net",
      "roblox.com", "rbxcdn.com", "roblox.qq.com", "setup.rbxcdn.com"
    ],
  },
  {
    id: "vpn-privacy",
    label: "Gizlilik, VPN & Tor Ağları",
    domains: [
      "proton.me", "protonvpn.com", "mullvad.net", "torproject.org",
      "windscribe.com", "nordvpn.com", "surfshark.com", "expressvpn.com", "psiphon.ca"
    ],
  },
  {
    id: "sohbet",
    label: "Sohbet & İletişim",
    domains: ["telegram.org", "t.me", "wa.me", "whatsapp.com", "signal.org", "element.io"],
  },
  {
    id: "oyun",
    label: "Oyun & Bulut Servisleri",
    domains: ["steamcommunity.com", "steampowered.com", "geforcenow.com", "nvidiagrid.net", "epicgames.com"],
  },
  {
    id: "ai",
    label: "Yapay Zeka & Geliştirici",
    domains: ["openai.com", "anthropic.com", "claude.ai", "gemini.google.com", "huggingface.co", "github.com"],
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
  const [fetchBusy, setFetchBusy] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refresh = () =>
    void api.getBlacklist().then((s) => {
      setSites(s);
      setLoaded(true);
    });

  useEffect(() => {
    let isMounted = true;
    void api.getBlacklist().then((s) => {
      if (isMounted) {
        setSites(s);
        setLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const syncCommunityList = async () => {
    setFetchBusy(true);
    setFetchMsg(null);
    setFetchError(null);
    try {
      pushLog("[*] Topluluk engelli hedef listesi senkronize ediliyor...");
      const count = await api.fetchCommunityBlacklist();
      setFetchMsg(`+${count} yeni alan adı başarıyla eklendi ve senkronize edildi!`);
      pushLog(`[+] Topluluk listesinden ${count} yeni alan adı eklendi`);
      refresh();
      setTimeout(() => setFetchMsg(null), 6000);
    } catch (err) {
      const msg = String(err);
      setFetchError(`Hata: ${msg}`);
      pushLog(`[!] Topluluk listesi hatası: ${msg}`);
      setTimeout(() => setFetchError(null), 8000);
    } finally {
      setFetchBusy(false);
    }
  };

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
    const d = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainRegex.test(d)) {
      setError("Geçersiz alan adı formatı (örn: discord.com)");
      return;
    }
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
    try {
      const count = await api.addSites(domains);
      pushLog(`[+] ${count} domain listeye eklendi`);
      refresh();
    } catch (e) {
      pushLog(`[!] Ekleme hatası: ${String(e)}`);
    }
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
    let failCount = 0;
    try {
      for (const d of selected) {
        try {
          await api.removeSite(d);
        } catch {
          failCount += 1;
        }
      }
      const successCount = selected.size - failCount;
      if (successCount > 0) {
        pushLog(`[-] ${successCount} hedef silindi`);
      }
      if (failCount > 0) {
        pushLog(`[!] ${failCount} hedef silinirken hata oluştu`);
      }
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
    const candidates = text
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter((d) => d && d.includes(".") && !d.startsWith("#"));
    try {
      const added = await api.addSites(candidates);
      pushLog(`[+] ${added} yeni domain içe aktarıldı`);
      refresh();
    } catch (e) {
      pushLog(`[!] İçe aktarma hatası: ${String(e)}`);
    }
  };

  const missingPresets = PRESET_GROUPS.map((g) => ({
    ...g,
    domains: g.domains.filter((d) => !sites.includes(d)),
  })).filter((g) => g.domains.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Başlık */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("sites_title")}</h2>
          <p className="mt-0.5 text-xs text-paper-muted">{t("sites_desc")}</p>
        </div>
        <div className="badge badge-muted self-start sm:self-auto font-mono text-xs">
          {sites.length} {t("sites_count")}
        </div>
      </header>

      {/* Bilgi Kartı */}
      <div className="card p-4 bg-surface-subtle/60 border border-white/[0.08]">
        <h3 className="text-sm font-bold text-paper-bright mb-1">{t("sites_whitelist_title")}</h3>
        <p className="text-xs text-paper-muted leading-relaxed">
          {t("sites_whitelist_desc")} 
          <span className="text-live font-semibold ml-1">{t("sites_zero_loss_note")}</span>
        </p>
      </div>

      {/* Topluluk ve Canlı Kara Liste Senkronizasyonu */}
      <div className="card p-4 bg-surface-subtle/70 border border-live/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
            <h3 className="text-xs font-bold text-paper-bright">
              {t("sites_community_list_title")}
            </h3>
          </div>
          <p className="text-[11px] text-paper-muted">
            {t("sites_community_list_desc")}
          </p>
          {fetchMsg && (
            <p className="text-xs font-bold text-live flex items-center gap-1.5 pt-1">
              <Check size={13} />
              <span>{fetchMsg}</span>
            </p>
          )}
          {fetchError && (
            <p className="text-xs font-bold text-alert flex items-center gap-1.5 pt-1">
              <AlertTriangle size={13} />
              <span>{fetchError}</span>
            </p>
          )}
        </div>
        <button
          onClick={syncCommunityList}
          disabled={fetchBusy}
          className="btn btn-secondary !py-2 !px-4 text-xs font-bold text-live border-live/30 hover:bg-live/15 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          {fetchBusy ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <CloudDownload size={14} />
          )}
          <span>{fetchBusy ? t("sites_community_list_downloading") : t("sites_community_list_btn")}</span>
        </button>
      </div>

      {/* Domain Ekleme Formu */}
      <section className="card p-4 border border-white/[0.08] space-y-3">
        <form
          className="flex flex-col sm:flex-row gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            void add(draft);
          }}
        >
          <div className="relative flex-1">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-faint" aria-hidden />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Domain ekle... (örn: discord.com)"
              aria-label="Eklenecek domain"
              className="input pl-10 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={!draft.includes(".") || resolving}
            className="btn btn-primary text-xs"
          >
            {resolving ? <LoaderCircle size={15} className="animate-spin" aria-hidden /> : <Plus size={15} aria-hidden />}
            <span>{t("sites_add_btn")}</span>
          </button>
        </form>

        {error && (
          <p role="alert" className="text-xs font-semibold text-alert bg-alert/10 p-3 rounded-lg border border-alert/25">
            {error}
          </p>
        )}

        {unresolved && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
            <AlertTriangle size={15} className="shrink-0" aria-hidden />
            <span className="flex-1 font-medium">Çözümlenemedi: {unresolved}</span>
            <button
              onClick={() => void addUnchecked(unresolved)}
              className="btn btn-secondary !py-1 text-xs text-warn border-warn/30 hover:bg-warn/20"
            >
              {t("sites_add_anyway")}
            </button>
            <button
              onClick={() => setUnresolved(null)}
              className="text-paper-muted hover:text-paper text-xs ml-2"
            >
              {t("sites_search_clear")}
            </button>
          </div>
        )}
      </section>

      {/* Hazır Mega Paketler */}
      {missingPresets.length > 0 && (
        <section className="card p-5 border border-white/[0.08] space-y-4">
          <p className="text-sm font-bold text-paper-bright flex items-center gap-1.5">
            <span>{t("sites_presets_title")}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {missingPresets.map((g) => (
              <div
                key={g.label}
                className="card-subtle p-3.5 border border-white/[0.06] hover:border-white/[0.14] transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-paper-bright">{g.label}</span>
                  <button
                    onClick={() => void addBatch(g.domains)}
                    className="btn btn-secondary !py-1 !px-2.5 text-[11px] text-live border-live/25 hover:bg-live/10"
                  >
                    <Plus size={12} /> {t("sites_preset_pack_add")} ({g.domains.length})
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.domains.slice(0, 6).map((d) => (
                    <button
                      key={d}
                      onClick={() => void add(d)}
                      className="rounded-md border border-white/[0.08] bg-white/[0.03] text-paper-muted hover:text-paper hover:border-live/40 px-2 py-0.5 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus size={10} aria-hidden /> {d}
                    </button>
                  ))}
                  {g.domains.length > 6 && (
                    <span className="text-[11px] text-paper-faint self-center">
                      +{g.domains.length - 6} {t("sites_preset_other")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Liste ve Arama */}
      <section className="card p-5 border border-white/[0.08] space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("sites_search_placeholder")}
            aria-label={t("sites_search_placeholder")}
            className="input pl-9 pr-9 text-xs"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-paper-muted hover:text-alert cursor-pointer p-0.5 rounded"
              aria-label="Aramayı temizle"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Kategori Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: t("sites_filter_all") },
            { id: "tr-core", label: t("sites_filter_tr_mega") },
            { id: "discord-roblox", label: t("sites_filter_discord") },
            { id: "vpn-privacy", label: t("sites_filter_vpn") },
            { id: "sohbet", label: t("sites_filter_chat") },
            { id: "oyun", label: t("sites_filter_game") },
            { id: "ai", label: t("sites_filter_ai") },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-live text-surface shadow-brutal-live"
                  : "bg-surface-subtle text-paper-muted border border-border-brutal hover:text-paper hover:bg-white/[0.08]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!loaded ? (
          <div className="p-8 text-center text-paper-muted text-xs font-semibold">{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.1] text-paper-muted">
            <Globe size={36} className="mx-auto mb-2 text-paper-faint" aria-hidden />
            <p className="text-xs font-semibold">
              {query ? t("sites_no_match_query") : t("sites_empty_list")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs font-semibold text-paper-muted hover:text-paper transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 accent-live rounded"
                />
                <span>{t("sites_select_all")}</span>
              </label>
              {selected.size > 0 && (
                <button
                  onClick={() => void removeSelected()}
                  disabled={bulkBusy}
                  className="btn btn-danger !py-1 text-xs flex items-center gap-1.5"
                >
                  {bulkBusy ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{t("sites_delete_count")} ({selected.size})</span>
                </button>
              )}
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {filtered.map((d) => (
                <li
                  key={d}
                  className="group flex items-center justify-between p-2 rounded-lg border border-white/[0.04] bg-surface-subtle/30 hover:bg-surface-subtle/80 hover:border-white/[0.12] transition-all"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer w-full overflow-hidden">
                    <input
                      type="checkbox"
                      checked={selected.has(d)}
                      onChange={() => toggleSelected(d)}
                      className="w-3.5 h-3.5 accent-live rounded"
                    />
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <Globe size={13} className="text-paper-faint shrink-0" aria-hidden />
                      <span className="font-mono text-[11.5px] text-paper font-medium truncate">{d}</span>
                    </div>
                  </label>
                  <button
                    onClick={() => void api.removeSite(d).then(refresh)}
                    className="text-paper-faint hover:text-alert p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/[0.05] transition-all cursor-pointer shrink-0"
                    title={t("sites_delete_count")}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Dışa / İçe Aktar Butonları */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          className="btn btn-secondary flex-1 text-xs"
          onClick={() => void exportList()}
          disabled={!sites.length}
        >
          <Download size={15} />
          <span>{t("sites_export")}</span>
        </button>
        <label className="btn btn-secondary flex-1 text-xs cursor-pointer">
          <Upload size={15} />
          <span>{t("sites_import")}</span>
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
