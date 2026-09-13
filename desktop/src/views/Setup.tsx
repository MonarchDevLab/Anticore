import { useCallback, useEffect, useState } from "react";
import {
  Cog,
  Download,
  LoaderCircle,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  Square,
  Zap,
} from "lucide-react";
import { api, type Profile, type SetupStatus } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import { isMac } from "../lib/platform";
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    return api.getSetupStatus().then(setStatus).catch((error: unknown) => {
      setStatus(null);
      setError(String(error));
    });
  }, []);

  useEffect(() => {
    refresh();
    void api.listProfiles().then(setProfiles).catch((error: unknown) => setError(String(error)));
    void api.checkIsAdmin().then(setIsAdmin).catch((error: unknown) => setError(String(error)));
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const run = async (kind: string, fn: () => Promise<void>, okMsg: string) => {
    if (busy !== null) return;
    setBusy(kind);
    setError(null);
    try {
      if (isAdmin !== true) {
        throw new Error(
          lang === "tr"
            ? "Yönetici yetkisi gerekiyor. Lütfen 'Yönetici Olarak Yeniden Başlat' butonunu kullanın."
            : "Administrator privileges required. Please use 'Restart as Administrator' button."
        );
      }
      await fn();
      pushLog(okMsg);
      await refresh();
    } catch (e) {
      setError(String(e));
      pushLog(`[!] HATA: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="pb-3 border-b border-white/[0.08]">
        <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("setup_title")}</h2>
        <p className="mt-0.5 text-xs text-paper-muted">{t("setup_desc")}</p>
      </header>

      <Guide
        title={lang === "tr" ? "Servis mi, Bağımsız mı? Fark Ne?" : "Service vs. Detached — What's the Difference?"}
        items={
          lang === "tr"
            ? [
                {
                  q: "Servis olarak kurmak ne demek?",
                  a: "Çekirdek, işletim sisteminin kendi servis yöneticisiyle (Windows Hizmeti / macOS LaunchDaemon) arka plan servisi olarak kaydedilir. Bilgisayarı her açtığınızda otomatik başlar; panel kapalıyken bile koruma sürer.",
                },
                {
                  q: "Bağımsız çalıştırma ne demek?",
                  a: "Çekirdek bağımsız arka plan görevi olarak başlar. Paneli kapatsanız da çalışır ama bilgisayar yeniden başlatıldığında otomatik sonlanır.",
                },
                {
                  q: "İkisini aynı anda kullanabilir miyim?",
                  a: "Hayır — iki Çekirdeğin aynı ağ trafiğine müdahale etmesi çakışma yaratır. Uygulama birini başlatmadan önce diğerini durdurmanızı sağlar.",
                },
              ]
            : [
                {
                  q: "What does installing as a service mean?",
                  a: "The engine is registered with the OS background service manager (Windows Service / macOS LaunchDaemon). It starts automatically every time the computer boots; protection continues even with the panel closed.",
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

      {isAdmin === false && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-warn/15 border border-warn/35 text-paper-bright flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-warn/20 text-warn shrink-0 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-warn tracking-wide uppercase">
                {t("privilege_required_title")}
              </div>
              <div className="text-xs text-paper-muted mt-0.5">
                {isMac
                  ? (lang === "tr"
                      ? "Sistem servisi kurmak veya arka planda bağımsız Çekirdek çalıştırmak için macOS yetkili (root) izni gereklidir."
                      : "Elevated (root) privileges are required on macOS to install a system service or run a detached engine.")
                  : (lang === "tr"
                      ? "Sistem servisi kurmak veya arka planda bağımsız Çekirdek çalıştırmak için Yönetici / root yetkisi gereklidir."
                      : "Administrator / root privileges are required to install a system service or run a detached engine.")}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await api.restartAsAdmin();
              } catch (err) {
                setError(String(err));
              }
            }}
            className="btn btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 self-end sm:self-center"
          >
            <Shield size={14} />
            <span>{isMac ? t("dash_admin_btn_mac") : t("dash_admin_btn")}</span>
          </button>
        </div>
      )}

      {/* Windows Servisi */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-live/10 border border-live/25 text-live">
              <Cog size={18} aria-hidden strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-paper-bright">{t("setup_service_title")}</h3>
          </div>
          <span
            className={`badge ${
              status?.service_installed
                ? status.service_running
                  ? "badge-live"
                  : "badge-warn"
                : "badge-muted"
            }`}
          >
            {status === null ? (lang === "tr" ? "Durum bilinmiyor" : "Status unknown") : status.service_installed
              ? status.service_running
                ? t("setup_status_running")
                : t("setup_status_stopped")
              : t("setup_status_not_installed")}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-paper-muted">
          {t("setup_service_desc")}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {!status?.service_installed && (
            <>
              <select
                aria-label="Servis profili"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="input !w-auto text-xs py-1.5"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary text-xs"
                onClick={() => setConfirm("install")}
                disabled={busy !== null || !status || isAdmin !== true || !profiles.length}
              >
                {busy === "install" ? (
                  <LoaderCircle size={14} className="animate-spin text-void" aria-hidden strokeWidth={2.5} />
                ) : (
                  <Download size={14} aria-hidden strokeWidth={2} />
                )}
                <span>{t("setup_service_btn")}</span>
              </button>
            </>
          )}
          {status?.service_installed && (
            <button
              className="btn btn-danger text-xs"
              onClick={() => setConfirm("uninstall")}
              disabled={busy !== null || !status || isAdmin !== true}
            >
              {busy === "uninstall" ? (
                <LoaderCircle size={14} className="animate-spin" aria-hidden strokeWidth={2.5} />
              ) : (
                <Square size={14} aria-hidden strokeWidth={2} />
              )}
              <span>{t("setup_service_remove")}</span>
            </button>
          )}
        </div>
      </section>

      {/* Bağımsız Süreç */}
      <section className="card p-5 lg:p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan">
              <Zap size={18} aria-hidden strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-paper-bright">{t("setup_detached_title")}</h3>
          </div>
          <span
            className={`badge ${
              status?.detached_running ? "badge-live" : "badge-muted"
            }`}
          >
            {status === null ? (lang === "tr" ? "Durum bilinmiyor" : "Status unknown") : status.detached_running ? t("setup_status_running") : t("setup_status_off")}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-paper-muted">
          {t("setup_detached_desc")}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {!status?.detached_running && (
            <>
              <select
                aria-label="Bağımsız profil"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="input !w-auto text-xs py-1.5"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary text-xs"
                onClick={() =>
                  void run(
                    "detached_start",
                    () => api.detachedStart(selected),
                    `[+] bağımsız Çekirdek başladı (profil=${selected})`,
                  )
                }
                disabled={busy !== null || !status || isAdmin !== true || !profiles.length || status.service_installed}
              >
                {busy === "detached_start" ? (
                  <LoaderCircle size={14} className="animate-spin text-void" aria-hidden strokeWidth={2.5} />
                ) : (
                  <Play size={14} aria-hidden strokeWidth={2} />
                )}
                <span>{t("setup_detached_btn")}</span>
              </button>
            </>
          )}
          {status?.detached_running && (
            <button
              className="btn btn-danger text-xs"
              onClick={() =>
                void run("detached_stop", () => api.detachedStop(), "[*] bağımsız Çekirdek durduruldu")
              }
              disabled={busy !== null || !status || isAdmin !== true}
            >
              {busy === "detached_stop" ? (
                <LoaderCircle size={14} className="animate-spin" aria-hidden strokeWidth={2.5} />
              ) : (
                <Square size={14} aria-hidden strokeWidth={2} />
              )}
              <span>{t("setup_detached_stop")}</span>
            </button>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-alert/10 border border-alert/25 p-3 text-xs text-alert font-semibold">
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
