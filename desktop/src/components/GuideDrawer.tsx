import { useEffect } from "react";
import { X, HelpCircle, Shield, Zap, Sliders, ArrowRightLeft } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GuideDrawer({ open, onClose }: Props) {
  const { lang } = useI18n();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
      if (e.key === "F1") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const FAQ = lang === "tr" ? [
    {
      icon: <Shield className="text-live" size={16} />,
      q: "Anticore tam olarak ne yapar?",
      a: "Sitelere bağlanırken ilk 'el sıkışma' (TLS ClientHello) paketi, sağlayıcının denetim cihazı (DPI) tarafından okunup engellenir. Anticore bu ilk paketi parçalayıp sahte paket enjekte ederek sansür donanımını yanıltır; gerisi doğrudan akar.",
    },
    {
      icon: <Zap className="text-cyan" size={16} />,
      q: "Neden hız kaybı ve ping artışı sıfırdır?",
      a: "Anticore bir VPN veya proxy değildir. Sadece bağlantının ilk milisaniyesindeki el sıkışma paketine dokunulur. İndirme ve yükleme akışları (video, oyun, dosya) doğrudan hedef sunucuyla konuşur; sıfır bant genişliği kaybı yaşanır.",
    },
    {
      icon: <Sliders className="text-warn" size={16} />,
      q: "Hangi profili seçmeliyim?",
      a: "Profil, sağlayıcınızın (Superonline, Türk Telekom vb.) DPI davranışına göre optimize edilmiş taktik dizisidir. Sağlayıcınızı biliyorsanız doğrudan onu seçin. Bilmiyorsanız Test Merkezi'nde otomatik tarama yapabilirsiniz.",
    },
    {
      icon: <ArrowRightLeft className="text-paper-muted" size={16} />,
      q: "Passthrough (Doğrudan Akış) ne demek?",
      a: "Hedef listeniz dışındaki genel internet trafiğinin motordan hiç dokunulmadan, sıfır işlem gecikmesiyle geçtiğini gösterir. Bu sayının hızla artması motorun yalnızca gerektiğinde devreye girdiğini kanıtlar.",
    },
  ] : [
    {
      icon: <Shield className="text-live" size={16} />,
      q: "What exactly does Anticore do?",
      a: "When connecting to restricted destinations, the initial TLS handshake packet is inspected and dropped by ISP DPI hardware. Anticore fragments this first packet and injects deception headers to bypass inspection; the rest of the stream flows normally.",
    },
    {
      icon: <Zap className="text-cyan" size={16} />,
      q: "Why is there zero speed loss or ping spike?",
      a: "Anticore is not a VPN or tunnel. It touches only the first handshake packet. All heavy payload (videos, gaming, downloads) connects directly to destination servers with zero bandwidth penalty.",
    },
    {
      icon: <Sliders className="text-warn" size={16} />,
      q: "Which profile should I choose?",
      a: "A profile is a tailored sequence of packet tactics matched to your ISP's DPI hardware. Select your provider directly, or run automated auto-discovery in the Test Center tab.",
    },
    {
      icon: <ArrowRightLeft className="text-paper-muted" size={16} />,
      q: "What does Passthrough mean?",
      a: "It shows how many packets outside your protected target list passed through untouched with zero inspection overhead. A fast-rising counter confirms optimal surgical behavior.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md h-full bg-surface-card border-l border-border-brutal p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-6">
          {/* Başlık */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-live/10 text-live border border-live/20">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-paper-bright tracking-tight">
                  {lang === "tr" ? "KULLANIM REHBERİ" : "USER GUIDE"}
                </h3>
                <p className="text-[11px] text-paper-muted font-mono">
                  ANTICORE // KNOWLEDGE BASE
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-paper-muted hover:text-paper-bright hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Soru-Cevap Listesi */}
          <div className="space-y-4">
            {FAQ.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-surface-subtle border border-white/[0.06] space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-paper-bright">
                  {item.icon}
                  <h4>{item.q}</h4>
                </div>
                <p className="text-xs text-paper-muted leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="pt-6 border-t border-white/[0.08] text-center text-[11px] text-paper-faint font-mono">
          <span>ESC veya F1 ile kapatabilirsiniz</span>
        </div>
      </div>
    </div>
  );
}
