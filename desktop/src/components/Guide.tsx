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

/** Açılır-kapanır, herkesin anlayacağı dilde ekran rehberi. */
export default function Guide({ title = "Bu ekran ne işe yarar?", items }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <details className="relative overflow-hidden p-4 bg-black border-[3px] border-white/20 shadow-[4px_4px_0px_rgba(255,255,255,0.05)] font-mono group">
      <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-xs font-black uppercase tracking-wider text-white/80 transition-none hover:text-live">
        <HelpCircle size={16} className="text-cyan" aria-hidden strokeWidth={2.5} />
        {title}
        <ChevronDown
          size={15}
          aria-hidden
          strokeWidth={2.5}
          className="ml-auto transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="mt-4 space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-none border border-white/10 bg-black">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-white transition-none hover:text-live hover:bg-white/5"
            >
              {it.q}
              <ChevronDown
                size={14}
                aria-hidden
                strokeWidth={2.5}
                className={`shrink-0 text-white/40 transition-transform duration-150 ${
                  open === i ? "rotate-180 text-live" : ""
                }`}
              />
            </button>
            {open === i && (
              <p className="border-t border-white/10 px-3.5 py-2.5 font-mono text-xs leading-relaxed text-white/60">
                {it.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
