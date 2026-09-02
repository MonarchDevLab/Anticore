import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { api, stepDetail, STEP_LABELS, type Profile, type StepDto } from "../lib/tauri";
import { useI18n } from "../lib/i18n";

interface Props {
  profile: Profile;
  onSaved: (p: Profile) => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
}

export default function ProfileEditor({ profile, onSaved, onDeleted, onError }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [steps, setSteps] = useState<StepDto[]>(profile.steps);
  const [newType, setNewType] = useState<StepDto["type"]>("fake_ttl");
  const [newTtl, setNewTtl] = useState(4);
  const [newSplit, setNewSplit] = useState<"sni_mid" | "sni_mid_reverse" | "fixed" | "reverse">("sni_mid");
  const [newOffset, setNewOffset] = useState(1);
  const [newOobOffset, setNewOobOffset] = useState(0);
  const [newOobPayload, setNewOobPayload] = useState(97); // 'a'
  const [newWindowSize, setNewWindowSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readonly = profile.builtin;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  const addStep = () => {
    let s: StepDto;
    if (newType === "fake_ttl") {
      s = { type: "fake_ttl", ttl: Math.min(16, Math.max(2, newTtl)) };
    } else if (newType === "fragment_tls") {
      s = {
        type: "fragment_tls",
        mode: newSplit,
        value: (newSplit === "sni_mid" || newSplit === "sni_mid_reverse") ? null : Math.max(1, newOffset),
      };
    } else if (newType === "oob") {
      s = { type: "oob", offset: newOobOffset, payload: newOobPayload };
    } else if (newType === "window_size") {
      s = { type: "window_size", size: newWindowSize };
    } else {
      s = { type: newType } as StepDto;
    }
    setSteps((prev) => [...prev, s]);
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await api.saveProfile({
        id: profile.builtin ? null : profile.id,
        name,
        description,
        steps,
      });
      onSaved(saved);
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteProfile(profile.id);
      onDeleted(profile.id);
    } catch (e) {
      onError(String(e));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden p-8 bg-black border-[3px] border-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
            {readonly ? t("profile_detail") : t("profile_edit")}
          </h3>
          {readonly && (
            <span className="rounded-none border-2 border-white/20 bg-black px-2.5 py-1 font-mono text-xs font-black uppercase text-white/60">
              {t("profile_builtin_badge")}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-name" className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-white/70">{t("profile_name")}</label>
            <input id="pf-name" className="w-full rounded-none border-2 border-white/20 bg-black px-3 py-1.5 font-mono text-xs text-white focus:border-live shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] focus:outline-none disabled:opacity-40" value={name} onChange={(e) => setName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label htmlFor="pf-desc" className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-white/70">{t("profile_desc")}</label>
            <input id="pf-desc" className="w-full rounded-none border-2 border-white/20 bg-black px-3 py-1.5 font-mono text-xs text-white focus:border-live shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] focus:outline-none disabled:opacity-40" value={description} onChange={(e) => setDescription(e.target.value)} disabled={readonly} />
          </div>
        </div>

        {/* Adım zinciri */}
        <p className="mb-2 mt-5 font-mono text-xs font-black uppercase tracking-wider text-white/60">
          {t("profile_steps_chain")}
        </p>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2 rounded-none bg-black border-2 border-white/10 px-3.5 py-2.5 shadow-[2px_2px_0px_rgba(255,255,255,0.03)] font-mono">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-none bg-live font-mono text-xs font-black text-black shadow-[2px_2px_0px_#fff]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white uppercase tracking-wider">{STEP_LABELS[s.type]}</p>
                {stepDetail(s) && <p className="font-mono text-xs text-live">{stepDetail(s)}</p>}
              </div>
              {!readonly && (
                <>
                  <button aria-label="Yukarı taşı" disabled={i === 0} onClick={() => move(i, -1)}
                    className="cursor-pointer border border-white/20 bg-black p-1 text-white/60 hover:text-white hover:border-white/50 disabled:opacity-20 transition-none">
                    <ArrowUp size={14} aria-hidden strokeWidth={2.5} />
                  </button>
                  <button aria-label="Aşağı taşı" disabled={i === steps.length - 1} onClick={() => move(i, 1)}
                    className="cursor-pointer border border-white/20 bg-black p-1 text-white/60 hover:text-white hover:border-white/50 disabled:opacity-20 transition-none">
                    <ArrowDown size={14} aria-hidden strokeWidth={2.5} />
                  </button>
                  <button aria-label="Adımı sil" onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                    className="cursor-pointer border border-white/20 bg-black p-1 text-alert hover:bg-alert hover:text-black transition-none">
                    <Trash2 size={14} aria-hidden strokeWidth={2.5} />
                  </button>
                </>
              )}
            </li>
          ))}
          {steps.length === 0 && <li className="py-3 text-center font-mono text-xs text-white/40">{t("profile_no_steps")}</li>}
        </ol>

        {/* Adım ekleme */}
        {!readonly && (
          <div className="mt-4 rounded-none border-2 border-dashed border-white/20 bg-black p-4 font-mono">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/60">{t("profile_add_step")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <select className="rounded-none border-2 border-white/20 bg-black px-3 py-1.5 font-mono text-xs text-white focus:border-live focus:outline-none" value={newType}
                onChange={(e) => setNewType(e.target.value as StepDto["type"])} aria-label={t("profile_step_type")}>
                {(Object.keys(STEP_LABELS) as StepDto["type"][]).map((tKey) => (
                  <option key={tKey} value={tKey}>{STEP_LABELS[tKey]}</option>
                ))}
              </select>
              {newType === "fake_ttl" && (
                <label className="flex items-center gap-2 font-mono text-xs text-white/60">
                  TTL
                  <input type="number" min={2} max={16} value={newTtl}
                    onChange={(e) => setNewTtl(Number(e.target.value))} className="w-20 rounded-none border-2 border-white/20 bg-black px-2 py-1 font-mono text-xs text-white focus:border-live focus:outline-none" aria-label="TTL" />
                </label>
              )}
              {newType === "fragment_tls" && (
                <>
                  <select className="rounded-none border-2 border-white/20 bg-black px-3 py-1.5 font-mono text-xs text-white focus:border-live focus:outline-none" value={newSplit}
                    onChange={(e) => setNewSplit(e.target.value as typeof newSplit)} aria-label={t("profile_split_mode")}>
                    <option value="sni_mid">{t("profile_split_sni_mid")}</option>
                    <option value="sni_mid_reverse">{t("profile_split_sni_mid_reverse")}</option>
                    <option value="fixed">{t("profile_split_fixed")}</option>
                    <option value="reverse">{t("profile_split_reverse")}</option>
                  </select>
                  {newSplit !== "sni_mid" && newSplit !== "sni_mid_reverse" && (
                    <label className="flex items-center gap-2 font-mono text-xs text-white/60">
                      Ofset
                      <input type="number" min={1} value={newOffset}
                        onChange={(e) => setNewOffset(Number(e.target.value))} className="w-20 rounded-none border-2 border-white/20 bg-black px-2 py-1 font-mono text-xs text-white focus:border-live focus:outline-none" aria-label="Ofset" />
                    </label>
                  )}
                </>
              )}
              {newType === "oob" && (
                <>
                  <label className="flex items-center gap-2 font-mono text-xs text-white/60">
                    Offset
                    <input type="number" min={0} value={newOobOffset}
                      onChange={(e) => setNewOobOffset(Number(e.target.value))} className="w-20 rounded-none border-2 border-white/20 bg-black px-2 py-1 font-mono text-xs text-white focus:border-live focus:outline-none" aria-label="OOB Offset" />
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs text-white/60">
                    Byte (Dec)
                    <input type="number" min={0} max={255} value={newOobPayload}
                      onChange={(e) => setNewOobPayload(Number(e.target.value))} className="w-20 rounded-none border-2 border-white/20 bg-black px-2 py-1 font-mono text-xs text-white focus:border-live focus:outline-none" aria-label="OOB Byte" />
                  </label>
                </>
              )}
              {newType === "window_size" && (
                <label className="flex items-center gap-2 font-mono text-xs text-white/60">
                  Size
                  <input type="number" min={1} value={newWindowSize}
                    onChange={(e) => setNewWindowSize(Number(e.target.value))} className="w-24 rounded-none border-2 border-white/20 bg-black px-2 py-1 font-mono text-xs text-white focus:border-live focus:outline-none" aria-label="Window Size" />
                </label>
              )}
              <button
                className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none px-3 py-1.5 transition-none flex items-center gap-1.5 hover:bg-live/90"
                onClick={addStep}
              >
                <Plus size={13} aria-hidden strokeWidth={3} />
                {t("profile_btn_add")}
              </button>
            </div>
          </div>
        )}

        {/* Eylemler */}
        <div className="mt-6 flex justify-end gap-3">
          {!readonly && (
            <button
              className="btn rounded-none border-2 border-alert bg-alert/20 text-alert hover:bg-alert hover:text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_rgba(255,51,102,0.3)] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} aria-hidden strokeWidth={2.5} />
              {t("profile_btn_delete")}
            </button>
          )}
          {!readonly && (
            <button
              className="btn rounded-none border-2 border-live bg-live text-black font-mono font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] active:translate-y-0.5 active:shadow-none px-4 py-2 transition-none flex items-center gap-1.5 hover:bg-live/90"
              onClick={() => void save()}
              disabled={busy}
            >
              <Save size={14} aria-hidden strokeWidth={2.5} />
              {t("profile_btn_save")}
            </button>
          )}
        </div>
        {readonly && (
          <p className="mt-3 font-mono text-xs text-white/50">
            {t("profile_readonly_hint")}
          </p>
        )}
      </div>

      {confirmDelete && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6" onClick={() => setConfirmDelete(false)}>
          <div className="relative overflow-hidden p-6 bg-black border-[3px] border-alert shadow-[8px_8px_0px_#fff] w-full max-w-sm font-mono" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase tracking-wider text-alert">{t("profile_delete_title")}</h3>
            <p className="mt-2 text-xs text-white/70">"{profile.name}" {t("profile_delete_desc")}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="btn rounded-none border-2 border-white/30 bg-black text-white hover:border-white/70 font-mono font-bold uppercase text-xs px-3 py-1.5 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-none transition-none flex items-center gap-1"
                onClick={() => setConfirmDelete(false)}
              >
                <X size={14} aria-hidden strokeWidth={2.5} />
                {t("dialog_cancel")}
              </button>
              <button
                className="btn rounded-none border-2 border-alert bg-alert text-black font-mono font-black uppercase text-xs px-3 py-1.5 shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none transition-none flex items-center gap-1"
                onClick={() => void remove()}
                disabled={busy}
              >
                {t("profile_btn_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
