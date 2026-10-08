import { X, Layers, Check, Shield } from "lucide-react";
import type { Profile } from "../../lib/tauri";
import { useI18n } from "../../lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  selectedProfile: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export default function ProfilePickerSheet({
  open,
  onClose,
  profiles,
  selectedProfile,
  onSelect,
  disabled = false,
}: Props) {
  const { lang } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-h-[85vh] rounded-t-2xl bg-[#090d16] border-t border-white/[0.15] p-5 shadow-2xl flex flex-col animate-slide-up">
        {/* Çekme Çubuğu (Grab Handle) */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-4" />

        {/* Başlık */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-live/15 text-live">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-paper-bright">
                {lang === "tr" ? "Bypass Profili Seçin" : "Select Bypass Profile"}
              </h3>
              <p className="text-[11px] font-mono text-paper-muted">
                {lang === "tr"
                  ? "İnternet sağlayıcınıza en uygun DPI stratejisini seçin"
                  : "Choose the optimal DPI bypass strategy for your ISP"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-paper-muted hover:text-paper hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profil Listesi */}
        <div className="overflow-y-auto py-3 space-y-2.5 flex-1 min-h-0">
          {profiles.map((p) => {
            const isSelected = p.id === selectedProfile;
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(p.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 active:scale-[0.98] ${
                  isSelected
                    ? "bg-live/15 border-live/50 text-paper-bright shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "bg-surface-subtle/60 border-white/[0.06] hover:border-white/[0.15] text-paper-muted hover:text-paper"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-paper-bright truncate">
                      {p.name}
                    </span>
                    {p.id === "universal" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/[0.08] text-live border border-live/30">
                        {lang === "tr" ? "ÖNERİLEN" : "RECOMMENDED"}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-paper-muted leading-relaxed line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  {p.steps && p.steps.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-paper-faint">
                      <Shield size={11} className="text-paper-muted" />
                      <span>
                        {p.steps.length} {lang === "tr" ? "Bypass Katmanı" : "Bypass Steps"}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? "border-live bg-live text-void font-bold shadow-[0_0_8px_#10b981]"
                      : "border-white/[0.2] bg-transparent"
                  }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Alt Güvenli Alan */}
        <div className="pb-[max(env(safe-area-inset-bottom,8px),8px)]" />
      </div>
    </div>
  );
}
