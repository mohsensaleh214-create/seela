import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Lock, ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName, staffName, canReadCase } from '@/lib/selectors';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Banner } from '@/components/ui/Banner';
import { LevelBadge, StatusPill } from '@/components/ui/Badge';
import { StudentChip } from '@/components/ui/StudentChip';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ViewersDisclosure } from './case/ViewersDisclosure';
import { CaseActionsPanel } from './case/CaseActionsPanel';

const ENTRY_LABEL: Record<string, string> = {
  note: 'Note',
  review: 'Review',
  contact: 'Contact home',
  'level-change': 'Level of concern changed',
  handover: 'Handover',
};

export function CaseView() {
  const { caseId } = useParams();
  const { state, currentUser, permissions, dispatch, logAudit } = useApp();
  const [note, setNote] = useState('');

  const c = state.cases.find((cs) => cs.id === caseId);
  const student = c ? state.students.find((s) => s.id === c.studentId) : undefined;
  const actionOwnerIds = c ? state.actions.filter((a) => a.caseId === c.id).map((a) => a.ownerId) : [];
  const readable = c && student ? canReadCase(permissions, c, student, currentUser, actionOwnerIds) : false;

  useEffect(() => {
    if (c && student && readable) {
      logAudit({
        actorId: currentUser.id,
        action: 'view',
        entityType: 'case',
        entityId: c.id,
        entityLabel: `${studentName(student)}'s case`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id, readable, currentUser.id]);

  if (!c || !student) {
    return <EmptyState title="Case not found" body="This case does not exist in the dummy dataset." />;
  }

  if (!readable) {
    return (
      <>
        <PageHeader title="Case" />
        <Banner tone="locked">
          <p className="flex items-center gap-1.5 font-medium">
            <Lock size={15} aria-hidden />
            Restricted. Contact the safeguarding lead.
          </p>
          <p className="mt-1">Reading is limited by role. This attempt to open the case has been logged.</p>
        </Banner>
      </>
    );
  }

  const entries = state.entries
    .filter((e) => e.caseId === c.id && e.type !== 'action' && e.type !== 'pattern-flag')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <>
      <Link to="/safeguarding/register" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft size={14} aria-hidden />
        Back to register
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={c.status} />
          <LevelBadge level={c.level} />
          {c.reopenedFromCaseId && <span className="text-[13px] text-ink-muted">Reopened case</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold leading-[1.2] text-ink">
              <Link to={`/students/${student.id}`} className="hover:underline">
                {studentName(student)}
              </Link>
              <span className="ml-2 text-[19px] font-normal text-ink-muted">{c.category}</span>
            </h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              Reported {format(new Date(c.reportedAt), 'd MMM yyyy')} by {staffName(state.staff.find((s) => s.id === c.reportedById))}
              {c.ownerId && ` · Owned by ${staffName(state.staff.find((s) => s.id === c.ownerId))}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <ViewersDisclosure caseId={c.id} />

          <Card className="p-5">
            <CardTitle>Original account</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">{c.location} · locked after submission</p>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.55] text-ink-body">{c.account}</p>
            {c.studentWords && (
              <p className="mt-3 rounded-[8px] bg-surface-sunken px-3 py-2.5 text-[14px] italic text-ink-body">
                &ldquo;{c.studentWords}&rdquo;
              </p>
            )}
            {c.othersPresent && <p className="mt-2 text-[13px] text-ink-muted">Others present: {c.othersPresent}</p>}
          </Card>

          <Card className="p-5">
            <CardTitle>Case record</CardTitle>
            {entries.length === 0 ? (
              <p className="mt-2 text-[14px] text-ink-muted">No entries yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3">
                {entries.map((e) => (
                  <li key={e.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                    <p className="text-[13px] font-medium text-safeguarding">{ENTRY_LABEL[e.type] ?? e.type}</p>
                    <p className="mt-0.5 text-[15px] text-ink-body">{e.body}</p>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {staffName(state.staff.find((s) => s.id === e.authorId))} · {format(new Date(e.createdAt), "d MMM yyyy 'at' HH:mm")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {c.status === 'open' && (
              <form
                className="mt-4 flex flex-col gap-2 border-t border-line pt-4"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (!note.trim()) return;
                  dispatch({ type: 'ADD_ENTRY', caseId: c.id, entryType: 'note', body: note, actorId: currentUser.id });
                  setNote('');
                }}
              >
                <TextAreaField label="Add a note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
                <Button type="submit" variant="secondary" className="self-start" disabled={!note.trim()}>
                  Add note
                </Button>
              </form>
            )}
          </Card>

          {c.status === 'closed' && c.closureStatement && (
            <Card className="p-5">
              <CardTitle>Closure statement</CardTitle>
              <p className="mt-2 text-[15px] leading-[1.55] text-ink-body">{c.closureStatement}</p>
              <p className="mt-2 text-[13px] text-ink-muted">
                Closed {c.closedAt && format(new Date(c.closedAt), 'd MMM yyyy')} by {staffName(state.staff.find((s) => s.id === c.closedById))}
              </p>
            </Card>
          )}

          <div className="text-[13px] text-ink-muted">
            <StudentChip student={student} linkTo={`/students/${student.id}`} subtitle="View full student profile" />
          </div>
        </div>

        <CaseActionsPanel c={c} />
      </div>
    </>
  );
}
