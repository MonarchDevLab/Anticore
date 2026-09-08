interface Props {
  icon?: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="text-paper-faint mb-1">{icon}</div>}
      <p className="text-xs font-bold text-paper-bright">{title}</p>
      {hint && <p className="max-w-sm text-xs text-paper-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
