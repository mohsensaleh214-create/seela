import { useState } from 'react';
import { format } from 'date-fns';
import { Lock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TimelineItem } from '@/lib/timeline';
import { tone } from '@/lib/portal-theme';
import { staffName } from '@/lib/selectors';
import type { Staff } from '@/lib/types';

const PORTAL_DOT: Record<TimelineItem['portal'], string> = {
  medical: 'bg-medical',
  wellbeing: 'bg-wellbeing',
  safeguarding: 'bg-safeguarding',
};

export function Timeline({
  items,
  getStaff,
  onAcknowledgeFlag,
  onDismissFlag,
}: {
  items: TimelineItem[];
  getStaff: (id: string) => Staff | undefined;
  onAcknowledgeFlag?: (patternFlagId: string) => void;
  onDismissFlag?: (patternFlagId: string, reason: string) => void;
}) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item) => (
        <TimelineRow key={item.id} item={item} getStaff={getStaff} onAcknowledgeFlag={onAcknowledgeFlag} onDismissFlag={onDismissFlag} />
      ))}
    </ol>
  );
}

function TimelineRow({
  item,
  getStaff,
  onAcknowledgeFlag,
  onDismissFlag,
}: {
  item: TimelineItem;
  getStaff: (id: string) => Staff | undefined;
  onAcknowledgeFlag?: (patternFlagId: string) => void;
  onDismissFlag?: (patternFlagId: string, reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState('');

  if (item.isPatternFlag) {
    return (
      <li className="flex items-start gap-3 rounded-[8px] bg-info-tint px-4 py-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-info" aria-hidden />
        <div className="flex-1">
          <p className="text-[13px] font-medium text-info">System flag · not a decision</p>
          <p className="mt-0.5 text-[15px] text-ink">{item.summary}</p>
          <p className="mt-1 text-[12px] text-ink-muted">{format(new Date(item.at), "d MMM yyyy 'at' HH:mm")}</p>
          {!dismissing && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onAcknowledgeFlag?.(item.patternFlagId!)}
                className="inline-flex items-center gap-1 rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-sunken"
              >
                <ThumbsUp size={14} aria-hidden /> Acknowledge
              </button>
              <button
                type="button"
                onClick={() => setDismissing(true)}
                className="inline-flex items-center gap-1 rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-sunken"
              >
                <ThumbsDown size={14} aria-hidden /> Dismiss
              </button>
            </div>
          )}
          {dismissing && (
            <form
              className="mt-2 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onDismissFlag?.(item.patternFlagId!, reason);
                setDismissing(false);
              }}
            >
              <label className="text-[13px] text-ink-muted" htmlFor={`reason-${item.id}`}>
                Reason for dismissing
              </label>
              <input
                id={`reason-${item.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="rounded-[8px] border border-line-strong px-3 py-2 text-[14px]"
                placeholder="e.g. already being followed up as part of an existing plan"
              />
              <div className="flex gap-2">
                <button type="submit" className="rounded-[8px] bg-ink px-3 py-1.5 text-[13px] font-medium text-white">
                  Confirm dismiss
                </button>
                <button
                  type="button"
                  onClick={() => setDismissing(false)}
                  className="rounded-[8px] border border-line-strong px-3 py-1.5 text-[13px] font-medium text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </li>
    );
  }

  if (item.restricted) {
    return (
      <li
        className="group flex items-start gap-3 rounded-[8px] border border-dashed border-line px-4 py-3"
        title="Restricted entry — reading is limited by role"
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PORTAL_DOT[item.portal]}`} aria-hidden />
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-[15px] text-ink-muted">
            <Lock size={13} aria-hidden />
            Restricted entry
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">{format(new Date(item.at), 'd MMM yyyy')}</p>
        </div>
      </li>
    );
  }

  const t = tone(item.portal);

  return (
    <li className="rounded-[8px] border border-line px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PORTAL_DOT[item.portal]}`} aria-hidden />
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[13px] font-medium" style={{ color: t.accent }}>
              {item.typeLabel}
            </span>
            <span className="text-[12px] text-ink-muted">{format(new Date(item.at), "d MMM yyyy 'at' HH:mm")}</span>
          </div>
          <p className="mt-0.5 text-[15px] text-ink">{item.summary}</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">{staffName(getStaff(item.authorId))}</p>
        </div>
      </button>
      {open && item.detail && <p className="mt-2 pl-5 text-[15px] leading-[1.55] text-ink-body">{item.detail}</p>}
      {open && item.linkTo && (
        <Link to={item.linkTo} className="mt-2 inline-block pl-5 text-[13px] font-medium underline" style={{ color: t.accent }}>
          Open full record
        </Link>
      )}
    </li>
  );
}
