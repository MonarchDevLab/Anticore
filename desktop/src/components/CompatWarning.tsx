import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { api, type CompatReport } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

/**
 * Açılışta sessizce bir uyumluluk taraması çalıştırır ve çakışabilecek
 * AV/eski servis/sürücü sorunu bulunursa üstbarın altında bir uyarı
 * şeridi gösterir. Kullanıcı kapatabilir (bu oturum için); bir sonraki
 * açılışta tekrar taranır — kalıcı olarak bastırılmaz, çünkü durum
 * (AV kaldırıldı mı, WinDivert bozuldu mu) her açılışta değişebilir.
 */
export default function CompatWarning() {
  const { t, lang } = useI18n();
  const [report, setReport] = useState<CompatReport | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    void api.checkCompatibility().then(setReport).catch(() => {});
  }, []);

  if (!report || dismissed) return null;

  const problems: string[] = [];
  if (report.av_detected.length > 0) {
    problems.push(
      lang === "tr"
        ? `Antivirüs algılandı: ${report.av_detected.join(", ")}`
        : `Antivirus detected: ${report.av_detected.join(", ")}`,
    );
  }
  if (report.legacy_services.length > 0) {
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
      className={`flex items-start gap-3 border-b px-5 py-2.5 text-xs ${
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
          <p key={i} className="leading-relaxed">
            {p}
          </p>
        ))}
        {vpnNote && <p className="leading-relaxed opacity-90">{vpnNote}</p>}
        <p className="mt-1 text-xs font-mono opacity-80">{t("settings_compat_desc")}</p>
      </div>
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
