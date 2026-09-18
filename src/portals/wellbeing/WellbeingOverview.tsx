import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { HeartHandshake } from 'lucide-react';
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
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

function staffYearGroup(jobTitle: string): number | null {
  const match = jobTitle.match(/Year (\d+)/);
  return match ? Number(match[1]) : null;
}

const MOOD_LABEL: Record<string, string> = { low: 'Low', mixed: 'Mixed', positive: 'Positive' };

export function WellbeingOverview() {
  const { state, currentUser, permissions } = useApp();
  const [logging, setLogging] = useState(false);

  const ownYear = staffYearGroup(currentUser.jobTitle);
  const inScope = (studentId: string) => {
    if (permissions.wellbeing === 'full') return true;
    const s = state.students.find((st) => st.id === studentId);
    return !!s && s.yearGroup === ownYear;
  };

  const recent = useMemo(
    () =>
      state.wellbeingRecords
        .filter((r) => inScope(r.studentId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.wellbeingRecords, permissions.wellbeing, ownYear],
  );

  if (permissions.wellbeing === 'none') return <LockedPortal portal="Wellbeing" />;

  return (
    <>
      <PortalHeader portal="wellbeing" title="Wellbeing" />
      <PageHeader
        title="Recent activity"
        description={permissions.wellbeing === 'own-year-full' ? `Showing Year ${ownYear} — your pastoral scope.` : 'Showing every year group.'}
        actions={
          <Button variant="primary" portal="wellbeing" onClick={() => setLogging(true)}>
            Log a pastoral conversation
          </Button>
        }
      />

      {recent.length === 0 ? (
        <EmptyState icon={HeartHandshake} title="Nothing logged yet" body="Conversations and check-ins will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((r) => {
            const s = state.students.find((st) => st.id === r.studentId);
            if (!s) return null;
            return (
              <Card key={r.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <StudentChip student={s} linkTo={`/students/${s.id}`} />
                  <p className="mt-2 text-[15px] text-ink-body">{r.summary}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {r.type === 'check-in' ? 'Check-in' : r.type === 'pastoral-note' ? 'Pastoral note' : r.type === 'session' ? 'Counselling' : 'Support plan'}
                    {r.mood && ` · Mood: ${MOOD_LABEL[r.mood]}`} · {format(new Date(r.createdAt), 'd MMM yyyy')}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LogConversationModal open={logging} onClose={() => setLogging(false)} />
    </>
  );
}

function LogConversationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState<'low' | 'mixed' | 'positive'>('mixed');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return state.students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 6);
  }, [query, state.students]);

  const student = state.students.find((s) => s.id === studentId);

  function reset() {
    setQuery('');
    setStudentId('');
    setSummary('');
    setMood('mixed');
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Log a pastoral conversation"
      footer={
        <Button
          variant="primary"
          portal="wellbeing"
          disabled={!student || !summary}
          onClick={() => {
            if (!student) return;
            dispatch({
              type: 'ADD_WELLBEING_RECORD',
              actorId: currentUser.id,
              record: { studentId: student.id, type: 'pastoral-note', summary, mood, authorId: currentUser.id },
            });
            logAudit({
              actorId: currentUser.id,
              action: 'create',
              entityType: 'wellbeing-record',
              entityId: student.id,
              entityLabel: `a pastoral note for ${studentName(student)}`,
            });
            show('Conversation logged.');
            reset();
            onClose();
          }}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {!student ? (
          <>
            <TextField label="Student" hint="Type two or three letters of a name" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            {matches.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-[8px] border border-line">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setStudentId(s.id)} className="flex w-full px-3 py-2 text-left hover:bg-surface-sunken">
                      <StudentChip student={s} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between rounded-[8px] bg-surface-sunken px-3 py-2">
            <StudentChip student={student} />
            <button type="button" onClick={() => setStudentId('')} className="text-[13px] text-ink-muted underline">
              Change
            </button>
          </div>
        )}
        <TextAreaField label="What was discussed" value={summary} onChange={(e) => setSummary(e.target.value)} required />
        <SelectField label="Mood" value={mood} onChange={(e) => setMood(e.target.value as typeof mood)}>
          <option value="positive">Positive</option>
          <option value="mixed">Mixed</option>
          <option value="low">Low</option>
        </SelectField>
      </div>
    </Modal>
  );
}
