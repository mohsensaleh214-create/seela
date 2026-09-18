import { format } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Action } from '@/lib/types';
import { staffName } from '@/lib/selectors';
import type { Staff } from '@/lib/types';

export function ActionItem({
  action,
  owner,
  now,
  onComplete,
}: {
  action: Action;
  owner: Staff | undefined;
  now: Date;
  onComplete?: () => void;
}) {
  const due = new Date(action.dueAt);
  const isDone = !!action.completedAt;
  const isOverdue = !isDone && due.getTime() < now.getTime();
  const isDueToday = !isDone && due.toDateString() === now.toDateString();

  const statusColor = isDone ? 'text-steady' : isOverdue ? 'text-urgent' : isDueToday ? 'text-caution' : 'text-ink-muted';

  return (
    <div className="flex items-start gap-3 rounded-[8px] border border-line px-3 py-3">
      <button
        type="button"
        onClick={onComplete}
        disabled={isDone || !onComplete}
        aria-label={isDone ? 'Completed' : 'Mark as complete'}
        className="mt-0.5 shrink-0 text-ink-muted disabled:cursor-default"
      >
        {isDone ? <CheckCircle2 size={20} className="text-steady" aria-hidden /> : <Circle size={20} aria-hidden />}
      </button>
      <div className="flex-1">
        <p className={`text-[15px] ${isDone ? 'text-ink-muted line-through' : 'text-ink'}`}>{action.description}</p>
        <p className={`mt-0.5 text-[13px] ${statusColor}`}>
          {isDone
            ? `Completed ${format(new Date(action.completedAt!), 'd MMM yyyy')} · ${owner ? staffName(owner) : ''}`
            : `${isOverdue ? 'Overdue' : isDueToday ? 'Due today' : 'Due'} ${format(due, 'd MMM yyyy')} · ${owner ? staffName(owner) : 'Unassigned'}`}
        </p>
        {isDone && action.outcome && <p className="mt-1 text-[13px] text-ink-body">{action.outcome}</p>}
      </div>
    </div>
  );
}
