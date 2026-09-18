import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName, staffName } from '@/lib/selectors';
import type { CaseCategory } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField, DateField } from '@/components/ui/FormField';
import { StudentChip } from '@/components/ui/StudentChip';
import { Banner } from '@/components/ui/Banner';

const CATEGORIES: CaseCategory[] = [
  'Peer relationships',
  'Emotional wellbeing',
  'Physical harm',
  'Neglect',
  'Online safety',
  'Attendance concern',
  'Family circumstances',
  'Behaviour',
];

const STEPS = ['Find the student', 'What happened', 'Others present', 'Review and submit'];

export function RaiseConcern() {
  const { state, currentUser, dispatch } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [done, setDone] = useState<string | null>(null);

  const [studentQuery, setStudentQuery] = useState('');
  const [studentId, setStudentId] = useState(searchParams.get('student') ?? '');
  const [category, setCategory] = useState<CaseCategory>('Peer relationships');
  const [occurredDate, setOccurredDate] = useState(new Date().toISOString().slice(0, 10));
  const [occurredTime, setOccurredTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [account, setAccount] = useState('');
  const [othersPresent, setOthersPresent] = useState('');
  const [hadDisclosure, setHadDisclosure] = useState(false);
  const [studentWords, setStudentWords] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const student = state.students.find((s) => s.id === studentId);

  const matches = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return state.students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 8);
  }, [studentQuery, state.students]);

  const step1Valid = !!studentId;
  const step2Valid = category && occurredDate && location.trim().length > 0 && account.trim().length >= 20;

  function submit() {
    if (!student) return;
    dispatch({
      type: 'RAISE_CONCERN',
      payload: {
        studentId: student.id,
        portal: 'safeguarding',
        category,
        occurredAt: new Date(`${occurredDate}T${occurredTime}`).toISOString(),
        location,
        account,
        studentWords: hadDisclosure ? studentWords : undefined,
        othersPresent: othersPresent || undefined,
        reportedById: currentUser.id,
      },
    });
    setDone(student.id);
  }

  if (done) {
    const doneStudent = state.students.find((s) => s.id === done)!;
    const dsl =
      state.staff.find((s) => s.role === 'dsl' && (s.campus === doneStudent.campus || s.campus === 'Both campuses')) ??
      state.staff.find((s) => s.role === 'senior-dsl')!;
    return (
      <>
        <PageHeader title="Raise a concern" />
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <CheckCircle2 size={40} className="text-steady" aria-hidden />
          <h2 className="text-[19px] font-semibold text-ink">Report submitted</h2>
          <p className="max-w-[52ch] text-[15px] leading-[1.55] text-ink-body">
            Thank you. This has gone to the safeguarding team for triage — {staffName(dsl)} will review it. You do not need to
            do anything else, and you will only see this again if you are given an action on it.
          </p>
          <p className="max-w-[52ch] text-[13px] text-ink-muted">
            If you believe {studentName(doneStudent)} is in immediate danger, do not wait for triage — contact the
            safeguarding team directly now.
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Return to Today
            </Button>
            <Link to={`/raise-concern`} className="inline-flex">
              <Button
                variant="ghost"
                onClick={() => {
                  setDone(null);
                  setStep(1);
                  setStudentId('');
                  setStudentQuery('');
                  setAccount('');
                  setLocation('');
                  setOthersPresent('');
                  setStudentWords('');
                  setHadDisclosure(false);
                  setConfirmed(false);
                }}
              >
                Raise another concern
              </Button>
            </Link>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Raise a concern" description="Available from anywhere in the portal. Takes about two minutes." />

      <ol className="flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state_ = n < step ? 'done' : n === step ? 'current' : 'upcoming';
          return (
            <li
              key={label}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                state_ === 'current'
                  ? 'bg-ink text-white'
                  : state_ === 'done'
                    ? 'bg-steady-tint text-steady-deep'
                    : 'bg-surface-sunken text-ink-muted'
              }`}
            >
              {state_ === 'done' && <CheckCircle2 size={14} aria-hidden />}
              {n}. {label}
            </li>
          );
        })}
      </ol>

      <Card className="p-6">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <TextField
              label="Search for a student"
              hint="Type two or three letters of a name"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="e.g. Soph"
              autoFocus
            />
            {matches.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-[8px] border border-line">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentId(s.id);
                        setStudentQuery('');
                      }}
                      className="flex w-full items-center px-3 py-2.5 text-left hover:bg-surface-sunken"
                    >
                      <StudentChip student={s} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {student && (
              <Banner tone="info">
                <span className="font-medium">Selected: </span>
                {studentName(student)}, Year {student.yearGroup} · {student.tutorGroup}
              </Banner>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as CaseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField label="Date it happened" value={occurredDate} onChange={(e) => setOccurredDate(e.target.value)} required />
              <TextField
                label="Approximate time"
                type="time"
                value={occurredTime}
                onChange={(e) => setOccurredTime(e.target.value)}
              />
            </div>
            <TextField label="Place" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Playground" required />
            <TextAreaField
              label="What happened"
              hint="A factual account of what you saw or were told."
              maxLength={2000}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              error={account.length > 0 && account.length < 20 ? 'Add a little more detail — at least 20 characters.' : undefined}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <TextField
              label="Who else was present"
              hint="Optional"
              value={othersPresent}
              onChange={(e) => setOthersPresent(e.target.value)}
              placeholder="e.g. None — one to one conversation"
            />
            <label className="inline-flex items-center gap-2 text-[15px] text-ink">
              <input type="checkbox" checked={hadDisclosure} onChange={(e) => setHadDisclosure(e.target.checked)} />
              The student disclosed something in their own words
            </label>
            {hadDisclosure && (
              <TextAreaField
                label="The student's own words"
                hint="As close to verbatim as you can recall"
                maxLength={1000}
                value={studentWords}
                onChange={(e) => setStudentWords(e.target.value)}
              />
            )}
          </div>
        )}

        {step === 4 && student && (
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col divide-y divide-line rounded-[8px] border border-line text-[15px]">
              <ReviewRow label="Student" value={`${studentName(student)}, Year ${student.yearGroup}`} />
              <ReviewRow label="Category" value={category} />
              <ReviewRow label="When" value={`${occurredDate} at ${occurredTime}`} />
              <ReviewRow label="Place" value={location} />
              <ReviewRow label="Account" value={account} />
              {othersPresent && <ReviewRow label="Others present" value={othersPresent} />}
              {hadDisclosure && studentWords && <ReviewRow label="Student's own words" value={studentWords} />}
            </dl>
            <Banner tone="caution">
              <p className="font-medium">This account cannot be edited after you submit it.</p>
              <p className="mt-1">Further updates are added as new entries on the case, keeping the original intact.</p>
            </Banner>
            <label className="inline-flex items-center gap-2 text-[15px] text-ink">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I understand this account cannot be edited after submission
            </label>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} icon={<ChevronLeft size={16} />}>
            Back
          </Button>
          {step < 4 ? (
            <Button
              variant="primary"
              portal="safeguarding"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
            >
              Continue
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" portal="safeguarding" onClick={submit} disabled={!confirmed}>
              Submit report
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-[13px] font-medium text-ink-muted">{label}</dt>
      <dd className="text-ink-body">{value}</dd>
    </div>
  );
}
