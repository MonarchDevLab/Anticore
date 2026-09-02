import { useCallback, useEffect, useState } from "react";
import {
  Cog,
  Download,
  LoaderCircle,
  Play,
  RefreshCw,
  Square,
  Zap,
} from "lucide-react";
import { api, type Profile, type SetupStatus } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import Guide from "../components/Guide";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";

export default function Setup({ pushLog }: { pushLog: (l: string) => void }) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("universal");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"install" | "uninstall" | null>(null);

  const refresh = useCallback(() => {
    void api.getSetupStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
    void api.listProfiles().then(setProfiles);
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const run = async (kind: string, fn: () => Promise<void>, okMsg: string) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
      pushLog(okMsg);
      refresh();
    } catch (e) {
      setError(String(e));
      pushLog(`[!] HATA: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b-2 border-white/20 pb-4">
        <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-white">{t("setup_title")}</h2>
        <p className="mt-1 text-xs font-mono text-white/60">{t("setup_desc")}</p>
      </header>

      <Guide
        title={lang === "tr" ? "Servis mi, Bağımsız mı? Fark Ne?" : "Service vs. Detached — What's the Difference?"}
        items={
          lang === "tr"
            ? [
                {
                  q: "Servis olarak kurmak ne demek?",
                  a: "Motor, Windows'un kendi hizmet sistemiyle (arka plan servisi olarak) kaydedilir. Bilgisayarı her açtığınızda otomatik başlar; panel kapalıyken bile koruma sürer.",
                },
                {
                  q: "Bağımsız çalıştırma ne demek?",
                  a: "Motor bağımsız arka plan görevi olarak başlar. Paneli kapatsanız da çalışır ama bilgisayar yeniden başlatıldığında otomatik sonlanır.",
                },
                {
                  q: "İkisini aynı anda kullanabilir miyim?",
                  a: "Hayır — iki motorun aynı ağ trafiğine müdahale etmesi çakışma yaratır. Uygulama birini başlatmadan önce diğerini durdurmanızı sağlar.",
                },
              ]
            : [
                {
                  q: "What does installing as a service mean?",
                  a: "The engine is registered with Windows' own service manager (as a background service). It starts automatically every time the computer boots; protection continues even with the panel closed.",
                },
                {
                  q: "What does detached mode mean?",
                  a: "The engine starts as a standalone background task. It keeps running if you close the panel, but stops automatically when the computer restarts.",
                },
                {
                  q: "Can I use both at the same time?",
                  a: "No — two engines intercepting the same network traffic would conflict. The app makes you stop one before starting the other.",
                },
              ]
        }
      />

      {/* Servis */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] font-mono">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Cog size={18} className="text-live" aria-hidden strokeWidth={2.5} />
          <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("setup_service_title")}</h3>
          <span
            className={`ml-auto rounded-none px-2.5 py-1 font-mono text-xs font-black uppercase border ${
              status?.service_installed
                ? status.service_running
                  ? "border-live bg-live text-black"
                  : "border-warn bg-warn/20 text-warn"
                : "border-white/20 bg-black text-white/50"
            }`}
          >
            {status?.service_installed
              ? status.service_running
                ? t("setup_status_running")
                : t("setup_status_stopped")
              : t("setup_status_not_installed")}
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/60">
          {t("setup_service_desc")}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!status?.service_installed && (
            <>
              <select
                aria-label="Servis profili"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="rounded-none border-2 border-white/20 bg-black px-3 py-1.5 font-mono text-xs text-white focus:border-live focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5 hover:bg-live/90"
                onClick={() => setConfirm("install")}
                disabled={busy !== null}
              >
                {busy === "install" ? (
                  <LoaderCircle size={15} className="animate-spin text-black" aria-hidden strokeWidth={3} />
                ) : (
                  <Download size={15} aria-hidden strokeWidth={2.5} />
                )}
                {t("setup_service_btn")}
              </button>
            </>
          )}
          {status?.service_installed && (
            <button
              className="btn rounded-none border-2 border-alert bg-alert/20 text-alert hover:bg-alert hover:text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,51,102,0.3)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5"
              onClick={() => setConfirm("uninstall")}
              disabled={busy !== null}
            >
              {busy === "uninstall" ? (
                <LoaderCircle size={15} className="animate-spin text-black" aria-hidden strokeWidth={3} />
              ) : (
                <Square size={14} aria-hidden strokeWidth={2.5} />
              )}
              {t("setup_service_remove")}
            </button>
          )}
        </div>
      </section>

      {/* Bağımsız */}
      <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] font-mono">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Zap size={18} className="text-cyan" aria-hidden strokeWidth={2.5} />
          <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">{t("setup_detached_title")}</h3>
          <span
            className={`ml-auto rounded-none px-2.5 py-1 font-mono text-xs font-black uppercase border ${
              status?.detached_running
                ? "border-live bg-live text-black"
                : "border-white/20 bg-black text-white/50"
            }`}
          >
            {status?.detached_running ? t("setup_status_running") : t("setup_status_off")}
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/60">
          {t("setup_detached_desc")}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!status?.detached_running && (
            <>
              <select
                aria-label="Bağımsız profil"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="rounded-none border-2 border-white/20 bg-black px-3 py-1.5 font-mono text-xs text-white focus:border-live focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5 hover:bg-live/90"
                onClick={() =>
                  void run(
                    "detached_start",
                    () => api.detachedStart(selected),
                    `[+] bağımsız motor başladı (profil=${selected})`,
                  )
                }
                disabled={busy !== null}
              >
                {busy === "detached_start" ? (
                  <LoaderCircle size={15} className="animate-spin text-black" aria-hidden strokeWidth={3} />
                ) : (
                  <Play size={15} aria-hidden strokeWidth={2.5} />
                )}
                {t("setup_detached_btn")}
              </button>
            </>
          )}
          {status?.detached_running && (
            <button
              className="btn rounded-none border-2 border-alert bg-alert/20 text-alert hover:bg-alert hover:text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,51,102,0.3)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5"
              onClick={() =>
                void run("detached_stop", () => api.detachedStop(), "[*] bağımsız motor durduruldu")
              }
              disabled={busy !== null}
            >
              {busy === "detached_stop" ? (
                <LoaderCircle size={15} className="animate-spin text-black" aria-hidden strokeWidth={3} />
              ) : (
                <Square size={14} aria-hidden strokeWidth={2.5} />
              )}
              {t("setup_detached_stop")}
            </button>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-none bg-black border-2 border-alert px-4 py-2 font-mono text-xs text-alert font-bold uppercase">
          {error}
        </p>
      )}

      {status === null && (
        <EmptyState icon={<RefreshCw size={26} className="animate-spin" aria-hidden />} title={t("loading")} hint="" />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "install" ? t("setup_install_confirm_title") : t("setup_uninstall_confirm_title")}
        body={
          confirm === "install"
            ? `${t("setup_install_confirm_body")} (${t("profile_name")}: ${profiles.find((p) => p.id === selected)?.name ?? selected})`
            : t("setup_uninstall_confirm_body")
        }
        confirmLabel={confirm === "install" ? t("setup_install_confirm_btn") : t("setup_uninstall_confirm_btn")}
        danger={confirm === "uninstall"}
        busy={busy !== null}
        onConfirm={() => {
          const kind = confirm;
          setConfirm(null);
          if (kind === "install") {
            void run("install", () => api.installService(selected), "[+] servis kuruldu");
          } else if (kind === "uninstall") {
            void run("uninstall", () => api.uninstallService(), "[-] servis kaldırıldı");
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
