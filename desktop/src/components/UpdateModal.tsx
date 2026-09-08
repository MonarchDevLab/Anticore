import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
  AlertTriangle,
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
  const { t } = useI18n();
  const [status, setStatus] = useState<ModalState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ downloaded: number; total: number } | null>(null);

  const checkUpdates = async () => {
    setStatus("checking");
    setErrorMsg(null);
    setProgress(null);
    try {
      const repo = localStorage.getItem("anticore_github_repo") || undefined;
      const info = await api.checkUpdate(repo);
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

  const handleInstall = async () => {
    setStatus("installing");
    setProgress(null);
    setErrorMsg(null);
    try {
      await downloadAndInstallUpdate((downloaded, total) => {
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
              <Sparkles size={16} strokeWidth={2} />
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
                <CheckCircle2 size={22} strokeWidth={2} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold text-live">
                    {t("update_modal_up_to_date")}
                  </p>
                  <p className="text-xs text-paper-muted mt-0.5">
                    {t("update_modal_up_to_date_sub")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Update Available */}
          {status === "available" && updateInfo && (
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-live/15 border border-live/30 text-live">
                <Sparkles size={20} strokeWidth={2} className="shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-bold">
                    {t("update_modal_new_available")}
                  </p>
                </div>
              </div>

              {updateInfo.release_notes && (
                <div className="rounded-xl border border-white/[0.08] bg-surface-subtle p-3.5 max-h-44 overflow-y-auto space-y-1">
                  <p className="text-xs font-semibold text-paper-muted mb-1">
                    {t("settings_release_notes")}:
                  </p>
                  <div className="text-xs text-paper whitespace-pre-wrap leading-relaxed">
                    {updateInfo.release_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Installing / Downloading */}
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
            <div className="p-4 rounded-xl bg-alert/10 border border-alert/30 text-alert space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle size={16} strokeWidth={2} />
                <span>{t("update_modal_error")}</span>
              </div>
              <p className="text-xs text-paper-muted leading-relaxed">
                {errorMsg || t("update_modal_error_sub")}
              </p>
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

            {status === "available" && updateInfo?.download_url && (
              <button
                onClick={() => void api.openBrowserUrl(updateInfo.download_url!)}
                className="btn btn-secondary text-xs"
              >
                <Download size={13} strokeWidth={2} />
                <span>{t("update_modal_download_manual")}</span>
              </button>
            )}

            {status === "available" && (
              <button
                onClick={() => void handleInstall()}
                className="btn btn-primary text-xs"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>{t("update_modal_update_btn")}</span>
              </button>
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
