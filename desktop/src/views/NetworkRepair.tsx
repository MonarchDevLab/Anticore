import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Network, RefreshCw, RotateCcw, ShieldAlert, ShieldCheck, Wifi, Wrench } from "lucide-react";
import { api, type AdapterDnsInfo, type DohStatusDto } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import ConfirmDialog from "../components/ConfirmDialog";
import Guide from "../components/Guide";

const DNS_PROVIDERS = [
  { id: "google", label: "Google", primary: "8.8.8.8" },
  { id: "cloudflare", label: "Cloudflare", primary: "1.1.1.1" },
  { id: "quad9", label: "Quad9", primary: "9.9.9.9" },
  { id: "yandex", label: "Yandex", primary: "77.88.8.8" },
] as const;
const KNOWN_SECURE_SERVERS = new Set<string>(DNS_PROVIDERS.map((p) => p.primary));

export default function NetworkRepair({ pushLog }: { pushLog: (l: string) => void }) {
  const { t, lang } = useI18n();
  const [dns, setDns] = useState<string[] | null>(null);
  const [dialog, setDialog] = useState<"apply" | "reset" | "discord-repair" | "discord-cache" | "reset-stack" | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<(typeof DNS_PROVIDERS)[number]["id"]>("google");
  const [adapters, setAdapters] = useState<AdapterDnsInfo[] | null>(null);
  const [dohStatus, setDohStatus] = useState<DohStatusDto | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshDns = () =>
    void api.getDnsServers().then((d) => setDns(d.servers));
  const refreshAdapters = () =>
    void api.getAdapterDnsInfo().then(setAdapters).catch(() => setAdapters([]));
  const refreshDoh = () =>
    void api.getDohStatus().then(setDohStatus).catch(() => {});
  useEffect(() => {
    refreshDns();
    refreshAdapters();
    refreshDoh();
    void api.checkIsAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, []);

  const handleFlushRenew = async () => {
    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.flushDnsAndRenewAdapters();
      pushLog(`[+] ${res}`);
      setSuccessMessage(res);
      refreshDns();
      refreshAdapters();
    } catch (e) {
      const err = String(e);
      pushLog(`[!] DNS & Bağdaştırıcı yenileme hatası: ${err}`);
      setErrorMessage(err);
    } finally {
      setBusy(false);
    }
  };

  const run = async (kind: "apply" | "reset" | "discord-repair" | "discord-cache" | "reset-stack") => {
    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (kind === "apply") {
        await api.applySecureDns(provider);
        const provLabel = DNS_PROVIDERS.find((p) => p.id === provider)?.label || provider;
        pushLog(`[+] Güvenli DNS uygulandı (${provLabel})`);
        setSuccessMessage(`Güvenli DNS başarıyla uygulandı (${provLabel})`);
      } else if (kind === "reset") {
        await api.resetDns();
        pushLog("[*] DNS sıfırlandı");
        setSuccessMessage("DNS ayarları varsayılana (DHCP) sıfırlandı");
      } else if (kind === "discord-repair") {
        const res = await api.repairDiscordUpdates();
        pushLog(`[+] ${res}`);
        setSuccessMessage(res);
      } else if (kind === "discord-cache") {
        const res = await api.clearDiscordCache();
        pushLog(`[+] ${res}`);
        setSuccessMessage(res);
      } else if (kind === "reset-stack") {
        const res = await api.resetNetworkStack();
        pushLog(`[+] ${res}`);
        setSuccessMessage(res);
      }
      refreshDns();
      refreshAdapters();
    } catch (e) {
      const err = String(e);
      pushLog(`[!] İşlem başarısız: ${err}`);
      setErrorMessage(err);
    } finally {
      setBusy(false);
      setDialog(null);
    }
  };

  const isCustom = dns?.some((d) => KNOWN_SECURE_SERVERS.has(d));

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="pb-3 border-b border-white/[0.08]">
        <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("net_title")}</h2>
        <p className="mt-0.5 text-xs text-paper-muted">{t("net_desc")}</p>
      </header>

      {isAdmin === false && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-amber-300">{t("net_admin_required_title")}</h3>
              <p className="text-paper-muted mt-0.5">{t("net_admin_required_desc")}</p>
            </div>
          </div>
          <button
            onClick={() => void api.restartAsAdmin()}
            className="btn btn-primary text-xs shrink-0 whitespace-nowrap bg-amber-600 hover:bg-amber-500 border-amber-500/40 text-black font-semibold cursor-pointer"
          >
            {t("net_admin_restart_btn")}
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs flex items-center justify-between gap-3 text-rose-300">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-rose-400 shrink-0" aria-hidden />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-paper-muted hover:text-paper cursor-pointer font-bold px-2 py-0.5"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-live/30 bg-live/10 p-4 text-xs flex items-center justify-between gap-3 text-live">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-live shrink-0" aria-hidden />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-paper-muted hover:text-paper cursor-pointer font-bold px-2 py-0.5"
          >
            ×
          </button>
        </div>
      )}

      <Guide
        title={lang === "tr" ? "DNS ve Güvenli Çözümleme" : "DNS and Secure Resolution"}
        items={
          lang === "tr"
            ? [
                {
                  q: "DNS değiştirme ne sağlar?",
                  a: "Bazı servis sağlayıcılar alan adı sorgularını zehirleyip yanlış IP adresine yönlendirir. Güvenli çözümleyiciler (Google 8.8.8.8, Quad9 9.9.9.9) bu müdahaleyi engeller.",
                },
                {
                  q: "Geri alabilir miyim?",
                  a: "Evet. 'Sıfırla' düğmesine basarak tüm ağ bağdaştırıcılarınızı anında varsayılan otomatik (DHCP) ayarına döndürebilirsiniz.",
                },
              ]
            : [
                {
                  q: "What does changing DNS accomplish?",
                  a: "Some ISPs poison domain name queries and redirect them to the wrong IP address. Secure resolvers (Google 8.8.8.8, Quad9 9.9.9.9) prevent this interference.",
                },
                {
                  q: "Can I undo it?",
                  a: "Yes. Pressing 'Reset' instantly returns all network adapters to the default automatic (DHCP) setting.",
                },
              ]
        }
      />

      {/* Aktif DNS */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Wifi size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("net_active_dns")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">
              {t("net_status_label")}{" "}
              {isCustom ? (
                <span className="text-live font-semibold">{t("net_secure_active")}</span>
              ) : (
                <span className="text-paper-faint">{t("net_dhcp_notice")}</span>
              )}
            </p>
          </div>
        </div>

        {dns === null ? (
          <p className="flex items-center gap-2 text-xs text-paper-muted">
            <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={2.5} />
            <span>{t("net_reading")}</span>
          </p>
        ) : dns.length === 0 ? (
          <p className="text-xs text-paper-muted">{t("net_dhcp_notice")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dns.map((d) => (
              <span key={d} className="badge badge-live font-mono text-xs px-3 py-1">
                {d}
              </span>
            ))}
          </div>
        )}

        {/* DNS Sağlayıcı Seçimi */}
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-semibold text-paper-muted">DNS Sağlayıcısı Seç</p>
          <div className="flex flex-wrap gap-2">
            {DNS_PROVIDERS.map((p) => {
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                    active
                      ? "bg-live/15 text-live border-live/35 shadow-sm"
                      : "bg-surface-subtle text-paper-muted border-white/[0.06] hover:text-paper hover:border-white/[0.12]"
                  }`}
                >
                  <span>{p.label}</span> <span className="font-mono text-[11px] opacity-70">({p.primary})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-white/[0.08]">
          <button
            className="btn btn-primary text-xs"
            onClick={() => setDialog("apply")}
            disabled={busy}
          >
            <ShieldCheck size={15} aria-hidden strokeWidth={2} />
            <span>{t("net_apply_btn")}</span>
          </button>
          <button
            className="btn btn-danger text-xs"
            onClick={() => setDialog("reset")}
            disabled={busy}
          >
            <RefreshCw size={14} aria-hidden strokeWidth={2} />
            <span>{t("net_reset_btn")}</span>
          </button>
        </div>
        <p className="text-[11px] text-paper-faint">
          {t("net_dns_hint")}
        </p>
      </section>

      {/* Windows Ağ Yığını & Winsock Onarımı */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Wrench size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("net_stack_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("net_stack_desc")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            className="btn btn-primary text-xs"
            onClick={() => void handleFlushRenew()}
            disabled={busy}
          >
            <RefreshCw size={14} aria-hidden strokeWidth={2} />
            <span>{t("net_flush_renew_btn")}</span>
          </button>
          <button
            className="btn btn-danger text-xs"
            onClick={() => setDialog("reset-stack")}
            disabled={busy}
          >
            <RotateCcw size={14} aria-hidden strokeWidth={2} />
            <span>{t("net_reset_stack_btn")}</span>
          </button>
        </div>
        <p className="text-[11px] text-paper-faint">
          {t("net_flush_renew_hint")}
        </p>
      </section>

      {/* Ağ Adaptörleri */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <Network size={18} aria-hidden strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-paper-bright">{t("net_adapters_title")}</h3>
        </div>

        {adapters === null ? (
          <p className="flex items-center gap-2 text-xs text-paper-muted">
            <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={2.5} />
            <span>{t("net_reading")}</span>
          </p>
        ) : adapters.length === 0 ? (
          <p className="text-xs text-paper-muted">{t("net_adapters_empty")}</p>
        ) : (
          <ul className="space-y-2">
            {adapters.map((a) => (
              <li key={a.interface_index} className="rounded-xl border border-white/[0.06] bg-surface-subtle/50 p-3.5 hover:border-white/[0.12] transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-paper-bright">{a.name}</span>
                  <span className={`badge ${a.is_dhcp ? "badge-muted" : "badge-live"}`}>
                    {a.is_dhcp ? t("net_adapter_dhcp") : t("net_adapter_manual")}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-paper-muted">
                  {a.ipv4_servers.length > 0 ? a.ipv4_servers.join(", ") : t("net_adapter_no_servers")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Windows DoH Registry */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
              <ShieldCheck size={18} aria-hidden strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paper-bright">{t("net_doh_title")}</h3>
              <p className="text-xs text-paper-muted mt-0.5">{t("net_doh_desc")}</p>
            </div>
          </div>
          <span className={`badge ${dohStatus?.enabled ? "badge-live" : "badge-muted"}`}>
            {dohStatus === null
              ? "…"
              : dohStatus.enabled
                ? t("net_doh_active")
                : t("net_doh_inactive")}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            className="btn btn-primary text-xs cursor-pointer"
            onClick={async () => {
              setBusy(true);
              setErrorMessage(null);
              setSuccessMessage(null);
              try {
                await api.applyDohRegistry();
                pushLog("[+] DoH Registry anahtarı eklendi (EnableAutoDoh=2)");
                setSuccessMessage(lang === "tr" ? "DoH kayıt defterine uygulandı (EnableAutoDoh=2) ve DNS önbelleği temizlendi" : "DoH applied to registry (EnableAutoDoh=2) and DNS cache flushed");
                refreshDoh();
              } catch (e) {
                const err = String(e);
                pushLog(`[!] DoH Registry hatası: ${err}`);
                setErrorMessage(err);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t("net_doh_apply_btn")}
          </button>
          <button
            className="btn btn-secondary text-xs cursor-pointer"
            onClick={async () => {
              setBusy(true);
              setErrorMessage(null);
              setSuccessMessage(null);
              try {
                await api.resetDohRegistry();
                pushLog("[-] DoH Registry anahtarı kaldırıldı ve DNS önbelleği temizlendi");
                setSuccessMessage(lang === "tr" ? "DoH kayıt defterinden başarıyla kaldırıldı ve DNS önbelleği temizlendi" : "DoH removed from registry and DNS cache flushed");
                refreshDoh();
              } catch (e) {
                const err = String(e);
                pushLog(`[!] DoH sıfırlama hatası: ${err}`);
                setErrorMessage(err);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t("net_doh_reset_btn")}
          </button>
        </div>
      </section>

      {/* Discord Özel Onarım Paketi */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
          <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
            <RefreshCw size={18} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-paper-bright">{t("net_discord_title")}</h3>
            <p className="text-xs text-paper-muted mt-0.5">{t("net_discord_desc")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            className="btn btn-primary text-xs"
            onClick={() => setDialog("discord-repair")}
            disabled={busy}
          >
            {t("net_discord_update_btn")}
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => setDialog("discord-cache")}
            disabled={busy}
          >
            {t("net_discord_cache_btn")}
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={dialog !== null}
        title={
          dialog === "apply"
            ? t("net_apply_confirm_title")
            : dialog === "reset"
            ? t("net_reset_confirm_title")
            : dialog === "reset-stack"
            ? t("net_reset_stack_confirm_title")
            : dialog === "discord-repair"
            ? (lang === "tr" ? "Discord Güncelleme Onarımı" : "Discord Update Repair")
            : (lang === "tr" ? "Discord Önbellek Temizleme" : "Discord Cache Clear")
        }
        body={
          dialog === "apply"
            ? `${t("net_apply_confirm_body")} (${DNS_PROVIDERS.find((p) => p.id === provider)?.label})`
            : dialog === "reset"
            ? t("net_reset_confirm_body")
            : dialog === "reset-stack"
            ? t("net_reset_stack_confirm_body")
            : dialog === "discord-repair"
            ? (lang === "tr"
                ? "Discord uygulaması geçici olarak kapatılacak, güncelleme kilitleri ve DNS önbelleği temizlenecektir. Devam etmek istiyor musunuz?"
                : "Discord process will be closed temporarily, update locks and DNS cache will be cleared. Do you want to continue?")
            : (lang === "tr"
                ? "Discord kapatılacak ve önbellek dosyaları (Cache/Code Cache/GPUCache) temizlenecektir. Devam etmek istiyor musunuz?"
                : "Discord will be closed and cache files (Cache/Code Cache/GPUCache) will be deleted. Do you want to continue?")
        }
        confirmLabel={
          dialog === "apply"
            ? t("net_apply_btn")
            : dialog === "reset"
            ? t("net_reset_btn")
            : dialog === "reset-stack"
            ? (lang === "tr" ? "Yığını Sıfırla" : "Reset Stack")
            : (lang === "tr" ? "Onayla ve Temizle" : "Confirm and Clean")
        }
        danger={dialog === "reset" || dialog === "discord-cache" || dialog === "reset-stack"}
        busy={busy}
        onConfirm={() => dialog && void run(dialog)}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
