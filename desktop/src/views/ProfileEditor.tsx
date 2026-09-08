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
      <div className="card p-6 border border-white/[0.08] rounded-2xl bg-surface-card space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h3 className="text-sm font-bold text-paper-bright">
            {readonly ? t("profile_detail") : t("profile_edit")}
          </h3>
          {readonly && (
            <span className="badge badge-muted text-[11px]">
              {t("profile_builtin_badge")}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-name" className="mb-1.5 block text-xs font-semibold text-paper-muted">{t("profile_name")}</label>
            <input
              id="pf-name"
              className="input text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readonly}
            />
          </div>
          <div>
            <label htmlFor="pf-desc" className="mb-1.5 block text-xs font-semibold text-paper-muted">{t("profile_desc")}</label>
            <input
              id="pf-desc"
              className="input text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readonly}
            />
          </div>
        </div>

        {/* Adım zinciri */}
        <div className="pt-2">
          <p className="mb-2 text-xs font-semibold text-paper-muted uppercase tracking-wider">
            {t("profile_steps_chain")}
          </p>
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl bg-surface-subtle/60 border border-white/[0.06] p-3 transition-all"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-live/15 text-live font-mono text-xs font-bold border border-live/25">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-paper-bright">{STEP_LABELS[s.type]}</p>
                  {stepDetail(s) && <p className="font-mono text-xs text-live mt-0.5">{stepDetail(s)}</p>}
                </div>
                {!readonly && (
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Yukarı taşı"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="p-1 rounded-lg text-paper-muted hover:text-paper hover:bg-white/[0.06] disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp size={14} aria-hidden strokeWidth={2} />
                    </button>
                    <button
                      aria-label="Aşağı taşı"
                      disabled={i === steps.length - 1}
                      onClick={() => move(i, 1)}
                      className="p-1 rounded-lg text-paper-muted hover:text-paper hover:bg-white/[0.06] disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown size={14} aria-hidden strokeWidth={2} />
                    </button>
                    <button
                      aria-label="Adımı sil"
                      onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                      className="p-1 rounded-lg text-paper-muted hover:text-alert hover:bg-alert/10 cursor-pointer"
                    >
                      <Trash2 size={14} aria-hidden strokeWidth={2} />
                    </button>
                  </div>
                )}
              </li>
            ))}
            {steps.length === 0 && (
              <li className="py-4 text-center text-xs text-paper-faint">{t("profile_no_steps")}</li>
            )}
          </ol>
        </div>

        {/* Adım ekleme paneli */}
        {!readonly && (
          <div className="rounded-xl border border-dashed border-white/[0.12] bg-surface-subtle/30 p-3.5 space-y-2">
            <p className="text-xs font-semibold text-paper-muted">{t("profile_add_step")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input !w-auto text-xs py-1.5"
                value={newType}
                onChange={(e) => setNewType(e.target.value as StepDto["type"])}
                aria-label={t("profile_step_type")}
              >
                {(Object.keys(STEP_LABELS) as StepDto["type"][]).map((tKey) => (
                  <option key={tKey} value={tKey}>{STEP_LABELS[tKey]}</option>
                ))}
              </select>

              {newType === "fake_ttl" && (
                <label className="flex items-center gap-1.5 text-xs text-paper-muted">
                  <span>TTL:</span>
                  <input
                    type="number"
                    min={2}
                    max={16}
                    value={newTtl}
                    onChange={(e) => setNewTtl(Number(e.target.value))}
                    className="input !w-16 !py-1 text-xs text-center"
                    aria-label="TTL"
                  />
                </label>
              )}

              {newType === "fragment_tls" && (
                <>
                  <select
                    className="input !w-auto text-xs py-1.5"
                    value={newSplit}
                    onChange={(e) => setNewSplit(e.target.value as typeof newSplit)}
                    aria-label={t("profile_split_mode")}
                  >
                    <option value="sni_mid">{t("profile_split_sni_mid")}</option>
                    <option value="sni_mid_reverse">{t("profile_split_sni_mid_reverse")}</option>
                    <option value="fixed">{t("profile_split_fixed")}</option>
                    <option value="reverse">{t("profile_split_reverse")}</option>
                  </select>
                  {newSplit !== "sni_mid" && newSplit !== "sni_mid_reverse" && (
                    <label className="flex items-center gap-1.5 text-xs text-paper-muted">
                      <span>Ofset:</span>
                      <input
                        type="number"
                        min={1}
                        value={newOffset}
                        onChange={(e) => setNewOffset(Number(e.target.value))}
                        className="input !w-16 !py-1 text-xs text-center"
                        aria-label="Ofset"
                      />
                    </label>
                  )}
                </>
              )}

              {newType === "oob" && (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-paper-muted">
                    <span>Offset:</span>
                    <input
                      type="number"
                      min={0}
                      value={newOobOffset}
                      onChange={(e) => setNewOobOffset(Number(e.target.value))}
                      className="input !w-16 !py-1 text-xs text-center"
                      aria-label="OOB Offset"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-paper-muted">
                    <span>Byte:</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={newOobPayload}
                      onChange={(e) => setNewOobPayload(Number(e.target.value))}
                      className="input !w-16 !py-1 text-xs text-center"
                      aria-label="OOB Byte"
                    />
                  </label>
                </>
              )}

              {newType === "window_size" && (
                <label className="flex items-center gap-1.5 text-xs text-paper-muted">
                  <span>Size:</span>
                  <input
                    type="number"
                    min={1}
                    value={newWindowSize}
                    onChange={(e) => setNewWindowSize(Number(e.target.value))}
                    className="input !w-20 !py-1 text-xs text-center"
                    aria-label="Window Size"
                  />
                </label>
              )}

              <button
                className="btn btn-primary text-xs !py-1.5 !px-3"
                onClick={addStep}
              >
                <Plus size={13} aria-hidden strokeWidth={2.5} />
                <span>{t("profile_btn_add")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Eylemler */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
          {!readonly && (
            <button
              className="btn btn-danger text-xs !py-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} aria-hidden strokeWidth={2} />
              <span>{t("profile_btn_delete")}</span>
            </button>
          )}
          {!readonly && (
            <button
              className="btn btn-primary text-xs !py-1.5"
              onClick={() => void save()}
              disabled={busy}
            >
              <Save size={13} aria-hidden strokeWidth={2} />
              <span>{t("profile_btn_save")}</span>
            </button>
          )}
        </div>

        {readonly && (
          <p className="text-xs text-paper-faint italic">
            {t("profile_readonly_hint")}
          </p>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="card rounded-2xl p-6 bg-surface-card border border-alert/40 shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-alert">{t("profile_delete_title")}</h3>
            <p className="mt-2 text-xs text-paper-muted">"{profile.name}" {t("profile_delete_desc")}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="btn btn-secondary text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                <X size={13} aria-hidden strokeWidth={2} />
                <span>{t("dialog_cancel")}</span>
              </button>
              <button
                className="btn btn-danger text-xs"
                onClick={() => void remove()}
                disabled={busy}
              >
                <span>{t("profile_btn_delete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
