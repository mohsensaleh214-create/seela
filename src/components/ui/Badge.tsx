import { AlertTriangle, Clock, CheckCircle2, Info } from 'lucide-react';
import type { LevelOfConcern, CaseStatus } from '@/lib/types';

const LEVEL_META: Record<LevelOfConcern, { label: string; bg: string; fg: string; Icon: typeof AlertTriangle }> = {
  immediate: { label: 'Immediate', bg: 'bg-urgent-tint', fg: 'text-urgent', Icon: AlertTriangle },
  elevated: { label: 'Elevated', bg: 'bg-caution-tint', fg: 'text-caution-deep', Icon: Clock },
  monitored: { label: 'Monitored', bg: 'bg-steady-tint', fg: 'text-steady-deep', Icon: CheckCircle2 },
};

export function LevelBadge({ level, size = 'md' }: { level: LevelOfConcern; size?: 'sm' | 'md' }) {
  const m = LEVEL_META[level];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${m.bg} ${m.fg} ${padding}`}
    >
      <m.Icon size={size === 'sm' ? 12 : 14} aria-hidden />
      {m.label} level of concern
    </span>
  );
}

const STATUS_META: Record<CaseStatus, { label: string; bg: string; fg: string }> = {
  untriaged: { label: 'Untriaged', bg: 'bg-info-tint', fg: 'text-info' },
  open: { label: 'Open', bg: 'bg-caution-tint', fg: 'text-caution-deep' },
  closed: { label: 'Closed', bg: 'bg-steady-tint', fg: 'text-steady-deep' },
};

export function StatusPill({ status }: { status: CaseStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium ${m.bg} ${m.fg}`}>
      {m.label}
    </span>
  );
}

export function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-info-tint text-info px-2.5 py-1 text-[13px] font-medium">
      <Info size={14} aria-hidden />
      {children}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: 'mild' | 'moderate' | 'severe' | 'info' }) {
  const color =
    severity === 'severe' ? 'bg-urgent' : severity === 'moderate' ? 'bg-caution' : severity === 'mild' ? 'bg-steady' : 'bg-info';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}
