interface Props {
  icon?: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center font-mono">
      {icon && <div className="text-white/40 mb-1">{icon}</div>}
      <p className="text-xs font-black uppercase tracking-wider text-white/80">{title}</p>
      {hint && <p className="max-w-sm text-[11px] text-white/40">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
