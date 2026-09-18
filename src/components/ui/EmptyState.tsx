import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-line bg-surface-sunken px-6 py-12 text-center">
      {Icon && <Icon size={28} className="text-ink-muted" aria-hidden />}
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      {body && <p className="max-w-[42ch] text-[15px] text-ink-muted">{body}</p>}
      {action}
    </div>
  );
}
