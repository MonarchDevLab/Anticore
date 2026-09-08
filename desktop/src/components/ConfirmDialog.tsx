import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      className="workspace-dialog"
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
      onClick={(event) => { if (!busy && event.target === event.currentTarget) onCancel(); }}
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
            autoFocus
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
    </dialog>
  );
}
