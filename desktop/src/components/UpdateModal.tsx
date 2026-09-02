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
      // Uygulama otomatik yeniden başlar
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
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
      onClick={status !== "installing" ? onClose : undefined}
    >
      <div
        className="relative overflow-hidden p-6 bg-black border-[3px] border-white/30 shadow-[8px_8px_0px_#fff] w-full max-w-lg font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white/20 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-live" strokeWidth={2.5} />
            <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
              {t("update_modal_title")}
            </h3>
          </div>
          {status !== "installing" && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 hover:bg-white/10 transition-none cursor-pointer"
              aria-label={t("update_modal_close")}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Content States */}
        <div className="space-y-4">
          {/* 1. Checking */}
          {status === "checking" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <LoaderCircle size={32} className="animate-spin text-live" strokeWidth={2.5} />
              <p className="text-xs uppercase font-bold tracking-wider text-white/80">
                {t("update_modal_checking")}
              </p>
            </div>
          )}

          {/* 2. Up to Date */}
          {status === "up_to_date" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-live/10 border-2 border-live text-live">
                <CheckCircle2 size={24} strokeWidth={2.5} className="shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">
                    {t("update_modal_up_to_date")}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5">
                    {t("update_modal_up_to_date_sub")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Update Available */}
          {status === "available" && updateInfo && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-live/15 border-2 border-live text-live">
                <Sparkles size={20} strokeWidth={2.5} className="shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">
                    {t("update_modal_new_available")}
                  </p>
                </div>
              </div>

              {updateInfo.release_notes && (
                <div className="border-2 border-white/20 bg-black p-3.5 max-h-44 overflow-y-auto space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-white/70 mb-1">
                    {t("settings_release_notes")}:
                  </p>
                  <div className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                    {updateInfo.release_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Installing / Downloading */}
          {status === "installing" && (
            <div className="py-6 space-y-4 text-center">
              <LoaderCircle size={32} className="animate-spin text-live mx-auto" strokeWidth={3} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">
                  {t("update_modal_downloading")}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {t("update_modal_installing_sub")}
                </p>
              </div>

              {progress && progress.total > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="w-full h-3 bg-white/10 border border-white/30 overflow-hidden">
                    <div
                      className="h-full bg-live transition-all duration-150"
                      style={{ width: `${Math.round((progress.downloaded / progress.total) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/60 font-mono">
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
            <div className="p-4 bg-alert/10 border-2 border-alert text-alert space-y-2">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <AlertTriangle size={18} strokeWidth={2.5} />
                <span>{t("update_modal_error")}</span>
              </div>
              <p className="text-xs text-white/80 font-mono leading-relaxed">
                {errorMsg || t("update_modal_error_sub")}
              </p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {status !== "installing" && (
          <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-white/10 pt-4">
            {/* Tekrar Denetle */}
            {(status === "up_to_date" || status === "error") && (
              <button
                onClick={() => void checkUpdates()}
                className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs px-3.5 py-2 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none transition-none flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} strokeWidth={2.5} />
                {t("update_modal_recheck_btn")}
              </button>
            )}

            {/* Manuel İndirme Linki */}
            {status === "available" && updateInfo?.download_url && (
              <button
                onClick={() => void api.openBrowserUrl(updateInfo.download_url!)}
                className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs px-3 py-2 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none transition-none flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} strokeWidth={2} />
                {t("update_modal_download_manual")}
              </button>
            )}

            {/* Tek Tıkla Doğrudan Kur Butonu */}
            {status === "available" && (
              <button
                onClick={() => void handleInstall()}
                className="btn rounded-none border-2 border-live bg-live text-black hover:bg-live/90 font-mono font-black uppercase text-xs px-5 py-2 shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none transition-none flex items-center gap-2 cursor-pointer"
              >
                <Download size={15} strokeWidth={3} />
                {t("update_modal_update_btn")}
              </button>
            )}

            {/* Kapat */}
            <button
              onClick={onClose}
              className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs px-4 py-2 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none transition-none cursor-pointer"
            >
              {t("update_modal_close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
