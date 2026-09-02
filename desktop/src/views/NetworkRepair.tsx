import { useEffect, useState } from "react";
import { LoaderCircle, Network, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
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
  const [dialog, setDialog] = useState<"apply" | "reset" | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<(typeof DNS_PROVIDERS)[number]["id"]>("google");
  const [adapters, setAdapters] = useState<AdapterDnsInfo[] | null>(null);
  const [dohStatus, setDohStatus] = useState<DohStatusDto | null>(null);

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
  }, []);

  const run = async (kind: "apply" | "reset") => {
    setBusy(true);
    try {
      if (kind === "apply") await api.applySecureDns(provider);
      else await api.resetDns();
      pushLog(kind === "apply" ? `[+] güvenli DNS uygulandı (${DNS_PROVIDERS.find((p) => p.id === provider)?.label})` : "[*] DNS sıfırlandı");
      refreshDns();
      refreshAdapters();
    } catch (e) {
      pushLog(`[!] DNS işlemi başarısız: ${String(e)}`);
    } finally {
      setBusy(false);
      setDialog(null);
    }
  };

  const isCustom = dns?.some((d) => KNOWN_SECURE_SERVERS.has(d));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b-2 border-white/20 pb-4">
        <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-white">{t("net_title")}</h2>
        <p className="mt-1 text-xs font-mono text-white/60">{t("net_desc")}</p>
      </header>

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

      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <Wifi size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("net_active_dns")}</h3>
        </div>

        {dns === null ? (
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-white/50">
            <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={3} />
            {t("net_reading")}
          </p>
        ) : dns.length === 0 ? (
          <p className="mt-4 font-mono text-xs text-white/50">{t("net_dhcp_notice")}</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {dns.map((d) => (
              <span key={d} className="rounded-none bg-black border-2 border-live/60 px-3 py-1 font-mono text-xs font-bold text-live shadow-[2px_2px_0px_rgba(5,150,105,0.3)]">
                {d}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 font-mono text-xs text-white/50">
          {t("net_status_label")}{" "}
          {isCustom ? (
            <span className="text-live font-black uppercase tracking-wider">[{t("net_secure_active")}]</span>
          ) : (
            <span className="text-white/40 uppercase">[{t("net_dhcp_notice")}]</span>
          )}
        </p>

        {/* DNS Sağlayıcı Seçimi */}
        <div className="mt-5 flex flex-wrap gap-2">
          {DNS_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`rounded-none border-2 px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold transition-none active:translate-y-0.5 active:shadow-none ${
                provider === p.id
                  ? "border-live bg-live text-black shadow-[3px_3px_0px_#fff]"
                  : "border-white/20 bg-black text-white/60 hover:border-white/50 hover:text-white shadow-[2px_2px_0px_rgba(255,255,255,0.05)]"
              }`}
            >
              {p.label} <span className="text-xs opacity-75 font-mono">[{p.primary}]</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none hover:bg-live/90 px-4 py-2"
            onClick={() => setDialog("apply")}
            disabled={busy}
          >
            <ShieldCheck size={16} aria-hidden strokeWidth={2.5} />
            {t("net_apply_btn")}
          </button>
          <button
            className="btn rounded-none border-2 border-alert bg-alert/20 text-alert hover:bg-alert hover:text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,51,102,0.3)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none"
            onClick={() => setDialog("reset")}
            disabled={busy}
          >
            <RefreshCw size={16} aria-hidden strokeWidth={2.5} />
            {t("net_reset_btn")}
          </button>
        </div>
        <p className="mt-3 font-mono text-xs text-white/70">
          {t("net_dns_hint")}
        </p>
      </section>

      {/* Ağ Adaptörleri */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <Network size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("net_adapters_title")}</h3>
        </div>
        {adapters === null ? (
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-white/50">
            <LoaderCircle size={14} className="animate-spin text-live" aria-hidden strokeWidth={3} />
            {t("net_reading")}
          </p>
        ) : adapters.length === 0 ? (
          <p className="mt-4 font-mono text-xs text-white/50">{t("net_adapters_empty")}</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {adapters.map((a) => (
              <li key={a.interface_index} className="rounded-none border-2 border-white/10 bg-black p-3.5 shadow-[2px_2px_0px_rgba(255,255,255,0.03)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-white uppercase">{a.name}</span>
                  <span
                    className={`rounded-none px-2 py-0.5 font-mono text-xs font-black uppercase border ${
                      a.is_dhcp ? "border-white/20 text-white/70 bg-black" : "border-live bg-live/20 text-live"
                    }`}
                  >
                    {a.is_dhcp ? t("net_adapter_dhcp") : t("net_adapter_manual")}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-white/50">
                  {a.ipv4_servers.length > 0 ? a.ipv4_servers.join(", ") : t("net_adapter_no_servers")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Windows DoH Registry */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-live" aria-hidden strokeWidth={2.5} />
            <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("net_doh_title")}</h3>
          </div>
          <span
            className={`rounded-none px-2.5 py-0.5 font-mono text-xs font-black uppercase border-2 ${
              dohStatus?.enabled ? "border-live bg-live text-black shadow-[2px_2px_0px_rgba(255,255,255,0.2)]" : "border-white/20 bg-black text-white/50"
            }`}
          >
            {dohStatus === null
              ? "…"
              : dohStatus.enabled
                ? t("net_doh_active")
                : t("net_doh_inactive")}
          </span>
        </div>
        <p className="mt-3 font-mono text-xs text-white/60">
          {t("net_doh_desc")}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none hover:bg-live/90 px-4 py-2 transition-none"
            onClick={async () => {
              setBusy(true);
              try {
                await api.applyDohRegistry();
                pushLog("[+] DoH Registry anahtarı eklendi (EnableAutoDoh=2)");
                refreshDoh();
              } catch (e) {
                pushLog(`[!] DoH Registry hatası: ${String(e)}`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t("net_doh_apply_btn")}
          </button>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none"
            onClick={async () => {
              setBusy(true);
              try {
                await api.resetDohRegistry();
                pushLog("[-] DoH Registry anahtarı kaldırıldı");
                refreshDoh();
              } catch (e) {
                pushLog(`[!] DoH sıfırlama hatası: ${String(e)}`);
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
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <RefreshCw size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("net_discord_title")}</h3>
        </div>
        <p className="mt-3 font-mono text-xs text-white/60">
          {t("net_discord_desc")}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none hover:bg-live/90 px-4 py-2 transition-none"
            onClick={async () => {
              setBusy(true);
              try {
                const res = await api.repairDiscordUpdates();
                pushLog(`[+] ${res}`);
              } catch (e) {
                pushLog(`[!] Discord onarım hatası: ${String(e)}`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t("net_discord_update_btn")}
          </button>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none"
            onClick={async () => {
              setBusy(true);
              try {
                const res = await api.clearDiscordCache();
                pushLog(`[+] ${res}`);
              } catch (e) {
                pushLog(`[!] Discord önbellek temizleme hatası: ${String(e)}`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t("net_discord_cache_btn")}
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog === "apply" ? t("net_apply_confirm_title") : t("net_reset_confirm_title")}
        body={
          dialog === "apply"
            ? `${t("net_apply_confirm_body")} (${DNS_PROVIDERS.find((p) => p.id === provider)?.label})`
            : t("net_reset_confirm_body")
        }
        confirmLabel={dialog === "apply" ? t("net_apply_btn") : t("net_reset_btn")}
        danger={dialog === "reset"}
        busy={busy}
        onConfirm={() => dialog && void run(dialog)}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
