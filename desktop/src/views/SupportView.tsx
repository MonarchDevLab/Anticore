import { useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  LifeBuoy,
  LoaderCircle,
  MessageSquare,
  Send,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { connectivitySync } from "../services/connectivitySync";

interface Props {
  pushLog: (log: string) => void;
}

type FeedbackCategory = "bug" | "connectivity" | "suggestion" | "other";

export default function SupportView({ pushLog }: Props) {
  const { t } = useI18n();

  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories: Array<{ id: FeedbackCategory; label: string; icon: typeof Bug }> = [
    { id: "bug", label: t("support_cat_bug"), icon: Bug },
    { id: "connectivity", label: t("support_cat_connectivity"), icon: WifiOff },
    { id: "suggestion", label: t("support_cat_suggestion"), icon: Sparkles },
    { id: "other", label: t("support_cat_other"), icon: MessageSquare },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setError(t("support_error_subject_req"));
      return;
    }
    if (cleanMessage.length < 10) {
      setError(t("support_error_message_req"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await connectivitySync.sendFeedback({
        category,
        subject: cleanSubject,
        message: cleanMessage,
        contact: contact.trim() || undefined,
        includeDiagnostics,
      });

      if (res.success) {
        setIsSuccess(true);
        pushLog(`[+] Destek bildirimi başarıyla iletildi: ${cleanSubject}`);
      } else {
        setError(res.message || t("support_error_title"));
      }
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject("");
    setMessage("");
    setContact("");
    setError(null);
    setIsSuccess(false);
  };

  return (
    <div className="connection-workspace">
      <header className="workspace-heading">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan">
            <LifeBuoy size={22} aria-hidden strokeWidth={2} />
          </div>
          <div>
            <h1>{t("support_title")}</h1>
            <p className="text-xs text-paper-muted mt-0.5">{t("support_subtitle")}</p>
          </div>
        </div>
      </header>

      {isSuccess ? (
        <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-surface-card border border-emerald-500/30 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={32} strokeWidth={2} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-paper-bright">{t("support_success_title")}</h2>
            <p className="text-xs text-paper-muted max-w-md mx-auto leading-relaxed">
              {t("support_success_desc")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="workspace-button secondary !w-auto px-6 py-2 mx-auto cursor-pointer"
          >
            <span>{t("support_btn_new")}</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Kategori Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-paper-muted">
              {t("support_label_category")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer gap-1.5 ${
                      isSelected
                        ? "bg-cyan/15 border-cyan text-cyan shadow-sm"
                        : "bg-surface-card border-white/[0.08] text-paper-muted hover:border-white/20 hover:text-paper"
                    }`}
                  >
                    <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Konu */}
          <div className="space-y-1.5">
            <label htmlFor="support-subject" className="text-xs font-semibold text-paper-bright">
              {t("support_label_subject")} <span className="text-rose-400">*</span>
            </label>
            <input
              id="support-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("support_placeholder_subject")}
              className="input w-full text-xs py-2 px-3 rounded-lg bg-surface-field border border-white/[0.1] text-paper focus:border-cyan focus:outline-none"
              maxLength={150}
              required
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <label htmlFor="support-message" className="text-xs font-semibold text-paper-bright">
              {t("support_label_message")} <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("support_placeholder_message")}
              rows={5}
              className="input w-full text-xs py-2 px-3 rounded-lg bg-surface-field border border-white/[0.1] text-paper focus:border-cyan focus:outline-none resize-y font-sans"
              maxLength={2000}
              required
            />
            <div className="text-[10px] text-paper-faint text-right">
              {message.length} / 2000
            </div>
          </div>

          {/* İletişim */}
          <div className="space-y-1.5">
            <label htmlFor="support-contact" className="text-xs font-semibold text-paper-bright">
              {t("support_label_contact")}
            </label>
            <input
              id="support-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("support_placeholder_contact")}
              className="input w-full text-xs py-2 px-3 rounded-lg bg-surface-field border border-white/[0.1] text-paper focus:border-cyan focus:outline-none"
              maxLength={100}
            />
          </div>

          {/* Teşhis Bilgileri Onay Kutusu */}
          <div className="p-3.5 rounded-xl bg-surface-card border border-white/[0.08] flex items-start gap-3">
            <input
              id="support-diagnostics"
              type="checkbox"
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              className="mt-0.5 rounded border-white/20 text-cyan focus:ring-cyan cursor-pointer"
            />
            <label htmlFor="support-diagnostics" className="space-y-0.5 cursor-pointer select-none">
              <span className="block text-xs font-medium text-paper-bright">
                {t("support_include_diagnostics")}
              </span>
              <span className="block text-[11px] text-paper-muted leading-relaxed">
                {t("support_diagnostics_hint")}
              </span>
            </label>
          </div>

          {/* Gönder Butonu */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="workspace-button primary full-width flex items-center justify-center gap-2 py-2.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  <span>{t("support_sending")}</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>{t("support_btn_send")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
