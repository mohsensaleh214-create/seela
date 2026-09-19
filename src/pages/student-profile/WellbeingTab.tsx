import { useState } from 'react';
import { format } from 'date-fns';
import { HeartHandshake, Lock, PenLine } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import type { WellbeingRecord, Student } from '@/lib/types';
import type { WellbeingAccess } from '@/lib/permissions';
import { Card, CardTitle } from '@/components/ui/Card';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField, SelectField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

const MOOD_LABEL: Record<string, string> = { low: 'Low', mixed: 'Mixed', positive: 'Positive' };

export function WellbeingTab({
  student,
  records,
  access,
}: {
  student: Student;
  records: WellbeingRecord[];
  access: WellbeingAccess | 'locked';
}) {
  const [noting, setNoting] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {access === 'locked' && (
        <Banner tone="locked">
          <p className="flex items-center gap-1.5 font-medium">
            <Lock size={15} aria-hidden />
            Restricted. Contact the pastoral team.
          </p>
          <p className="mt-1">
            This student is outside your class or year group. Switch on duty mode for the fullest picture.
          </p>
        </Banner>
      )}

      {access === 'own-students-summary' && <SummaryView student={student} records={records} />}

      {(access === 'full' || access === 'own-year-full') && <FullView student={student} records={records} />}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[14px] font-medium text-ink">Noticed something worth a quick note?</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            A note is lighter than raising a concern — no triage, just a record for the pastoral team to see.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setNoting(true)}>
          <PenLine size={13} aria-hidden />
          Add a note
        </Button>
      </Card>

      <AddNoteModal open={noting} onClose={() => setNoting(false)} student={student} />
    </div>
  );
}

function SummaryView({ student, records }: { student: Student; records: WellbeingRecord[] }) {
  const activePlan = records.find((r) => r.type === 'support-plan' && r.planStatus === 'active');
  const lastCheckIn = [...records]
    .filter((r) => r.type === 'check-in' && r.mood)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <>
      <Banner tone="info">
        <p>You have summary access for your own class. Full notes and session detail are visible to the pastoral team.</p>
      </Banner>
      <Card className="p-5">
        <CardTitle>Wellbeing summary</CardTitle>
        <dl className="mt-3 flex flex-col gap-2 text-[15px]">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-ink-muted">Support plan</dt>
            <dd className="font-medium text-ink">{activePlan ? 'Active — see the pastoral lead for detail' : 'None on file'}</dd>
          </div>
          {lastCheckIn?.mood && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-ink-muted">Most recent mood check-in</dt>
              <dd className="font-medium text-ink">
                {MOOD_LABEL[lastCheckIn.mood]} · {format(new Date(lastCheckIn.createdAt), 'd MMM yyyy')}
              </dd>
            </div>
          )}
        </dl>
        {!activePlan && !lastCheckIn && (
          <p className="mt-2 text-[14px] text-ink-muted">Nothing recorded for {student.preferredName ?? student.firstName} yet.</p>
        )}
      </Card>
    </>
  );
}

function FullView({ student, records }: { student: Student; records: WellbeingRecord[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No wellbeing records"
        body={`Nothing has been recorded for ${student.preferredName ?? student.firstName} yet.`}
      />
    );
  }

  const plans = records.filter((r) => r.type === 'support-plan');
  const others = records
    .filter((r) => r.type !== 'support-plan')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      {plans.map((plan) => (
        <Card key={plan.id} className="p-5">
          <div className="flex items-center justify-between">
            <CardTitle>Support plan</CardTitle>
            <span className={`text-[13px] font-medium ${plan.planStatus === 'active' ? 'text-steady' : 'text-ink-muted'}`}>
              {plan.planStatus === 'active' ? 'Active' : 'Closed'}
            </span>
          </div>
          <p className="mt-2 text-[15px] text-ink-body">{plan.summary}</p>
          {plan.goals && (
            <ul className="mt-3 flex flex-col gap-2">
              {plan.goals.map((g, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-[8px] bg-surface-sunken px-3 py-2">
                  <span className="text-[14px] text-ink">{g.goal}</span>
                  <span className="shrink-0 text-[13px] text-ink-muted">
                    {g.status} · review {format(new Date(g.reviewDate), 'd MMM')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      <Card className="p-5">
        <CardTitle>Recent record</CardTitle>
        <ul className="mt-3 flex flex-col gap-3">
          {others.map((r) => (
            <li key={r.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <p className="text-[13px] font-medium text-ink-muted">
                {r.type === 'check-in' ? 'Check-in' : r.type === 'pastoral-note' ? 'Pastoral note' : 'Counselling'}
                {r.mood && ` · Mood: ${MOOD_LABEL[r.mood]}`}
              </p>
              <p className="mt-0.5 text-[15px] text-ink-body">{r.summary}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">{format(new Date(r.createdAt), 'd MMM yyyy')}</p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function AddNoteModal({ open, onClose, student }: { open: boolean; onClose: () => void; student: Student }) {
  const { currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [mood, setMood] = useState<'' | 'low' | 'mixed' | 'positive'>('');
  const [summary, setSummary] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a wellbeing note"
      footer={
        <Button
          variant="primary"
          portal="wellbeing"
          disabled={!summary}
          onClick={() => {
            dispatch({
              type: 'ADD_WELLBEING_RECORD',
              actorId: currentUser.id,
              record: {
                studentId: student.id,
                type: 'pastoral-note',
                summary,
                mood: mood || undefined,
                authorId: currentUser.id,
              },
            });
            logAudit({
              actorId: currentUser.id,
              action: 'create',
              entityType: 'wellbeing-record',
              entityId: student.id,
              entityLabel: `a pastoral note for ${studentName(student)}`,
            });
            show('Note added — the pastoral team can see it.');
            setSummary('');
            setMood('');
            onClose();
          }}
        >
          Add note
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-muted">
          For a quick observation, not an emergency — if you're worried about a student's safety, raise a concern instead.
        </p>
        <TextAreaField
          label="What did you notice?"
          hint={`e.g. "${student.preferredName ?? student.firstName} seemed quieter than usual today."`}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />
        <SelectField label="Mood, if relevant" hint="Optional" value={mood} onChange={(e) => setMood(e.target.value as typeof mood)}>
          <option value="">Not sure / not applicable</option>
          <option value="positive">Positive</option>
          <option value="mixed">Mixed</option>
          <option value="low">Low</option>
        </SelectField>
      </div>
    </Modal>
  );
}
