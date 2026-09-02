import { useEffect, useState } from "react";
import { Copy, Download, Layers, Plus, Upload } from "lucide-react";
import { api, type Profile } from "../lib/tauri";
import { useI18n } from "../lib/i18n";
import EmptyState from "../components/EmptyState";
import ProfileEditor from "./ProfileEditor";
import Guide from "../components/Guide";

export default function Profiles() {
  const { t, lang } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = (selectId?: string) =>
    void api.listProfiles().then((ps) => {
      setProfiles(ps);
      if (selectId) setSelectedId(selectId);
    });
  useEffect(() => {
    refresh();
  }, []);

  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  const createCopy = async (src: Profile) => {
    try {
      const saved = await api.saveProfile({
        id: null,
        name: `${src.name} ${t("profile_copy_suffix")}`,
        description: src.description,
        steps: src.steps,
      });
      refresh(saved.id);
    } catch (e) {
      setError(String(e));
    }
  };

  const createBlank = async () => {
    try {
      const saved = await api.saveProfile({
        id: null,
        name: t("profile_default_name"),
        description: "",
        steps: [{ type: "fragment_tls", mode: "sni_mid", value: null }],
      });
      refresh(saved.id);
    } catch (e) {
      setError(String(e));
    }
  };

  const doExport = async () => {
    setError(null);
    try {
      await api.exportProfilesToFile();
    } catch (e) {
      setError(String(e));
    }
  };

  const doImport = async () => {
    setError(null);
    try {
      const count = await api.importProfilesFromFile();
      if (count > 0) refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-end justify-between border-b-2 border-white/20 pb-4">
        <div>
          <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-white">{t("profiles_title")}</h2>
          <p className="mt-1 text-xs font-mono text-white/60">{t("profiles_desc")}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-1.5"
            onClick={() => void doImport()}
          >
            <Upload size={14} aria-hidden strokeWidth={2.5} />
            {t("profiles_import_btn")}
          </button>
          <button
            className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-1.5"
            onClick={() => void doExport()}
          >
            <Download size={14} aria-hidden strokeWidth={2.5} />
            {t("profiles_export_btn")}
          </button>
          <button
            className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-3.5 py-1.5 transition-none flex items-center gap-1.5 hover:bg-live/90"
            onClick={() => void createBlank()}
          >
            <Plus size={14} aria-hidden strokeWidth={3} />
            {t("profiles_new_btn")}
          </button>
        </div>
      </header>

      <Guide
        title={lang === "tr" ? "Profiller ve Strateji Sırası" : "Profiles and Step Order"}
        items={
          lang === "tr"
            ? [
                {
                  q: "Profil ne demek?",
                  a: "İnternet sağlayıcınızın DPI donanımına (Türk Telekom, Superonline vb.) özel test edilmiş bypass adım kombinasyonudur.",
                },
                {
                  q: "Adım sırası neden önemlidir?",
                  a: "Adımlar yukarıdan aşağıya doğru icra edilir: önce sahte yanıltma paketleri gönderilir, ardından gerçek paket güvenli noktasından parçalanır.",
                },
              ]
            : [
                {
                  q: "What is a profile?",
                  a: "A combination of bypass steps tested and tuned for your ISP's specific DPI hardware (Türk Telekom, Superonline, etc.).",
                },
                {
                  q: "Why does step order matter?",
                  a: "Steps execute top to bottom: fake decoy packets are sent first, then the real packet is split at a safe point.",
                },
              ]
        }
      />

      {error && (
        <p role="alert" className="rounded-none bg-black border-2 border-alert px-4 py-2 font-mono text-xs text-alert font-bold uppercase">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* Liste */}
        <section className="relative overflow-hidden p-4 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] max-h-[32rem] overflow-y-auto" aria-label="Profil listesi">
          {profiles.length === 0 && (
            <EmptyState icon={<Layers size={28} aria-hidden />} title={t("profiles_none_title")} hint="" />
          )}
          <ul className="space-y-2 font-mono">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  aria-current={selectedId === p.id ? "true" : undefined}
                  className={`w-full cursor-pointer rounded-none p-3 text-left transition-none border-2 active:translate-y-0.5 active:shadow-none ${
                    selectedId === p.id
                      ? "bg-live border-live text-black shadow-[3px_3px_0px_#fff]"
                      : "border-white/10 bg-black text-white/60 hover:border-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-black uppercase tracking-wider ${selectedId === p.id ? "text-black" : "text-white"}`}>{p.name}</span>
                    <span
                      className={`rounded-none px-2 py-0.5 font-mono text-[9px] font-black uppercase border ${
                        selectedId === p.id
                          ? "border-black bg-black text-white"
                          : p.builtin
                          ? "border-white/20 text-white/60 bg-black"
                          : "border-live bg-live/20 text-live"
                      }`}
                    >
                      {p.builtin ? t("profiles_template_badge") : t("profiles_custom_badge")}
                    </span>
                  </div>
                  <p className={`mt-1 text-[11px] line-clamp-1 ${selectedId === p.id ? "text-black/80 font-medium" : "text-white/50"}`}>{p.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Detay/editör */}
        <section aria-label="Profil detayı">
          {selected ? (
            <div className="space-y-3">
              {selected.builtin && (
                <button
                  className="btn rounded-none border-2 border-white/30 bg-black hover:border-white/70 text-white font-mono font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-1.5"
                  onClick={() => void createCopy(selected)}
                >
                  <Copy size={14} aria-hidden strokeWidth={2.5} />
                  {t("profiles_copy_btn")}
                </button>
              )}
              <ProfileEditor
                key={selected.id}
                profile={selected}
                onSaved={(p) => {
                  setError(null);
                  refresh(p.id);
                }}
                onDeleted={() => {
                  setSelectedId(null);
                  refresh();
                }}
                onError={setError}
              />
            </div>
          ) : (
            <div className="relative overflow-hidden p-10 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)] grid h-full place-items-center">
              <EmptyState
                icon={<Layers size={32} aria-hidden />}
                title={t("profiles_unselected_title")}
                hint={t("profiles_unselected_hint")}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
