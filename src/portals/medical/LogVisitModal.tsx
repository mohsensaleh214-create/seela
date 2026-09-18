import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField } from '@/components/ui/FormField';
import { StudentChip } from '@/components/ui/StudentChip';

export function LogVisitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, currentUser, dispatch, logAudit } = useApp();
  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('');
  const [treatment, setTreatment] = useState('');
  const [timeIn, setTimeIn] = useState(new Date().toTimeString().slice(0, 5));
  const [timeOut, setTimeOut] = useState('');
  const [homeContacted, setHomeContacted] = useState(false);

  const student = state.students.find((s) => s.id === studentId);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return state.students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 6);
  }, [query, state.students]);

  function reset() {
    setQuery('');
    setStudentId('');
    setReason('');
    setTreatment('');
    setTimeOut('');
    setHomeContacted(false);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Log a nurse visit"
      footer={
        <Button
          variant="primary"
          portal="medical"
          disabled={!student || !reason}
          onClick={() => {
            if (!student) return;
            const today = new Date();
            const [h, m] = timeIn.split(':').map(Number);
            today.setHours(h, m, 0, 0);
            dispatch({
              type: 'ADD_MEDICAL_RECORD',
              actorId: currentUser.id,
              record: {
                studentId: student.id,
                type: 'visit',
                description: reason,
                visitReason: reason,
                visitTreatment: treatment,
                visitTimeIn: today.toISOString(),
                visitTimeOut: timeOut
                  ? (() => {
                      const d = new Date();
                      const [oh, om] = timeOut.split(':').map(Number);
                      d.setHours(oh, om, 0, 0);
                      return d.toISOString();
                    })()
                  : undefined,
                visitHomeContacted: homeContacted,
              },
            });
            logAudit({
              actorId: currentUser.id,
              action: 'create',
              entityType: 'medical-record',
              entityId: student.id,
              entityLabel: `a nurse visit for ${studentName(student)}`,
            });
            reset();
            onClose();
          }}
        >
          Save visit
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
        <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        <TextAreaField label="Treatment given" value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Time in" type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
          <TextField label="Time out" type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />
        </div>
        <label className="inline-flex items-center gap-2 text-[15px] text-ink">
          <input type="checkbox" checked={homeContacted} onChange={(e) => setHomeContacted(e.target.checked)} />
          Home was contacted
        </label>
      </div>
    </Modal>
  );
}
