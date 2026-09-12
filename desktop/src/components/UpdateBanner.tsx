import { ArrowDownCircle, ChevronRight, X } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface UpdateBannerProps {
  version: string;
  onOpenModal: () => void;
  onDismiss: () => void;
}

export default function UpdateBanner({
  version,
  onOpenModal,
  onDismiss,
}: UpdateBannerProps) {
  const { t } = useI18n();

  return (
    <div
      role="banner"
      aria-label={t("banner_update_title")}
      className="relative z-40 w-full bg-live/[0.12] border-b border-live/25 px-4 py-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-live/20 border border-live/35 text-live shrink-0">
            <ArrowDownCircle size={15} strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-live uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-live/15 border border-live/30">
              v{version}
            </span>
            <span className="text-paper-bright font-medium truncate">
              {t("banner_update_msg").replace("{version}", version)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-live text-black hover:bg-live-bright active:scale-95 transition-all shadow-sm shadow-live/20 cursor-pointer"
          >
            <span>{t("banner_update_action")}</span>
            <ChevronRight size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={onDismiss}
            aria-label={t("banner_update_dismiss")}
            title={t("banner_update_dismiss")}
            className="p-1 text-paper-muted hover:text-paper hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
