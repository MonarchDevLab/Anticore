import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface GuideItem {
  q: string;
  a: string;
}

interface Props {
  title?: string;
  items: GuideItem[];
}

/** Açılır-kapanır, herkesin anlayacağı dilde modern ekran rehberi. */
export default function Guide({ title = "Bu ekran ne işe yarar?", items }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <details className="card p-3.5 rounded-xl border border-white/[0.08] bg-surface-subtle/50 group transition-all">
      <summary className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-paper-muted hover:text-paper-bright transition-colors">
        <HelpCircle size={15} className="text-sky" aria-hidden strokeWidth={2} />
        <span>{title}</span>
        <ChevronDown
          size={14}
          aria-hidden
          strokeWidth={2}
          className="ml-auto text-paper-faint transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 space-y-1.5 pt-2 border-t border-white/[0.06]">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] bg-surface-card/60 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-left text-xs font-medium text-paper hover:text-live transition-colors"
            >
              <span>{it.q}</span>
              <ChevronDown
                size={13}
                aria-hidden
                strokeWidth={2}
                className={`shrink-0 text-paper-faint transition-transform duration-150 ${
                  open === i ? "rotate-180 text-live" : ""
                }`}
              />
            </button>
            {open === i && (
              <p className="border-t border-white/[0.04] px-3.5 py-2 text-xs leading-relaxed text-paper-muted bg-white/[0.01]">
                {it.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
