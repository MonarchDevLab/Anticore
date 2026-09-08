import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, X, Trash2, Loader2, Check } from "lucide-react";
import { api, type CompatReport } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

/**
 * Açılışta sessizce bir uyumluluk taraması çalıştırır ve çakışabilecek
 * AV/eski servis/sürücü sorunu bulunursa üstbarın altında bir uyarı
 * şeridi gösterir. Kullanıcı tek tıkla eski çakışan servisleri temizleyebilir.
 */
export default function CompatWarning() {
  const { t, lang } = useI18n();
  const [report, setReport] = useState<CompatReport | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState(false);

  const refreshReport = async () => {
    try {
      const rep = await api.checkCompatibility();
      setReport(rep);
    } catch {
      // sessiz yut
    }
  };

  useEffect(() => {
    void refreshReport();
  }, []);

  const handleCleanupLegacy = async () => {
    setCleaning(true);
    try {
      await api.cleanupLegacyServices();
      setCleanSuccess(true);
      setTimeout(async () => {
        await refreshReport();
        setCleaning(false);
      }, 1200);
    } catch (err) {
      setCleaning(false);
    }
  };

  if (!report || dismissed) return null;

  const problems: string[] = [];
  if (report.av_detected.length > 0) {
    problems.push(
      lang === "tr"
        ? `Antivirüs algılandı: ${report.av_detected.join(", ")}`
        : `Antivirus detected: ${report.av_detected.join(", ")}`,
    );
  }
  if (report.legacy_services.length > 0 && !cleanSuccess) {
    problems.push(
      lang === "tr"
        ? `Eski DPI servisleri kurulu: ${report.legacy_services.join(", ")}`
        : `Legacy DPI services installed: ${report.legacy_services.join(", ")}`,
    );
  }
  if (!report.windivert_ok) {
    problems.push(
      lang === "tr"
        ? "WinDivert sürücü dosyaları eksik veya bozuk"
        : "WinDivert driver files are missing or corrupted",
    );
  }
  const vpnNote =
    report.vpn_detected.length > 0
      ? lang === "tr"
        ? `VPN/proxy yazılımı çalışıyor: ${report.vpn_detected.join(", ")}`
        : `VPN/proxy software running: ${report.vpn_detected.join(", ")}`
      : null;

  if (problems.length === 0 && !vpnNote) return null;
  const severe = problems.length > 0;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 border-b px-5 py-2.5 text-xs transition-all ${
        severe ? "border-warn/25 bg-warn/10 text-warn" : "border-sky/20 bg-sky/10 text-sky"
      }`}
    >
      {severe ? (
        <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        {problems.map((p, i) => (
          <p key={i} className="leading-relaxed font-medium">
            {p}
          </p>
        ))}
        {vpnNote && <p className="leading-relaxed opacity-90">{vpnNote}</p>}
        <p className="mt-0.5 text-[11px] font-mono opacity-80">{t("settings_compat_desc")}</p>
      </div>

      {/* Aksiyon: Çakışan Servisleri Temizle Butonu */}
      {report.legacy_services.length > 0 && (
        <button
          onClick={handleCleanupLegacy}
          disabled={cleaning || cleanSuccess}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-warn/20 hover:bg-warn/30 text-warn border border-warn/30 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-60"
        >
          {cleaning ? (
            <Loader2 size={12} className="animate-spin" />
          ) : cleanSuccess ? (
            <Check size={12} />
          ) : (
            <Trash2 size={12} />
          )}
          <span>{cleanSuccess ? "Temizlendi" : "Servisleri Temizle"}</span>
        </button>
      )}

      {/* Aksiyon: WinDivert için Yönetici Olarak Yeniden Başlat */}
      {!report.windivert_ok && (
        <button
          onClick={async () => {
            try {
              await api.restartAsAdmin();
            } catch {}
          }}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-alert/20 hover:bg-alert/30 text-alert border border-alert/30 font-bold text-[11px] transition-colors cursor-pointer"
        >
          <ShieldAlert size={12} />
          <span>{lang === "tr" ? "Yönetici Olarak Başlat" : "Restart as Admin"}</span>
        </button>
      )}

      <button
        onClick={() => setDismissed(true)}
        aria-label={t("dialog_cancel")}
        className="shrink-0 rounded-lg p-1 text-current opacity-70 hover:opacity-100 hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
