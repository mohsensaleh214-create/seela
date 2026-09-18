import { useState } from 'react';
import { format } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { PortalHeader } from '@/components/PortalHeader';
import { PageHeader } from '@/components/PageHeader';
import { LockedPortal } from '@/components/LockedPortal';
import { Card } from '@/components/ui/Card';
import { StudentChip } from '@/components/ui/StudentChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

const STATUS_LABEL: Record<string, string> = { referred: 'Referred', 'in progress': 'In progress', completed: 'Completed', declined: 'Declined' };
const STATUS_TONE: Record<string, string> = {
  referred: 'text-info',
  'in progress': 'text-caution',
  completed: 'text-steady',
  declined: 'text-ink-muted',
};

export function CounsellingReferrals() {
  const { state, permissions } = useApp();
  const [referring, setReferring] = useState(false);

  if (permissions.wellbeing === 'none') return <LockedPortal portal="Wellbeing" />;

  const referrals = state.wellbeingRecords
    .filter((r) => r.type === 'session')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <PortalHeader portal="wellbeing" title="Counselling referrals" />
      <PageHeader
        title="Every referral"
        actions={
          <Button variant="primary" portal="wellbeing" onClick={() => setReferring(true)}>
            Refer to counselling
          </Button>
        }
      />

      {referrals.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No referrals yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {referrals.map((r) => (
            <ReferralCard key={r.id} recordId={r.id} />
          ))}
        </div>
      )}

      <ReferModal open={referring} onClose={() => setReferring(false)} />
    </>
  );

  function ReferralCard({ recordId }: { recordId: string }) {
    const { state: s2, currentUser, dispatch } = useApp();
    const r = s2.wellbeingRecords.find((rec) => rec.id === recordId);
    const student = r ? s2.students.find((st) => st.id === r.studentId) : undefined;
    if (!r || !student) return null;

    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <StudentChip student={student} linkTo={`/students/${student.id}`} />
          <p className="mt-2 text-[14px] text-ink-body">{r.summary}</p>
          <p className="mt-1 text-[12px] text-ink-muted">{format(new Date(r.createdAt), 'd MMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-medium ${STATUS_TONE[r.referralStatus ?? 'referred']}`}>
            {STATUS_LABEL[r.referralStatus ?? 'referred']}
          </span>
          <select
            value={r.referralStatus ?? 'referred'}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_REFERRAL_STATUS',
                recordId: r.id,
                status: e.target.value as NonNullable<typeof r.referralStatus>,
                actorId: currentUser.id,
              })
            }
            className="rounded-[6px] border border-line-strong bg-surface px-2 py-1.5 text-[13px]"
            aria-label={`Referral status for ${studentName(student)}`}
          >
            <option value="referred">Referred</option>
            <option value="in progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </Card>
    );
  }
}

function ReferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [studentId, setStudentId] = useState('');
  const [summary, setSummary] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Refer to counselling"
      footer={
        <Button
          variant="primary"
          portal="wellbeing"
          disabled={!studentId || !summary}
          onClick={() => {
            const s = state.students.find((st) => st.id === studentId);
            if (!s) return;
            dispatch({
              type: 'ADD_WELLBEING_RECORD',
              actorId: currentUser.id,
              record: { studentId, type: 'session', summary, authorId: currentUser.id, referralStatus: 'referred' },
            });
            logAudit({
              actorId: currentUser.id,
              action: 'create',
              entityType: 'wellbeing-record',
              entityId: studentId,
              entityLabel: `a counselling referral for ${studentName(s)}`,
            });
            show('Referral sent.');
            setStudentId('');
            setSummary('');
            onClose();
          }}
        >
          Send referral
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
        <TextAreaField label="Reason for referral" value={summary} onChange={(e) => setSummary(e.target.value)} required />
      </div>
    </Modal>
  );
}
