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
      if (selectId) {
        setSelectedId(selectId);
      } else if (ps.length > 0) {
        setSelectedId((prev) => (prev && ps.some((p) => p.id === prev) ? prev : ps[0].id));
      }
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-paper-bright">{t("profiles_title")}</h2>
          <p className="mt-0.5 text-xs text-paper-muted">{t("profiles_desc")}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            className="btn btn-secondary text-xs !py-1.5"
            onClick={() => void doImport()}
          >
            <Upload size={14} aria-hidden strokeWidth={2} />
            <span>{t("profiles_import_btn")}</span>
          </button>
          <button
            className="btn btn-secondary text-xs !py-1.5"
            onClick={() => void doExport()}
          >
            <Download size={14} aria-hidden strokeWidth={2} />
            <span>{t("profiles_export_btn")}</span>
          </button>
          <button
            className="btn btn-primary text-xs !py-1.5"
            onClick={() => void createBlank()}
          >
            <Plus size={14} aria-hidden strokeWidth={2.5} />
            <span>{t("profiles_new_btn")}</span>
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
        <p role="alert" className="rounded-xl bg-alert/10 border border-alert/25 px-4 py-2.5 text-xs text-alert font-semibold">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
        {/* Profil Listesi */}
        <section className="card p-3 max-h-[32rem] overflow-y-auto space-y-1.5" aria-label="Profil listesi">
          {profiles.length === 0 && (
            <EmptyState icon={<Layers size={28} aria-hidden />} title={t("profiles_none_title")} hint="" />
          )}
          <ul className="space-y-1.5">
            {profiles.map((p) => {
              const active = selectedId === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full cursor-pointer rounded-xl p-3 text-left transition-all border ${
                      active
                        ? "bg-live/10 border-live/30 text-paper-bright shadow-sm"
                        : "border-white/[0.06] bg-surface-subtle/50 text-paper-muted hover:border-white/[0.14] hover:text-paper"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${active ? "text-live" : "text-paper-bright"}`}>
                        {p.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          active
                            ? "border-live/30 bg-live/20 text-live"
                            : p.builtin
                            ? "border-white/[0.08] text-paper-faint bg-white/[0.02]"
                            : "border-live/25 bg-live/10 text-live"
                        }`}
                      >
                        {p.builtin ? t("profiles_template_badge") : t("profiles_custom_badge")}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] line-clamp-1 text-paper-muted">{p.description}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Detay / Editör Alanı */}
        <section aria-label="Profil detayı">
          {selected ? (
            <div className="space-y-3">
              {selected.builtin && (
                <button
                  className="btn btn-secondary text-xs !py-1.5"
                  onClick={() => void createCopy(selected)}
                >
                  <Copy size={13} aria-hidden strokeWidth={2} />
                  <span>{t("profiles_copy_btn")}</span>
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
            <div className="card p-10 grid h-full place-items-center">
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
