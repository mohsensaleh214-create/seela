import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone, Users, Video, Sparkles, Inbox, Wand2, MessageCircle, AlertTriangle, History } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName, canReadCase, canSeeStudentGuidance, medicalAccessFor, wellbeingAccessFor } from '@/lib/selectors';
import { tone } from '@/lib/portal-theme';
import { buildCallPrep } from '@/lib/callPrep';
import type { Student, HomeContactChannel, HomeContactDirection } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const CHANNEL_ICON: Record<HomeContactChannel, typeof Mail> = {
  email: Mail,
  phone: Phone,
  'in-person': Users,
  'video call': Video,
};

function loggingAddress(student: Student): string {
  const slug = `${student.firstName}.${student.lastName}`.toLowerCase().replace(/[^a-z.]/g, '');
  return `log+${slug}@seela.school`;
}

export function HomeCommunicationCard({ student }: { student: Student }) {
  const { state, currentUser, permissions } = useApp();
  const [logging, setLogging] = useState(false);
  const [prepping, setPrepping] = useState(false);

  const contacts = useMemo(
    () =>
      state.homeContacts
        .filter((c) => c.studentId === student.id)
        .sort((a, b) => new Date(b.contactedAt).getTime() - new Date(a.contactedAt).getTime()),
    [state.homeContacts, student.id],
  );

  const callPrep = useMemo(() => {
    const guidanceRestricted = !canSeeStudentGuidance(permissions, student, currentUser, state.dutyMode);
    const flags = guidanceRestricted
      ? []
      : state.flags.filter((f) => student.flagIds.includes(f.id) && f.visibleToRoles.includes(currentUser.role));

    const studentCases = state.cases.filter((c) => c.studentId === student.id);
    const readableCases = studentCases.filter((c) => {
      const actionOwnerIds = state.actions.filter((a) => a.caseId === c.id).map((a) => a.ownerId);
      return canReadCase(permissions, c, student, currentUser, actionOwnerIds);
    });
    const hasHiddenCases = studentCases.length > readableCases.length;

    const medicalAccess = medicalAccessFor(permissions, student, currentUser, state.dutyMode);
    const medicalRecords =
      medicalAccess !== 'none' && medicalAccess !== 'locked' ? state.medicalRecords.filter((m) => m.studentId === student.id) : [];

    const wellbeingAccess = wellbeingAccessFor(permissions, student, currentUser, state.dutyMode);
    const wellbeingRecords =
      wellbeingAccess !== 'none' && wellbeingAccess !== 'locked' ? state.wellbeingRecords.filter((w) => w.studentId === student.id) : [];

    return buildCallPrep({
      student,
      flags,
      readableCases,
      hasHiddenCases,
      medicalRecords,
      wellbeingRecords,
      homeContacts: contacts,
      guidanceRestricted,
    });
  }, [state, student, currentUser, permissions, contacts]);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Home communication</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Evidence contact with home without retyping it — confirm a prefilled prompt, or let it capture itself.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPrepping(true)}>
            <Wand2 size={13} aria-hidden />
            Prep for this call
          </Button>
          <SimulateInboundButton student={student} />
          <Button size="sm" variant="primary" portal="communication" onClick={() => setLogging(true)}>
            Log this email
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-[8px] bg-info-tint px-3 py-2 text-[13px] text-ink-body">
        <Inbox size={14} className="shrink-0 text-info" aria-hidden />
        <span>
          Emails to/from home for {student.preferredName ?? student.firstName} sent via{' '}
          <span className="font-medium text-ink">{loggingAddress(student)}</span> are matched here automatically — nothing to fill in.
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="mt-3">
          <EmptyState icon={Mail} title="No home communication logged yet" body="Use the buttons above to see how it works." />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {contacts.map((c) => {
            const Icon = CHANNEL_ICON[c.channel];
            const t = tone('communication');
            return (
              <li key={c.id} className="rounded-[8px] border border-line px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Icon size={14} style={{ color: t.accent }} aria-hidden />
                  <span className="text-[14px] font-medium text-ink">
                    {c.direction === 'outbound' ? 'To' : 'From'} {c.personSpoken} ({c.relationship})
                  </span>
                  {c.source === 'auto-captured' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-info-tint px-2 py-0.5 text-[11px] font-medium text-info">
                      <Sparkles size={10} aria-hidden /> Auto-captured
                    </span>
                  )}
                  <span className="text-[12px] text-ink-muted">
                    {format(new Date(c.contactedAt), "d MMM yyyy 'at' HH:mm")}
                  </span>
                </div>
                {c.subject && <p className="mt-1 text-[14px] font-medium text-ink-body">{c.subject}</p>}
                <p className="mt-0.5 text-[13px] text-ink-muted">{c.summary}</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Logged by {staffName(state.staff.find((s) => s.id === c.loggedById))}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <LogEmailModal open={logging} onClose={() => setLogging(false)} student={student} />
      <CallPrepModal open={prepping} onClose={() => setPrepping(false)} student={student} prep={callPrep} />
    </Card>
  );
}

function CallPrepModal({
  open,
  onClose,
  student,
  prep,
}: {
  open: boolean;
  onClose: () => void;
  student: Student;
  prep: ReturnType<typeof buildCallPrep>;
}) {
  const name = student.preferredName ?? student.firstName;
  return (
    <Modal open={open} onClose={onClose} title={`Call prep — ${name}`} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-5">
        <p className="flex items-start gap-2 rounded-[8px] bg-info-tint px-3 py-2.5 text-[13px] text-ink-body">
          <Wand2 size={15} className="mt-0.5 shrink-0 text-info" aria-hidden />
          Pulled together from medical, wellbeing, safeguarding and home-communication records you have access to — nothing you
          can't already see elsewhere. Use your judgement; this is a prompt, not a script.
        </p>

        <section>
          <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
            <MessageCircle size={15} className="text-steady" aria-hidden />
            Points to bring up
          </h4>
          <ul className="mt-2 flex flex-col gap-2">
            {prep.pointsToRaise.map((p, i) => (
              <li key={i} className="rounded-[8px] bg-surface-sunken px-3 py-2 text-[14px] text-ink-body">
                {p}
              </li>
            ))}
          </ul>
        </section>

        {prep.beMindfulOf.length > 0 && (
          <section>
            <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              <AlertTriangle size={15} className="text-caution-deep" aria-hidden />
              Be mindful of
            </h4>
            <ul className="mt-2 flex flex-col gap-2">
              {prep.beMindfulOf.map((p, i) => (
                <li key={i} className="rounded-[8px] bg-caution-tint px-3 py-2 text-[14px] text-ink-body">
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        {prep.recentContext.length > 0 && (
          <section>
            <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              <History size={15} className="text-ink-muted" aria-hidden />
              Recent context
            </h4>
            <ul className="mt-2 flex flex-col gap-2">
              {prep.recentContext.map((p, i) => (
                <li key={i} className="rounded-[8px] border border-line px-3 py-2 text-[14px] text-ink-body">
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}

function SimulateInboundButton({ student }: { student: Student }) {
  const { currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const guardian = student.guardians.find((g) => g.isPrimary) ?? student.guardians[0];

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        dispatch({
          type: 'LOG_HOME_CONTACT',
          actorId: currentUser.id,
          record: {
            studentId: student.id,
            channel: 'email',
            direction: 'inbound',
            personSpoken: guardian?.name ?? 'Parent/guardian',
            relationship: guardian?.relationship ?? 'Parent',
            subject: 'Re: your message',
            summary: `Auto-captured from the school mailbox — matched to ${student.preferredName ?? student.firstName} by parent email address. No staff action needed.`,
            loggedById: currentUser.id,
            contactedAt: new Date().toISOString(),
            source: 'auto-captured',
          },
        });
        logAudit({
          actorId: currentUser.id,
          action: 'create',
          entityType: 'home-contact',
          entityId: student.id,
          entityLabel: `an auto-captured home contact for ${student.firstName} ${student.lastName}`,
        });
        show('Auto-captured from the mailbox — nothing to fill in.');
      }}
      title="Demo: shows a reply landing in the log with zero staff effort"
    >
      <Sparkles size={13} aria-hidden />
      Simulate: parent replied
    </Button>
  );
}

function LogEmailModal({ open, onClose, student }: { open: boolean; onClose: () => void; student: Student }) {
  const { currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const guardian = student.guardians.find((g) => g.isPrimary) ?? student.guardians[0];

  const [direction, setDirection] = useState<HomeContactDirection>('outbound');
  const [subject, setSubject] = useState('Following up on today');
  const [summary, setSummary] = useState(`Update on ${student.preferredName ?? student.firstName} and agreed next step.`);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log this email"
      footer={
        <Button
          variant="primary"
          portal="communication"
          onClick={() => {
            dispatch({
              type: 'LOG_HOME_CONTACT',
              actorId: currentUser.id,
              record: {
                studentId: student.id,
                channel: 'email',
                direction,
                personSpoken: guardian?.name ?? 'Parent/guardian',
                relationship: guardian?.relationship ?? 'Parent',
                subject,
                summary,
                loggedById: currentUser.id,
                contactedAt: new Date().toISOString(),
                source: 'logged',
              },
            });
            logAudit({
              actorId: currentUser.id,
              action: 'create',
              entityType: 'home-contact',
              entityId: student.id,
              entityLabel: `a home contact for ${student.firstName} ${student.lastName}`,
            });
            show('Logged.');
            onClose();
          }}
        >
          Confirm &amp; log
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-muted">
          This mimics a one-click mail add-in (the same pattern CPOMS/MyConcern use in Outlook): everything below is
          prefilled from the email you're looking at — just confirm it.
        </p>
        <div className="rounded-[8px] border border-line bg-surface-sunken px-3 py-2.5 text-[13px] text-ink-body">
          <p>
            <span className="text-ink-muted">From </span>
            {direction === 'outbound' ? currentUser.email : `${guardian?.name ?? 'Parent/guardian'} (${guardian?.relationship ?? 'Parent'})`}
          </p>
          <p>
            <span className="text-ink-muted">To </span>
            {direction === 'outbound' ? `${guardian?.name ?? 'Parent/guardian'} (${guardian?.relationship ?? 'Parent'})` : currentUser.email}
          </p>
        </div>
        <SelectField label="Direction" value={direction} onChange={(e) => setDirection(e.target.value as HomeContactDirection)}>
          <option value="outbound">I sent this</option>
          <option value="inbound">I received this</option>
        </SelectField>
        <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <TextAreaField label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
    </Modal>
  );
}
