import { useState } from 'react';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
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

export function HealthcarePlans() {
  const { state, currentUser, permissions, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [adding, setAdding] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState('');
  const [reviewDate, setReviewDate] = useState('');

  if (permissions.medical === 'none') return <LockedPortal portal="Medical" />;

  const plans = state.medicalRecords.filter((m) => m.type === 'plan');
  const canWrite = permissions.medical === 'full';

  return (
    <>
      <PortalHeader portal="medical" title="Healthcare plans" description="Individual healthcare plans for students with a long-term condition." />
      <PageHeader
        title="Every plan"
        actions={
          canWrite ? (
            <Button variant="primary" portal="medical" onClick={() => setAdding(true)}>
              Add healthcare plan
            </Button>
          ) : undefined
        }
      />

      {plans.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No healthcare plans" body="Plans created for students will appear here." />
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((p) => {
            const s = state.students.find((st) => st.id === p.studentId);
            if (!s) return null;
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <StudentChip student={s} linkTo={`/students/${s.id}`} />
                  {p.reviewDate && <span className="text-[13px] text-ink-muted">Review {format(new Date(p.reviewDate), 'd MMM yyyy')}</span>}
                </div>
                <CardTitle className="mt-3">{p.description}</CardTitle>
                {permissions.medical === 'full' ? (
                  <p className="mt-1 text-[15px] leading-[1.55] text-ink-body">{p.protocol}</p>
                ) : (
                  <p className="mt-1 text-[14px] text-ink-muted">Summary access. Contact the nurse for the full plan.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add healthcare plan"
        footer={
          <Button
            variant="primary"
            portal="medical"
            disabled={!studentId || !description}
            onClick={() => {
              const s = state.students.find((st) => st.id === studentId);
              if (!s) return;
              dispatch({
                type: 'ADD_MEDICAL_RECORD',
                actorId: currentUser.id,
                record: {
                  studentId,
                  type: 'plan',
                  description,
                  protocol,
                  reviewDate: reviewDate ? new Date(reviewDate).toISOString() : undefined,
                },
              });
              logAudit({
                actorId: currentUser.id,
                action: 'create',
                entityType: 'medical-record',
                entityId: studentId,
                entityLabel: `a healthcare plan for ${studentName(s)}`,
              });
              show('Healthcare plan saved.');
              setStudentId('');
              setDescription('');
              setProtocol('');
              setReviewDate('');
              setAdding(false);
            }}
          >
            Save plan
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
          <TextField label="Condition" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <TextAreaField label="What staff need to do" hint="Plain language — this becomes the emergency protocol" value={protocol} onChange={(e) => setProtocol(e.target.value)} />
          <DateField label="Review date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
