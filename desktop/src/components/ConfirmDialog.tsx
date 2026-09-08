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
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className={`card rounded-2xl p-6 bg-surface-card border shadow-2xl w-full max-w-md relative overflow-hidden ${
          danger ? "border-alert/30" : "border-white/[0.12]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-sm font-bold ${danger ? "text-alert" : "text-paper-bright"}`}>
          {title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-paper-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="btn btn-secondary text-xs"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel || t("dialog_cancel")}
          </button>
          <button
            className={`btn text-xs ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <LoaderCircle size={13} className="animate-spin" aria-hidden strokeWidth={2.5} />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
