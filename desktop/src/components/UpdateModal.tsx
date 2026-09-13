import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  LoaderCircle,
  RefreshCw,
  ArrowDownCircle,
  X,
  AlertTriangle,
  KeyRound,
} from "lucide-react";
import { api, downloadAndInstallUpdate, type UpdateInfoDto } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdateDetected?: (hasUpdate: boolean) => void;
}

type ModalState = "idle" | "checking" | "up_to_date" | "available" | "installing" | "error";

export default function UpdateModal({ open, onClose, onUpdateDetected }: Props) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<ModalState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ downloaded: number; total: number } | null>(null);
  const [tokenInput, setTokenInput] = useState(() => localStorage.getItem("anticore_gh_token") || "");
  const [showTokenField, setShowTokenField] = useState(false);

  const checkUpdates = async (overrideToken?: string) => {
    setStatus("checking");
    setErrorMsg(null);
    setProgress(null);
    try {
      const repo = localStorage.getItem("anticore_github_repo") || undefined;
      const token = overrideToken ?? (localStorage.getItem("anticore_gh_token") || undefined);
      const info = await api.checkUpdate(repo, token);
      setUpdateInfo(info);
      if (info.has_update) {
        setStatus("available");
        onUpdateDetected?.(true);
      } else {
        setStatus("up_to_date");
        onUpdateDetected?.(false);
      }
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  };

  useEffect(() => {
    if (open && status === "idle") {
      void checkUpdates();
    }
  }, [open]);

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem("anticore_gh_token", tokenInput.trim());
    } else {
      localStorage.removeItem("anticore_gh_token");
    }
    void checkUpdates(tokenInput.trim() || undefined);
  };

  const handleInstall = async () => {
    setStatus("installing");
    setProgress(null);
    setErrorMsg(null);
    try {
      await downloadAndInstallUpdate(updateInfo?.download_url, (downloaded, total) => {
        setProgress({ downloaded, total });
      });
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("update_modal_title")}
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm p-4"
      onClick={status !== "installing" ? onClose : undefined}
    >
      <div
        className="card rounded-2xl p-6 bg-surface-card border border-white/[0.12] shadow-2xl w-full max-w-lg relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-live/10 border border-live/25 text-live">
              <ArrowDownCircle size={16} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-paper-bright">
              {t("update_modal_title")}
            </h3>
          </div>
          {status !== "installing" && (
            <button
              onClick={onClose}
              className="text-paper-muted hover:text-paper p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label={t("update_modal_close")}
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Content States */}
        <div className="space-y-4">
          {/* 1. Checking */}
          {status === "checking" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <LoaderCircle size={32} className="animate-spin text-live" strokeWidth={2.5} />
              <p className="text-xs font-semibold text-paper-muted">
                {t("update_modal_checking")}
              </p>
            </div>
          )}

          {/* 2. Up to Date */}
          {status === "up_to_date" && (
            <div className="py-3 space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-live/10 border border-live/25 text-live">
                <CheckCircle2 size={24} strokeWidth={2} />
                <div>
                  <h4 className="text-xs font-bold text-paper-bright">
                    {t("update_modal_up_to_date")}
                  </h4>
                  <p className="text-[11px] text-paper-muted mt-0.5">
                    {t("update_modal_up_to_date_sub")} (v{updateInfo?.current_version || ""})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Update Available */}
          {status === "available" && updateInfo && (
            <div className="py-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-paper-muted uppercase">
                    {lang === "tr" ? "Yeni Sürüm" : "New Version"}
                  </span>
                  <span className="text-xs font-mono font-bold text-live px-2 py-0.5 rounded bg-live/10 border border-live/20">
                    v{updateInfo.latest_version.trim().replace(/^v+/i, "")}
                  </span>
                </div>
                {updateInfo.release_name && (
                  <h4 className="text-xs font-bold text-paper-bright">{updateInfo.release_name}</h4>
                )}
                {updateInfo.release_notes && (
                  <div className="text-[11px] text-paper-muted max-h-36 overflow-y-auto bg-black/20 p-2.5 rounded-lg border border-white/[0.04] font-mono whitespace-pre-wrap leading-relaxed">
                    {updateInfo.release_notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Installing */}
          {status === "installing" && (
            <div className="py-6 space-y-4 text-center">
              <LoaderCircle size={32} className="animate-spin text-live mx-auto" strokeWidth={2.5} />
              <div>
                <p className="text-xs font-bold text-paper-bright">
                  {t("update_modal_downloading")}
                </p>
                <p className="text-xs text-paper-muted mt-1">
                  {t("update_modal_installing_sub")}
                </p>
              </div>

              {progress && progress.total > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-live rounded-full transition-all duration-150"
                      style={{ width: `${Math.round((progress.downloaded / progress.total) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-paper-muted font-mono">
                    <span>
                      {(progress.downloaded / (1024 * 1024)).toFixed(1)} MB / {(progress.total / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <span className="font-bold text-live">
                      %{Math.round((progress.downloaded / progress.total) * 100)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Error */}
          {status === "error" && (
            <div className="p-4 rounded-xl bg-alert/10 border border-alert/30 text-alert space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle size={16} strokeWidth={2} />
                <span>{t("update_modal_error")}</span>
              </div>
              <p className="text-xs text-paper-muted leading-relaxed">
                {errorMsg || t("update_modal_error_sub")}
              </p>

              {/* GitHub Token / Yetkilendirme Seçeneği */}
              <div className="pt-2 border-t border-white/[0.08]">
                {!showTokenField ? (
                  <button
                    onClick={() => setShowTokenField(true)}
                    className="flex items-center gap-1.5 text-[11px] text-paper-muted hover:text-live transition-colors cursor-pointer"
                  >
                    <KeyRound size={12} />
                    <span>
                      {lang === "tr"
                        ? "Özel GitHub Yetki Tokenı (Personal Access Token) Tanımla"
                        : "Define Custom GitHub Personal Access Token (PAT)"}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] text-paper-muted block">
                      {lang === "tr"
                        ? "GitHub PAT (repo okuma izinli):"
                        : "GitHub PAT (read:repo scope):"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="input text-xs py-1 px-2.5 flex-1 font-mono"
                      />
                      <button
                        onClick={handleSaveToken}
                        className="btn btn-secondary text-xs py-1 px-3"
                      >
                        {lang === "tr" ? "Kaydet ve Dene" : "Save & Retry"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {status !== "installing" && (
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/[0.08] pt-3.5">
            {(status === "up_to_date" || status === "error") && (
              <button
                onClick={() => void checkUpdates()}
                className="btn btn-secondary text-xs"
              >
                <RefreshCw size={13} strokeWidth={2} />
                <span>{t("update_modal_recheck_btn")}</span>
              </button>
            )}

            {status === "error" && updateInfo && (
              <button
                onClick={() => void api.openBrowserUrl(updateInfo.download_url || updateInfo.html_url)}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <Download size={13} strokeWidth={2} />
                <span>{t("update_modal_download_manual")}</span>
              </button>
            )}

            {status === "available" && updateInfo && (
              <>
                {updateInfo.setup_url && (
                  <button
                    onClick={() => void api.openBrowserUrl(updateInfo.setup_url!)}
                    className="btn btn-secondary text-xs"
                    title="Windows NSIS Kurulum Paketi (.exe)"
                  >
                    <Download size={13} strokeWidth={2} />
                    <span>{t("settings_download_setup")}</span>
                  </button>
                )}

                {updateInfo.portable_exe_url && (
                  <button
                    onClick={() => void api.openBrowserUrl(updateInfo.portable_exe_url!)}
                    className="btn btn-secondary text-xs"
                    title="Tek Dosya Taşınabilir Sürüm (Anticore.exe)"
                  >
                    <Download size={13} strokeWidth={2} />
                    <span>{t("settings_download_portable_exe")}</span>
                  </button>
                )}

                {updateInfo.portable_zip_url && (
                  <button
                    onClick={() => void api.openBrowserUrl(updateInfo.portable_zip_url!)}
                    className="btn btn-secondary text-xs"
                    title="Taşınabilir ZIP Arşivi"
                  >
                    <Download size={13} strokeWidth={2} />
                    <span>{t("settings_download_portable_zip")}</span>
                  </button>
                )}

                {!updateInfo.setup_url && !updateInfo.portable_exe_url && !updateInfo.portable_zip_url && updateInfo.download_url && (
                  <button
                    onClick={() => void api.openBrowserUrl(updateInfo.download_url!)}
                    className="btn btn-secondary text-xs"
                  >
                    <Download size={13} strokeWidth={2} />
                    <span>{t("update_modal_download_manual")}</span>
                  </button>
                )}

                <button
                  onClick={() => void handleInstall()}
                  className="btn btn-primary text-xs"
                >
                  <Download size={14} strokeWidth={2.5} />
                  <span>{t("update_modal_update_btn")}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              {t("update_modal_close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
