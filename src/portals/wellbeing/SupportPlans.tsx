import { useState } from 'react';
import { format } from 'date-fns';
import { ClipboardCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { PortalHeader } from '@/components/PortalHeader';
import { PageHeader } from '@/components/PageHeader';
import { LockedPortal } from '@/components/LockedPortal';
import { Card, CardTitle } from '@/components/ui/Card';
import { StudentChip } from '@/components/ui/StudentChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, DateField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

export function SupportPlans() {
  const { state, currentUser, permissions, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [opening, setOpening] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [summary, setSummary] = useState('');
  const [goal, setGoal] = useState('');
  const [reviewDate, setReviewDate] = useState('');

  if (permissions.wellbeing === 'none') return <LockedPortal portal="Wellbeing" />;

  const plans = state.wellbeingRecords.filter((r) => r.type === 'support-plan');
  const active = plans.filter((p) => p.planStatus === 'active');
  const closed = plans.filter((p) => p.planStatus === 'closed');

  return (
    <>
      <PortalHeader portal="wellbeing" title="Support plans" />
      <PageHeader
        title="Active plans"
        actions={
          <Button variant="primary" portal="wellbeing" onClick={() => setOpening(true)}>
            Open a support plan
          </Button>
        }
      />

      {active.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No active plans" />
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((p) => (
            <PlanCard key={p.id} recordId={p.id} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <>
          <PageHeader title="Closed plans" />
          <div className="flex flex-col gap-3">
            {closed.map((p) => {
              const s = state.students.find((st) => st.id === p.studentId);
              return (
                s && (
                  <Card key={p.id} className="p-4">
                    <StudentChip student={s} linkTo={`/students/${s.id}`} />
                    <p className="mt-2 text-[14px] text-ink-body">{p.summary}</p>
                  </Card>
                )
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={opening}
        onClose={() => setOpening(false)}
        title="Open a support plan"
        footer={
          <Button
            variant="primary"
            portal="wellbeing"
            disabled={!studentId || !summary || !goal || !reviewDate}
            onClick={() => {
              const s = state.students.find((st) => st.id === studentId);
              if (!s) return;
              dispatch({
                type: 'ADD_WELLBEING_RECORD',
                actorId: currentUser.id,
                record: {
                  studentId,
                  type: 'support-plan',
                  summary,
                  authorId: currentUser.id,
                  goals: [{ goal, reviewDate: new Date(reviewDate).toISOString(), status: 'on track' }],
                  planReviewDate: new Date(reviewDate).toISOString(),
                  planStatus: 'active',
                },
              });
              logAudit({
                actorId: currentUser.id,
                action: 'create',
                entityType: 'wellbeing-record',
                entityId: studentId,
                entityLabel: `a support plan for ${studentName(s)}`,
              });
              show('Support plan opened.');
              setStudentId('');
              setSummary('');
              setGoal('');
              setReviewDate('');
              setOpening(false);
            }}
          >
            Open plan
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
            Student
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink min-h-[44px]"
            >
              <option value="">Choose a student</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {studentName(s)} — Year {s.yearGroup}
                </option>
              ))}
            </select>
          </label>
          <TextAreaField label="What this plan is for" value={summary} onChange={(e) => setSummary(e.target.value)} required />
          <TextField label="First goal" value={goal} onChange={(e) => setGoal(e.target.value)} required />
          <DateField label="Review date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} required />
        </div>
      </Modal>
    </>
  );
}

function PlanCard({ recordId }: { recordId: string }) {
  const { state, currentUser, dispatch } = useApp();
  const plan = state.wellbeingRecords.find((r) => r.id === recordId);
  const student = plan ? state.students.find((s) => s.id === plan.studentId) : undefined;
  if (!plan || !student) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <StudentChip student={student} linkTo={`/students/${student.id}`} />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => dispatch({ type: 'CLOSE_SUPPORT_PLAN', recordId: plan.id, actorId: currentUser.id })}
        >
          Close plan
        </Button>
      </div>
      <CardTitle className="mt-3">{plan.summary}</CardTitle>
      {plan.goals && (
        <ul className="mt-3 flex flex-col gap-2">
          {plan.goals.map((g, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-surface-sunken px-3 py-2">
              <span className="text-[14px] text-ink">{g.goal}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink-muted">Review {format(new Date(g.reviewDate), 'd MMM')}</span>
                <select
                  value={g.status}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SUPPORT_PLAN_GOAL',
                      recordId: plan.id,
                      goalIndex: i,
                      status: e.target.value as typeof g.status,
                      actorId: currentUser.id,
                    })
                  }
                  className="rounded-[6px] border border-line-strong bg-surface px-2 py-1 text-[13px]"
                >
                  <option value="on track">On track</option>
                  <option value="needs attention">Needs attention</option>
                  <option value="met">Met</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
