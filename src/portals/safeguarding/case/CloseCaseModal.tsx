import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { closureConditions } from '@/lib/safeguarding';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import type { Case } from '@/lib/types';

export function CloseCaseModal({ open, onClose, c }: { open: boolean; onClose: () => void; c: Case }) {
  const { state, currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [statement, setStatement] = useState(c.closureStatement ?? '');

  const student = state.students.find((s) => s.id === c.studentId)!;
  const conditions = closureConditions({ ...c, closureStatement: statement }, state.actions, state.contactRecords, state.entries);
  const allMet = conditions.every((cond) => cond.met);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Close case"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            portal="safeguarding"
            disabled={!allMet}
            onClick={() => {
              dispatch({ type: 'CLOSE_CASE', caseId: c.id, closureStatement: statement, actorId: currentUser.id });
              logAudit({
                actorId: currentUser.id,
                action: 'edit',
                entityType: 'case',
                entityId: c.id,
                entityLabel: `${studentName(student)}'s case`,
                context: 'Closed',
              });
              show('Case closed.');
              onClose();
            }}
          >
            Close case
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[15px] text-ink-body">All four conditions must be met before this case can be closed.</p>
        <ul className="flex flex-col gap-2">
          {conditions.map((cond) => (
            <li key={cond.key} className="flex items-start gap-2.5 rounded-[8px] border border-line px-3 py-2.5">
              {cond.met ? (
                <Check size={17} className="mt-0.5 shrink-0 text-steady" aria-hidden />
              ) : (
                <X size={17} className="mt-0.5 shrink-0 text-urgent" aria-hidden />
              )}
              <div>
                <p className={`text-[14px] font-medium ${cond.met ? 'text-ink' : 'text-urgent'}`}>{cond.label}</p>
                {!cond.met && <p className="text-[13px] text-ink-muted">{cond.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
        <TextAreaField
          label="Closure statement"
          hint="Explain why the concern is now resolved"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          maxLength={1000}
        />
      </div>
    </Modal>
  );
}
