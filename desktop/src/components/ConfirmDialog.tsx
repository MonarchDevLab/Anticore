import { LoaderCircle } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6"
      onClick={onCancel}
    >
      <div
        className={`relative overflow-hidden p-6 bg-black border-[3px] ${danger ? "border-alert" : "border-white/30"} shadow-[8px_8px_0px_#fff] w-full max-w-md font-mono`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`font-mono text-sm font-black uppercase tracking-wider ${danger ? "text-alert" : "text-white"}`}>{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-white/70 font-mono">{body}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs px-3.5 py-1.5 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none transition-none"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel || t("dialog_cancel")}
          </button>
          <button
            className={`btn rounded-none border-2 font-mono font-black uppercase text-xs px-4 py-1.5 shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none transition-none flex items-center gap-1.5 ${
              danger
                ? "border-alert bg-alert text-black hover:bg-alert/90"
                : "border-live bg-live text-black hover:bg-live/90"
            }`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <LoaderCircle size={14} className="animate-spin text-black" aria-hidden strokeWidth={3} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
