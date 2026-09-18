import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName } from '@/lib/selectors';

export function ViewersDisclosure({ caseId }: { caseId: string }) {
  const { state } = useApp();
  const [open, setOpen] = useState(false);

  const views = state.auditEvents
    .filter((e) => e.entityType === 'case' && e.entityId === caseId && e.action === 'view')
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const distinctViewers = new Set(views.map((v) => v.actorId)).size;

  if (views.length === 0) return null;

  return (
    <div className="rounded-[8px] border border-line px-3 py-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 text-left">
        <Eye size={15} className="text-ink-muted" aria-hidden />
        <span className="flex-1 text-[13px] text-ink-body">
          {distinctViewers} {distinctViewers === 1 ? 'person has' : 'people have'} viewed this case
        </span>
        {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-1.5 border-t border-line pt-2">
          {views.map((v) => (
            <li key={v.id} className="text-[13px] text-ink-muted">
              {staffName(state.staff.find((s) => s.id === v.actorId))} · {format(new Date(v.at), "d MMM 'at' HH:mm")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
