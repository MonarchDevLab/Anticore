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
  { id: "dev", name: "Geliştirici & Platform Araçları", domains: ["openai.com", "chatgpt.com", "anthropic.com", "claude.ai", "github.com"] },
];

const PACKS_EN = [
  { id: "discord", name: "Discord Pack", domains: ["discord.com", "gateway.discord.gg", "cdn.discordapp.com", "discordapp.com", "discord.gg"] },
  { id: "roblox", name: "Roblox Pack", domains: ["roblox.com", "rbxcdn.com", "roblox.cn"] },
  { id: "social", name: "Social Media", domains: ["instagram.com", "cdninstagram.com", "threads.net", "twitter.com", "x.com"] },
  { id: "dev", name: "Developer & Platform Tools", domains: ["openai.com", "chatgpt.com", "anthropic.com", "claude.ai", "github.com"] },
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
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {/* İlerleme Göstergesi */}
      <div className="flex items-center justify-between gap-3 px-1">
        {[1, 2, 3, 4].map((i) => {
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-live text-void border-live shadow-md scale-105"
                    : isDone
                    ? "bg-live/15 text-live border-live/30"
                    : "bg-surface-subtle text-paper-faint border-white/[0.08]"
                }`}
              >
                {isDone ? <CheckCircle2 size={15} strokeWidth={2.5} /> : i}
              </div>
              {i < 4 && (
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    isDone ? "bg-live" : "bg-white/[0.08]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Adım 1: Hoş Geldiniz */}
      {step === 1 && (
        <section className="card p-6 sm:p-8 border border-white/[0.08] rounded-2xl bg-surface-card space-y-6 shadow-2xl">
          <div className="flex items-center gap-3.5 border-b border-white/[0.08] pb-4">
            <div className="p-3 rounded-2xl bg-live/15 text-live border border-live/30">
              <Sparkles size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("wiz_step_1_title")}</h2>
              <p className="text-xs text-paper-muted mt-0.5">{t("wiz_step_1_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="card-subtle p-4 space-y-2 rounded-xl border border-white/[0.06]">
              <div className="p-2 rounded-lg bg-live/10 text-live w-fit">
                <Zap size={18} strokeWidth={2} />
              </div>
              <h4 className="text-xs font-bold text-paper-bright">{t("wiz_feature_speed_title")}</h4>
              <p className="text-xs text-paper-muted leading-relaxed">{t("wiz_feature_speed_desc")}</p>
            </div>
            <div className="card-subtle p-4 space-y-2 rounded-xl border border-white/[0.06]">
              <div className="p-2 rounded-lg bg-cyan/10 text-cyan w-fit">
                <Layers size={18} strokeWidth={2} />
              </div>
              <h4 className="text-xs font-bold text-paper-bright">{t("wiz_feature_engine_title")}</h4>
              <p className="text-xs text-paper-muted leading-relaxed">{t("wiz_feature_engine_desc")}</p>
            </div>
            <div className="card-subtle p-4 space-y-2 rounded-xl border border-white/[0.06]">
              <div className="p-2 rounded-lg bg-live/10 text-live w-fit">
                <ShieldCheck size={18} strokeWidth={2} />
              </div>
              <h4 className="text-xs font-bold text-paper-bright">{t("wiz_feature_privacy_title")}</h4>
              <p className="text-xs text-paper-muted leading-relaxed">{t("wiz_feature_privacy_desc")}</p>
            </div>
          </div>
        </section>
      )}

      {/* Adım 2: ISP Seçimi */}
      {step === 2 && (
        <section className="card p-6 sm:p-8 border border-white/[0.08] rounded-2xl bg-surface-card space-y-5 shadow-2xl">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("wiz_step_2_title")}</h2>
            <p className="text-xs text-paper-muted mt-0.5">{t("wiz_step_2_desc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {ISP_LIST.map((isp) => {
              const active = selectedIsp === isp.id;
              return (
                <button
                  key={isp.id}
                  type="button"
                  onClick={() => setSelectedIsp(isp.id)}
                  className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                    active
                      ? "bg-live/15 border-live/40 text-paper-bright shadow-sm"
                      : "bg-surface-subtle/50 border-white/[0.06] text-paper-muted hover:border-white/[0.14] hover:text-paper"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${active ? "text-live" : "text-paper-bright"}`}>
                      {isp.name}
                    </span>
                    {active && <CheckCircle2 size={16} className="text-live" strokeWidth={2.5} />}
                  </div>
                  <p className="mt-1 text-[11px] leading-normal text-paper-muted">{isp.desc}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Adım 3: Hedef Paketleri */}
      {step === 3 && (
        <section className="card p-6 sm:p-8 border border-white/[0.08] rounded-2xl bg-surface-card space-y-5 shadow-2xl">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("wiz_step_3_title")}</h2>
            <p className="text-xs text-paper-muted mt-0.5">{t("wiz_step_3_desc")}</p>
          </div>

          <div className="space-y-2.5">
            {PACKS.map((pack) => {
              const checked = selectedPacks.includes(pack.id);
              return (
                <label
                  key={pack.id}
                  className={`flex items-start gap-3 rounded-xl p-3.5 border cursor-pointer transition-all ${
                    checked
                      ? "bg-live/10 border-live/30 text-paper-bright"
                      : "bg-surface-subtle/50 border-white/[0.06] text-paper-muted hover:border-white/[0.14]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePack(pack.id)}
                    className="mt-1 w-4 h-4 accent-live rounded"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-paper-bright">{pack.name}</div>
                    <div className="text-[11px] text-paper-muted mt-0.5 font-mono">
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
        <section className="card p-6 sm:p-8 border border-white/[0.08] rounded-2xl bg-surface-card space-y-5 shadow-2xl">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("wiz_step_4_title")}</h2>
            <p className="text-xs text-paper-muted mt-0.5">{t("wiz_step_4_desc")}</p>
          </div>

          <div className="space-y-3">
            <label
              className={`flex items-start gap-3.5 rounded-xl p-4 border cursor-pointer transition-all ${
                applyDns
                  ? "bg-live/10 border-live/30 text-paper-bright"
                  : "bg-surface-subtle/50 border-white/[0.06] text-paper-muted"
              }`}
            >
              <input
                type="checkbox"
                checked={applyDns}
                onChange={(e) => setApplyDns(e.target.checked)}
                className="mt-1 w-4 h-4 accent-live rounded"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-live" strokeWidth={2} />
                  <span className="text-xs font-bold text-paper-bright">
                    {t("wiz_dns_checkbox_title")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-paper-muted leading-relaxed">
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
              className="btn btn-secondary text-xs"
              onClick={() => setStep((s) => s - 1)}
              disabled={busy}
            >
              <ChevronLeft size={15} strokeWidth={2} />
              <span>{t("wiz_back")}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost text-xs text-paper-faint hover:text-paper"
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
              className="btn btn-primary text-xs"
              onClick={() => setStep((s) => s + 1)}
            >
              <span>{t("wiz_next")}</span>
              <ChevronRight size={15} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={handleFinish}
              disabled={busy}
            >
              <ShieldCheck size={16} strokeWidth={2} />
              <span>{t("wiz_finish")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
