import { useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { studentName, staffName } from '@/lib/selectors';
import { triageUrgency } from '@/lib/safeguarding';
import type { Case, LevelOfConcern } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StudentChip } from '@/components/ui/StudentChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Drawer } from '@/components/ui/Drawer';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { LockedPortal } from '@/components/LockedPortal';
import { ShieldCheck } from 'lucide-react';

const URGENCY_CLASS = { ok: 'text-info', caution: 'text-caution', urgent: 'text-urgent' } as const;

export function TriageQueue() {
  const { state, now, permissions } = useApp();
  const [openCase, setOpenCase] = useState<Case | null>(null);

  if (!permissions.triage) return <LockedPortal portal="Safeguarding" />;

  const queue = state.cases
    .filter((c) => c.status === 'untriaged')
    .sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());

  const columns: Column<Case>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (c) => {
        const s = state.students.find((st) => st.id === c.studentId);
        return s ? <StudentChip student={s} /> : '—';
      },
    },
    { key: 'category', header: 'Category', render: (c) => c.category },
    { key: 'reported', header: 'Reported', render: (c) => format(new Date(c.reportedAt), 'd MMM, HH:mm') },
    { key: 'reporter', header: 'Reported by', render: (c) => staffName(state.staff.find((s) => s.id === c.reportedById)) },
    {
      key: 'since',
      header: 'Time waiting',
      render: (c) => {
        const urgency = triageUrgency(c.reportedAt, now);
        const hours = Math.round((now.getTime() - new Date(c.reportedAt).getTime()) / 36e5);
        return (
          <span className={`font-medium ${URGENCY_CLASS[urgency]}`}>
            {hours < 1 ? 'Just now' : hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d ${hours % 24}h`}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader title="Triage queue" description="Untriaged reports, oldest first. Open one to set a level of concern and an owner." />
      {queue.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nothing waiting" body="Every report has been triaged. New reports will appear here." />
      ) : (
        <DataTable
          columns={columns}
          rows={queue}
          onRowClick={setOpenCase}
          rowLabel={(c) => `Triage ${studentName(state.students.find((s) => s.id === c.studentId)!)}`}
        />
      )}

      <TriagePanel key={openCase?.id ?? 'none'} openCase={openCase} onClose={() => setOpenCase(null)} />
    </>
  );
}

function TriagePanel({ openCase, onClose }: { openCase: Case | null; onClose: () => void }) {
  const { state, currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [level, setLevel] = useState<LevelOfConcern>('monitored');
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [note, setNote] = useState('');

  const student = openCase ? state.students.find((s) => s.id === openCase.studentId) : undefined;

  if (!openCase || !student) {
    return <Drawer open={false} onClose={onClose} title="Triage" children={null} />;
  }

  const priorClosed = state.cases.filter((c) => c.studentId === student.id && c.status === 'closed');
  const patternFlags = state.patternFlags.filter((p) => p.studentId === student.id && p.status === 'open');
  const owners = state.staff.filter((s) => ['dsl', 'senior-dsl', 'pastoral-lead'].includes(s.role));

  return (
    <Drawer open={!!openCase} onClose={onClose} title={`Triage — ${studentName(student)}`}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] font-medium text-ink-muted">
            {openCase.category} · {format(new Date(openCase.occurredAt), 'd MMM yyyy')} · {openCase.location}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.55] text-ink-body">{openCase.account}</p>
          {openCase.studentWords && (
            <p className="mt-2 rounded-[8px] bg-surface-sunken px-3 py-2 text-[14px] italic text-ink-body">
              &ldquo;{openCase.studentWords}&rdquo;
            </p>
          )}
        </div>

        {patternFlags.length > 0 && (
          <Banner tone="info">
            <p className="font-medium">System flag — not a decision</p>
            {patternFlags.map((p) => (
              <p key={p.id} className="mt-1">
                {p.summary}
              </p>
            ))}
          </Banner>
        )}

        {priorClosed.length > 0 && (
          <div className="rounded-[8px] border border-line px-3 py-2.5">
            <p className="text-[13px] font-medium text-ink-muted">Existing record</p>
            <p className="mt-1 text-[14px] text-ink-body">
              {priorClosed.length} closed safeguarding {priorClosed.length === 1 ? 'concern' : 'concerns'} on record.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-line pt-4">
          <SelectField label="Level of concern" value={level} onChange={(e) => setLevel(e.target.value as LevelOfConcern)}>
            <option value="monitored">Monitored</option>
            <option value="elevated">Elevated</option>
            <option value="immediate">Immediate</option>
          </SelectField>
          <SelectField label="Owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {staffName(o)} — {o.jobTitle}
              </option>
            ))}
          </SelectField>
          <TextAreaField label="Triage note" hint="Optional — visible on the case" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <Button
            variant="primary"
            portal="safeguarding"
            onClick={() => {
              dispatch({ type: 'TRIAGE_CASE', caseId: openCase.id, level, ownerId, actorId: currentUser.id, note: note || undefined });
              logAudit({
                actorId: currentUser.id,
                action: 'edit',
                entityType: 'case',
                entityId: openCase.id,
                entityLabel: `${studentName(student)}'s case`,
                context: `Triaged to ${level}`,
              });
              show('Triaged. Owner notified.');
              onClose();
            }}
          >
            Set level and assign owner
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
