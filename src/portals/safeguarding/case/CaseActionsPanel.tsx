import { useState } from 'react';
import { format } from 'date-fns';
import { Phone, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName, studentName } from '@/lib/selectors';
import { reviewUrgency, daysBetween } from '@/lib/safeguarding';
import type { Case, LevelOfConcern } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionItem } from '@/components/ui/ActionItem';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField, DateField } from '@/components/ui/FormField';
import { LevelBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { CloseCaseModal } from './CloseCaseModal';

const URGENCY_TEXT = { ok: 'text-ink', caution: 'text-caution', urgent: 'text-urgent' } as const;

export function CaseActionsPanel({ c }: { c: Case }) {
  const { state, currentUser, permissions, now, dispatch, logAudit } = useApp();
  const { show } = useToast();

  const [addingAction, setAddingAction] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const [addingException, setAddingException] = useState(false);
  const [addingReview, setAddingReview] = useState(false);
  const [changingLevel, setChangingLevel] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  const student = state.students.find((s) => s.id === c.studentId)!;
  const actions = state.actions.filter((a) => a.caseId === c.id).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const contacts = state.contactRecords.filter((r) => r.caseId === c.id).sort((a, b) => new Date(b.contactedAt).getTime() - new Date(a.contactedAt).getTime());

  const urgency = reviewUrgency(c, now);
  const isOwner = c.ownerId === currentUser.id;
  const canAct = c.status === 'open';

  return (
    <div className="flex flex-col gap-4">
      {c.status === 'open' && (
        <Card className="p-5">
          <p className="text-[13px] font-medium text-ink-muted">Clock</p>
          <p className="mt-1 text-[15px] text-ink">
            Open {daysBetween(c.reportedAt, now)} {daysBetween(c.reportedAt, now) === 1 ? 'day' : 'days'}
          </p>
          {c.nextReviewDue && (
            <p className={`mt-1 text-[15px] font-medium ${URGENCY_TEXT[urgency]}`}>
              {urgency === 'urgent' ? 'Review overdue: ' : 'Next review: '}
              {format(new Date(c.nextReviewDue), 'd MMM yyyy')}
            </p>
          )}
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <CardTitle>Actions</CardTitle>
          {canAct && (
            <button type="button" onClick={() => setAddingAction(true)} className="text-[13px] font-medium text-safeguarding hover:underline">
              Add action
            </button>
          )}
        </div>
        {actions.length === 0 ? (
          <p className="mt-2 text-[14px] text-ink-muted">No actions yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {actions.map((a) => (
              <ActionItem
                key={a.id}
                action={a}
                owner={state.staff.find((s) => s.id === a.ownerId)}
                now={now}
                onComplete={canAct && !a.completedAt ? () => setCompletingId(a.id) : undefined}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <CardTitle>Contact home</CardTitle>
        </div>
        {contacts.length === 0 ? (
          <p className="mt-2 text-[14px] text-ink-muted">No contact recorded yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {contacts.map((r) => (
              <li key={r.id} className="rounded-[8px] border border-line px-3 py-2.5">
                {r.isException ? (
                  <>
                    <p className="flex items-center gap-1.5 text-[14px] font-medium text-caution">
                      <ShieldAlert size={14} aria-hidden />
                      Exception: {r.exceptionReason}
                    </p>
                    <p className="mt-1 text-[13px] text-ink-body">{r.alternativeAction}</p>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {r.authorisedById
                        ? `Authorised by ${staffName(state.staff.find((s) => s.id === r.authorisedById))}`
                        : 'Awaiting senior DSL authorisation'}
                    </p>
                    {!r.authorisedById && permissions.authoriseContactException && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => {
                          dispatch({ type: 'AUTHORISE_CONTACT_EXCEPTION', recordId: r.id, actorId: currentUser.id });
                          logAudit({
                            actorId: currentUser.id,
                            action: 'edit',
                            entityType: 'case',
                            entityId: c.id,
                            entityLabel: `the contact exception on ${studentName(student)}'s case`,
                            context: 'Authorised',
                          });
                          show('Exception authorised.');
                        }}
                      >
                        Authorise
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-[14px] font-medium text-ink">
                      <Phone size={14} aria-hidden />
                      {r.personSpoken} ({r.relationship}) · {r.method}
                    </p>
                    <p className="mt-1 text-[13px] text-ink-body">{r.discussed}</p>
                    <p className="mt-1 text-[13px] text-ink-body">Agreed: {r.agreed}</p>
                  </>
                )}
                <p className="mt-1 text-[12px] text-ink-muted">{format(new Date(r.contactedAt), 'd MMM yyyy, HH:mm')}</p>
              </li>
            ))}
          </ul>
        )}
        {canAct && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAddingContact(true)}>
              Record contact
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingException(true)}>
              Record exception
            </Button>
          </div>
        )}
      </Card>

      {canAct && (
        <Card className="flex flex-col gap-2 p-5">
          <CardTitle>Case actions</CardTitle>
          <Button variant="secondary" onClick={() => setAddingReview(true)}>
            Add review
          </Button>
          {permissions.levelAction !== 'none' && (
            <Button variant="secondary" onClick={() => setChangingLevel(true)}>
              {permissions.levelAction === 'propose' ? 'Propose level change' : 'Change level'}
            </Button>
          )}
          {permissions.closeCase && (isOwner || permissions.safeguarding === 'all-campuses') && (
            <Button variant="primary" portal="safeguarding" onClick={() => setClosing(true)}>
              Close case
            </Button>
          )}
        </Card>
      )}

      {c.status === 'closed' && permissions.closeCase && (
        <Card className="p-5">
          <Button variant="secondary" onClick={() => setReopening(true)}>
            Reopen case
          </Button>
        </Card>
      )}

      {/* Modals */}
      <AddActionModal open={addingAction} onClose={() => setAddingAction(false)} c={c} />
      <CompleteActionModal actionId={completingId} onClose={() => setCompletingId(null)} />
      <ContactModal open={addingContact} onClose={() => setAddingContact(false)} c={c} isException={false} />
      <ContactModal open={addingException} onClose={() => setAddingException(false)} c={c} isException />
      <ReviewModal open={addingReview} onClose={() => setAddingReview(false)} c={c} />
      <ChangeLevelModal open={changingLevel} onClose={() => setChangingLevel(false)} c={c} />
      <CloseCaseModal open={closing} onClose={() => setClosing(false)} c={c} />
      <ReopenModal open={reopening} onClose={() => setReopening(false)} c={c} />
    </div>
  );
}

function AddActionModal({ open, onClose, c }: { open: boolean; onClose: () => void; c: Case }) {
  const { state, currentUser, dispatch } = useApp();
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [dueAt, setDueAt] = useState('');
  const owners = state.staff.filter((s) => ['dsl', 'senior-dsl', 'pastoral-lead', 'nurse'].includes(s.role));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add action"
      footer={
        <Button
          variant="primary"
          portal="safeguarding"
          disabled={!description || !dueAt}
          onClick={() => {
            dispatch({ type: 'ADD_ACTION', caseId: c.id, description, ownerId, dueAt: new Date(dueAt).toISOString(), actorId: currentUser.id });
            setDescription('');
            setDueAt('');
            onClose();
          }}
        >
          Add action
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <SelectField label="Owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {staffName(o)}
            </option>
          ))}
        </SelectField>
        <DateField label="Due date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
      </div>
    </Modal>
  );
}

function CompleteActionModal({ actionId, onClose }: { actionId: string | null; onClose: () => void }) {
  const { currentUser, dispatch } = useApp();
  const [outcome, setOutcome] = useState('');

  return (
    <Modal
      open={!!actionId}
      onClose={onClose}
      title="Complete action"
      footer={
        <Button
          variant="primary"
          portal="safeguarding"
          disabled={!outcome}
          onClick={() => {
            if (actionId) dispatch({ type: 'COMPLETE_ACTION', actionId, outcome, actorId: currentUser.id });
            setOutcome('');
            onClose();
          }}
        >
          Mark complete
        </Button>
      }
    >
      <TextAreaField label="Outcome" hint="What happened" value={outcome} onChange={(e) => setOutcome(e.target.value)} required />
    </Modal>
  );
}

function ContactModal({ open, onClose, c, isException }: { open: boolean; onClose: () => void; c: Case; isException: boolean }) {
  const { currentUser, permissions, dispatch, logAudit } = useApp();
  const [method, setMethod] = useState<'phone' | 'in person' | 'video call' | 'letter'>('phone');
  const [personSpoken, setPersonSpoken] = useState('');
  const [relationship, setRelationship] = useState('');
  const [discussed, setDiscussed] = useState('');
  const [agreed, setAgreed] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [alternativeAction, setAlternativeAction] = useState('');

  const canSubmit = isException ? exceptionReason && alternativeAction : personSpoken && discussed && agreed;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isException ? 'Record contact exception' : 'Record contact home'}
      footer={
        <Button
          variant="primary"
          portal="safeguarding"
          disabled={!canSubmit}
          onClick={() => {
            dispatch({
              type: 'ADD_CONTACT_RECORD',
              actorId: currentUser.id,
              record: {
                caseId: c.id,
                method,
                contactedAt: new Date().toISOString(),
                contactedById: currentUser.id,
                personSpoken: isException ? '' : personSpoken,
                relationship: isException ? '' : relationship,
                discussed: isException ? '' : discussed,
                agreed: isException ? '' : agreed,
                nextStep: isException ? '' : nextStep,
                isException,
                exceptionReason: isException ? exceptionReason : undefined,
                alternativeAction: isException ? alternativeAction : undefined,
                authorisedById: isException && permissions.authoriseContactException ? currentUser.id : undefined,
              },
            });
            logAudit({
              actorId: currentUser.id,
              action: 'create',
              entityType: 'case',
              entityId: c.id,
              entityLabel: isException ? 'a contact exception' : 'a contact-home record',
            });
            onClose();
          }}
        >
          Save
        </Button>
      }
    >
      {isException ? (
        <div className="flex flex-col gap-4">
          <TextAreaField label="Reason contact could not be made" value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} required />
          <TextAreaField label="Alternative action taken" value={alternativeAction} onChange={(e) => setAlternativeAction(e.target.value)} required />
          {!permissions.authoriseContactException && (
            <p className="text-[13px] text-ink-muted">This will be sent to the senior DSL for authorisation.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SelectField label="Method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="phone">Phone</option>
            <option value="in person">In person</option>
            <option value="video call">Video call</option>
            <option value="letter">Letter</option>
          </SelectField>
          <TextField label="Person spoken to" value={personSpoken} onChange={(e) => setPersonSpoken(e.target.value)} required />
          <TextField label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} required />
          <TextAreaField label="What was discussed" value={discussed} onChange={(e) => setDiscussed(e.target.value)} required />
          <TextAreaField label="What was agreed" value={agreed} onChange={(e) => setAgreed(e.target.value)} required />
          <TextField label="Next step" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}

function ReviewModal({ open, onClose, c }: { open: boolean; onClose: () => void; c: Case }) {
  const { currentUser, dispatch } = useApp();
  const [body, setBody] = useState('');
  const [nextReviewDue, setNextReviewDue] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add review"
      footer={
        <Button
          variant="primary"
          portal="safeguarding"
          disabled={!body}
          onClick={() => {
            dispatch({
              type: 'ADD_REVIEW',
              caseId: c.id,
              body,
              nextReviewDue: nextReviewDue ? new Date(nextReviewDue).toISOString() : undefined,
              actorId: currentUser.id,
            });
            setBody('');
            setNextReviewDue('');
            onClose();
          }}
        >
          Save review
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <TextAreaField label="Review notes" value={body} onChange={(e) => setBody(e.target.value)} required />
        <DateField label="Next review due" hint="Optional — leave blank to keep the current date" value={nextReviewDue} onChange={(e) => setNextReviewDue(e.target.value)} />
      </div>
    </Modal>
  );
}

function ChangeLevelModal({ open, onClose, c }: { open: boolean; onClose: () => void; c: Case }) {
  const { currentUser, permissions, dispatch, logAudit } = useApp();
  const [level, setLevel] = useState<LevelOfConcern>(c.level);
  const [note, setNote] = useState('');
  const { show } = useToast();

  const isPropose = permissions.levelAction === 'propose';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isPropose ? 'Propose level change' : 'Change level of concern'}
      footer={
        <Button
          variant="primary"
          portal="safeguarding"
          disabled={!note}
          onClick={() => {
            if (isPropose) {
              dispatch({
                type: 'ADD_ENTRY',
                caseId: c.id,
                entryType: 'note',
                body: `Proposed changing the level of concern to ${level}: ${note}`,
                actorId: currentUser.id,
              });
              show('Proposal sent to the senior DSL.');
            } else {
              dispatch({ type: 'SET_LEVEL', caseId: c.id, level, actorId: currentUser.id, note });
              logAudit({
                actorId: currentUser.id,
                action: 'edit',
                entityType: 'case',
                entityId: c.id,
                entityLabel: 'the level of concern',
                context: `Changed to ${level}`,
              });
              show('Level of concern updated.');
            }
            setNote('');
            onClose();
          }}
        >
          {isPropose ? 'Send proposal' : 'Save'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-ink-muted">Currently:</span>
          <LevelBadge level={c.level} size="sm" />
        </div>
        <SelectField label="New level" value={level} onChange={(e) => setLevel(e.target.value as LevelOfConcern)}>
          <option value="monitored">Monitored</option>
          <option value="elevated">Elevated</option>
          <option value="immediate">Immediate</option>
        </SelectField>
        <TextAreaField label="Reason" value={note} onChange={(e) => setNote(e.target.value)} required />
      </div>
    </Modal>
  );
}

function ReopenModal({ open, onClose, c }: { open: boolean; onClose: () => void; c: Case }) {
  const { currentUser, dispatch } = useApp();
  const [reason, setReason] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reopen case"
      footer={
        <Button
          variant="primary"
          portal="safeguarding"
          disabled={!reason}
          onClick={() => {
            dispatch({ type: 'REOPEN_CASE', caseId: c.id, reason, actorId: currentUser.id });
            setReason('');
            onClose();
          }}
        >
          Reopen
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-[15px] text-ink-body">
          This creates a new open case. The original closed record is preserved and linked, never overwritten.
        </p>
        <TextAreaField label="Reason for reopening" value={reason} onChange={(e) => setReason(e.target.value)} required />
      </div>
    </Modal>
  );
}
