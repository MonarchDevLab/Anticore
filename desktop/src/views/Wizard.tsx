import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Wifi,
  Zap,
} from "lucide-react";
import { api } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

interface Props {
  onComplete: () => void;
  pushLog: (l: string) => void;
}

const ISP_LIST_TR = [
  { id: "turk_telekom", name: "Türk Telekom", desc: "TTL sahtesi + 1-bayt sabit parçalama" },
  { id: "superonline", name: "Turkcell Superonline", desc: "Ters SNI parçalama + sahte checksum" },
  { id: "kablonet", name: "Kablonet (Türksat)", desc: "Düşük TTL sahte paket + SNI parçalama" },
  { id: "turknet", name: "TurkNet", desc: "Hafif denetim, SNI orta parçalama" },
  { id: "vodafone", name: "Vodafone", desc: "Sabit parçalama + sahte paket" },
  { id: "turkcell", name: "Turkcell (Mobil / Superbox)", desc: "SNI parçalama + Harf karışımı" },
  { id: "universal", name: "Diğer / Evrensel", desc: "Güvenli varsayılan SNI parçalama" },
];

const ISP_LIST_EN = [
  { id: "turk_telekom", name: "Türk Telekom", desc: "Fake TTL + 1-byte fixed split" },
  { id: "superonline", name: "Turkcell Superonline", desc: "Reversed SNI split + fake checksum" },
  { id: "kablonet", name: "Kablonet (Türksat)", desc: "Low-TTL fake packet + SNI split" },
  { id: "turknet", name: "TurkNet", desc: "Light inspection, mid-SNI split" },
  { id: "vodafone", name: "Vodafone", desc: "Fixed split + fake packet" },
  { id: "turkcell", name: "Turkcell (Mobile / Superbox)", desc: "SNI split + letter-case mixing" },
  { id: "universal", name: "Other / Universal", desc: "Safe default SNI split" },
];

const PACKS_TR = [
  { id: "discord", name: "Discord Paketi", domains: ["discord.com", "gateway.discord.gg", "cdn.discordapp.com", "discordapp.com", "discord.gg"] },
  { id: "roblox", name: "Roblox Paketi", domains: ["roblox.com", "rbxcdn.com", "roblox.cn"] },
  { id: "social", name: "Sosyal Medya", domains: ["instagram.com", "cdninstagram.com", "threads.net", "twitter.com", "x.com"] },
  { id: "dev", name: "Geliştirici & API Araçları", domains: ["openai.com", "chatgpt.com", "anthropic.com", "claude.ai", "github.com"] },
];

const PACKS_EN = [
  { id: "discord", name: "Discord Pack", domains: ["discord.com", "gateway.discord.gg", "cdn.discordapp.com", "discordapp.com", "discord.gg"] },
  { id: "roblox", name: "Roblox Pack", domains: ["roblox.com", "rbxcdn.com", "roblox.cn"] },
  { id: "social", name: "Social Media", domains: ["instagram.com", "cdninstagram.com", "threads.net", "twitter.com", "x.com"] },
  { id: "dev", name: "Developer & API Tools", domains: ["openai.com", "chatgpt.com", "anthropic.com", "claude.ai", "github.com"] },
];

export default function Wizard({ onComplete, pushLog }: Props) {
  const { t, lang } = useI18n();
  const ISP_LIST = lang === "tr" ? ISP_LIST_TR : ISP_LIST_EN;
  const PACKS = lang === "tr" ? PACKS_TR : PACKS_EN;
  const [step, setStep] = useState(1);
  const [selectedIsp, setSelectedIsp] = useState("universal");
  const [selectedPacks, setSelectedPacks] = useState<string[]>(["discord", "roblox"]);
  const [applyDns, setApplyDns] = useState(true);
  const [busy, setBusy] = useState(false);

  const togglePack = (packId: string) => {
    setSelectedPacks((prev) =>
      prev.includes(packId) ? prev.filter((p) => p !== packId) : [...prev, packId]
    );
  };

  const handleFinish = async () => {
    setBusy(true);
    try {
      pushLog("[*] Sihirbaz ayarları uygulanıyor...");

      // 1) Domain paketlerini ekle
      const domainsToAdd = new Set<string>();
      PACKS.filter((p) => selectedPacks.includes(p.id)).forEach((p) => {
        p.domains.forEach((d) => domainsToAdd.add(d));
      });
      for (const domain of domainsToAdd) {
        await api.addSite(domain).catch(() => {});
      }
      pushLog(`[+] ${domainsToAdd.size} hedef alan adı listeye kaydedildi.`);

      // 2) DNS uygula
      if (applyDns) {
        await api.applySecureDns().catch((e) => pushLog(`[!] DNS uyarısı: ${String(e)}`));
        await api.applyDohRegistry().catch(() => {});
      }

      // 3) Motoru başlat
      await api.startEngine(selectedIsp).catch((e) => {
        pushLog(`[!] Motor başlatma uyarısı: ${String(e)}`);
      });

      localStorage.setItem("anticore_onboarded", "true");
      pushLog("[+] Anticore kurulumu başarıyla tamamlandı!");
      onComplete();
    } catch (e) {
      pushLog(`[!] Sihirbaz tamamlama hatası: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6 font-mono">
      {/* İlerleme Çubuğu */}
      <div className="flex items-center justify-between gap-3 px-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-none text-xs font-black uppercase transition-none border-2 ${
                step === i
                  ? "bg-live text-black border-live shadow-[2px_2px_0px_#fff]"
                  : step > i
                  ? "bg-black text-live border-live"
                  : "bg-black text-white/40 border-white/20"
              }`}
            >
              {step > i ? <CheckCircle2 size={16} strokeWidth={3} /> : i}
            </div>
            {i < 4 && (
              <div
                className={`h-1 flex-1 rounded-none transition-none ${
                  step > i ? "bg-live" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Adım 1: Hoş Geldiniz */}
      {step === 1 && (
        <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="rounded-none bg-live p-2.5 text-black border-2 border-live shadow-[2px_2px_0px_#fff]">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-mono text-xl font-black uppercase tracking-widest text-white">{t("wiz_step_1_title")}</h2>
              <p className="text-xs text-white/60 mt-0.5">{t("wiz_step_1_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="rounded-none bg-black border-2 border-white/10 p-4 space-y-2 shadow-[2px_2px_0px_rgba(255,255,255,0.03)]">
              <Zap size={18} className="text-live" strokeWidth={2.5} />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">{t("wiz_feature_speed_title")}</h4>
              <p className="text-xs text-white/70 leading-relaxed">{t("wiz_feature_speed_desc")}</p>
            </div>
            <div className="rounded-none bg-black border-2 border-white/10 p-4 space-y-2 shadow-[2px_2px_0px_rgba(255,255,255,0.03)]">
              <Layers size={18} className="text-cyan" strokeWidth={2.5} />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">{t("wiz_feature_engine_title")}</h4>
              <p className="text-xs text-white/70 leading-relaxed">{t("wiz_feature_engine_desc")}</p>
            </div>
            <div className="rounded-none bg-black border-2 border-white/10 p-4 space-y-2 shadow-[2px_2px_0px_rgba(255,255,255,0.03)]">
              <ShieldCheck size={18} className="text-live" strokeWidth={2.5} />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">{t("wiz_feature_privacy_title")}</h4>
              <p className="text-xs text-white/70 leading-relaxed">{t("wiz_feature_privacy_desc")}</p>
            </div>
          </div>
        </section>
      )}

      {/* Adım 2: ISP Seçimi */}
      {step === 2 && (
        <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h2 className="font-mono text-xl font-black uppercase tracking-widest text-white">{t("wiz_step_2_title")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("wiz_step_2_desc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {ISP_LIST.map((isp) => (
              <button
                key={isp.id}
                type="button"
                onClick={() => setSelectedIsp(isp.id)}
                className={`text-left rounded-none p-3.5 border-2 transition-none active:translate-y-0.5 active:shadow-none ${
                  selectedIsp === isp.id
                    ? "bg-live border-live text-black shadow-[3px_3px_0px_#fff]"
                    : "bg-black border-white/10 text-white/60 hover:border-white/40 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase tracking-wider ${selectedIsp === isp.id ? "text-black" : "text-white"}`}>{isp.name}</span>
                  {selectedIsp === isp.id && <CheckCircle2 size={16} className="text-black" strokeWidth={3} />}
                </div>
                <p className={`mt-1 text-[11px] leading-normal ${selectedIsp === isp.id ? "text-black/80 font-medium" : "text-white/50"}`}>{isp.desc}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Adım 3: Hedef Paketleri */}
      {step === 3 && (
        <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h2 className="font-mono text-xl font-black uppercase tracking-widest text-white">{t("wiz_step_3_title")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("wiz_step_3_desc")}</p>
          </div>

          <div className="space-y-3">
            {PACKS.map((pack) => {
              const checked = selectedPacks.includes(pack.id);
              return (
                <label
                  key={pack.id}
                  className={`flex items-start gap-3 rounded-none p-3.5 border-2 cursor-pointer transition-none ${
                    checked
                      ? "bg-live/10 border-live text-white shadow-[2px_2px_0px_rgba(34,197,94,0.2)]"
                      : "bg-black border-white/10 text-white/50 hover:border-white/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePack(pack.id)}
                    className="mt-1 rounded-none border-2 border-white/30 bg-black text-live focus:ring-0"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-white">{pack.name}</div>
                    <div className="text-[11px] text-white/50 mt-1 font-mono">
                      {pack.domains.join(", ")}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Adım 4: Güvenli DNS & Tamamla */}
      {step === 4 && (
        <section className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h2 className="font-mono text-xl font-black uppercase tracking-widest text-white">{t("wiz_step_4_title")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("wiz_step_4_desc")}</p>
          </div>

          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 rounded-none p-4 border-2 cursor-pointer transition-none ${
                applyDns
                  ? "bg-live/10 border-live text-white shadow-[2px_2px_0px_rgba(34,197,94,0.2)]"
                  : "bg-black border-white/10 text-white/50"
              }`}
            >
              <input
                type="checkbox"
                checked={applyDns}
                onChange={(e) => setApplyDns(e.target.checked)}
                className="mt-1 rounded-none border-2 border-white/30 bg-black text-live focus:ring-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-cyan" strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    {t("wiz_dns_checkbox_title")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  {t("wiz_dns_checkbox_desc")}
                </p>
              </div>
            </label>
          </div>
        </section>
      )}

      {/* Alt Butonlar */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 1 ? (
            <button
              type="button"
              className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5"
              onClick={() => setStep((s) => s - 1)}
              disabled={busy}
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
              {t("wiz_back")}
            </button>
          ) : (
            <button
              type="button"
              className="btn rounded-none border-2 border-white/10 bg-black hover:border-white/40 text-white/50 hover:text-white font-mono font-bold uppercase text-xs tracking-wider px-4 py-2 transition-none"
              onClick={() => {
                localStorage.setItem("anticore_onboarded", "true");
                onComplete();
              }}
            >
              {t("wiz_skip")}
            </button>
          )}
        </div>

        <div>
          {step < 4 ? (
            <button
              type="button"
              className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-5 py-2 transition-none flex items-center gap-1.5 hover:bg-live/90"
              onClick={() => setStep((s) => s + 1)}
            >
              {t("wiz_next")}
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-6 py-2 transition-none flex items-center gap-2 hover:bg-live/90"
              onClick={handleFinish}
              disabled={busy}
            >
              <ShieldCheck size={16} strokeWidth={2.5} />
              {t("wiz_finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
