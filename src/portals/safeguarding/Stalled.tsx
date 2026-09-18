import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlarmClock, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName, sameCampus } from '@/lib/selectors';
import { triageUrgency, isActionOverdue, reviewUrgency, daysBetween, lastMovementAt } from '@/lib/safeguarding';
import type { Student } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { StudentChip } from '@/components/ui/StudentChip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

function inScope(student: Student, staffScope: ReturnType<typeof useApp>['permissions']['stalledScope'], currentUser: ReturnType<typeof useApp>['currentUser']): boolean {
  if (staffScope === 'all') return true;
  if (staffScope === 'own-campus') return sameCampus(student.campus, currentUser.campus);
  if (staffScope === 'own-year') {
    const match = currentUser.jobTitle.match(/Year (\d+)/);
    return match ? Number(match[1]) === student.yearGroup : false;
  }
  return false;
}

export function Stalled() {
  const { state, currentUser, permissions, now } = useApp();
  const navigate = useNavigate();
  const { show } = useToast();
  const [nudged, setNudged] = useState<Set<string>>(new Set());

  if (permissions.stalledScope === 'none') {
    return <EmptyState title="Not available" body="This view is limited to pastoral, DSL and senior DSL roles." />;
  }

  const scopedCases = state.cases.filter((c) => {
    const s = state.students.find((st) => st.id === c.studentId);
    return s && inScope(s, permissions.stalledScope, currentUser);
  });

  const triageOverdue = scopedCases.filter((c) => c.status === 'untriaged' && triageUrgency(c.reportedAt, now) === 'urgent');
  const openCases = scopedCases.filter((c) => c.status === 'open');
  const actionsOverdue = state.actions.filter((a) => openCases.some((c) => c.id === a.caseId) && isActionOverdue(a, now));
  const reviewsOverdue = openCases.filter((c) => reviewUrgency(c, now) === 'urgent');
  const noMovement = openCases.filter((c) => {
    const last = lastMovementAt(c, state.entries, state.actions, state.contactRecords);
    return daysBetween(last, now) >= 14;
  });

  const nudge = (key: string, label: string) => {
    setNudged((n) => new Set(n).add(key));
    show(`Reminder sent to ${label}.`);
  };

  const nothingStalled =
    triageOverdue.length === 0 && actionsOverdue.length === 0 && reviewsOverdue.length === 0 && noMovement.length === 0;

  return (
    <>
      <PageHeader title="Stalled" description="Everything past its clock, grouped by what has lapsed." />

      {nothingStalled ? (
        <EmptyState icon={AlarmClock} title="Nothing is stalled" body="Every case in your scope is moving on time." />
      ) : (
        <div className="flex flex-col gap-6">
          <StalledGroup title="Triage overdue" empty="No reports waiting past 48 hours.">
            {triageOverdue.map((c) => {
              const s = state.students.find((st) => st.id === c.studentId)!;
              const hours = Math.round((now.getTime() - new Date(c.reportedAt).getTime()) / 36e5);
              return (
                <Row
                  key={c.id}
                  student={s}
                  detail={`Reported ${Math.floor(hours / 24)}d ${hours % 24}h ago`}
                  owner="Unassigned"
                  onOpen={() => navigate('/safeguarding/triage')}
                  onNudge={() => nudge(c.id, 'the DSL team')}
                  nudged={nudged.has(c.id)}
                />
              );
            })}
          </StalledGroup>

          <StalledGroup title="Actions overdue" empty="No overdue actions.">
            {actionsOverdue.map((a) => {
              const c = openCases.find((cs) => cs.id === a.caseId)!;
              const s = state.students.find((st) => st.id === c.studentId)!;
              const owner = staffName(state.staff.find((st) => st.id === a.ownerId));
              return (
                <Row
                  key={a.id}
                  student={s}
                  detail={`${a.description} — due ${format(new Date(a.dueAt), 'd MMM')}`}
                  owner={owner}
                  onOpen={() => navigate(`/safeguarding/cases/${c.id}`)}
                  onNudge={() => nudge(a.id, owner)}
                  nudged={nudged.has(a.id)}
                />
              );
            })}
          </StalledGroup>

          <StalledGroup title="Reviews overdue" empty="No overdue reviews.">
            {reviewsOverdue.map((c) => {
              const s = state.students.find((st) => st.id === c.studentId)!;
              const owner = staffName(state.staff.find((st) => st.id === c.ownerId));
              return (
                <Row
                  key={c.id}
                  student={s}
                  detail={`Review was due ${format(new Date(c.nextReviewDue!), 'd MMM')}`}
                  owner={owner}
                  onOpen={() => navigate(`/safeguarding/cases/${c.id}`)}
                  onNudge={() => nudge(c.id, owner)}
                  nudged={nudged.has(c.id)}
                />
              );
            })}
          </StalledGroup>

          <StalledGroup title="No movement in 14 days" empty="Every open case has recent activity.">
            {noMovement.map((c) => {
              const s = state.students.find((st) => st.id === c.studentId)!;
              const owner = staffName(state.staff.find((st) => st.id === c.ownerId));
              const last = lastMovementAt(c, state.entries, state.actions, state.contactRecords);
              return (
                <Row
                  key={c.id}
                  student={s}
                  detail={`Last activity ${format(new Date(last), 'd MMM yyyy')} (${daysBetween(last, now)} days ago)`}
                  owner={owner}
                  onOpen={() => navigate(`/safeguarding/cases/${c.id}`)}
                  onNudge={() => nudge(c.id, owner)}
                  nudged={nudged.has(c.id)}
                />
              );
            })}
          </StalledGroup>
        </div>
      )}
    </>
  );
}

function StalledGroup({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <Card className="p-5">
      <CardTitle>{title}</CardTitle>
      {!hasChildren ? (
        <p className="mt-2 text-[14px] text-ink-muted">{empty}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">{children}</div>
      )}
    </Card>
  );
}

function Row({
  student,
  detail,
  owner,
  onOpen,
  onNudge,
  nudged,
}: {
  student: Student;
  detail: string;
  owner: string;
  onOpen: () => void;
  onNudge: () => void;
  nudged: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line px-3 py-2.5">
      <button type="button" onClick={onOpen} className="text-left hover:underline">
        <StudentChip student={student} subtitle={detail} />
      </button>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-ink-muted">{owner}</span>
        <Button size="sm" variant="secondary" icon={<Bell size={13} />} onClick={onNudge} disabled={nudged}>
          {nudged ? 'Nudged' : 'Nudge'}
        </Button>
      </div>
    </div>
  );
}
