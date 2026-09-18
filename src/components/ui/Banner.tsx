import { AlertTriangle, Info, Lock, CheckCircle2, X } from 'lucide-react';

type BannerTone = 'info' | 'caution' | 'urgent' | 'steady' | 'locked';

const META: Record<BannerTone, { bg: string; fg: string; Icon: typeof Info }> = {
  info: { bg: 'bg-info-tint', fg: 'text-info', Icon: Info },
  caution: { bg: 'bg-caution-tint', fg: 'text-caution-deep', Icon: AlertTriangle },
  urgent: { bg: 'bg-urgent-tint', fg: 'text-urgent', Icon: AlertTriangle },
  steady: { bg: 'bg-steady-tint', fg: 'text-steady-deep', Icon: CheckCircle2 },
  locked: { bg: 'bg-surface-sunken', fg: 'text-ink-muted', Icon: Lock },
};

export function Banner({
  tone = 'info',
  children,
  onDismiss,
}: {
  tone?: BannerTone;
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const m = META[tone];
  return (
    <div className={`flex items-start gap-3 rounded-[12px] px-4 py-3 text-[15px] ${m.bg} ${m.fg}`} role="status">
      <m.Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 hover:bg-black/5"
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
