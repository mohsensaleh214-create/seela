import { format, differenceInYears } from 'date-fns';
import type { Student, Flag } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { SeverityDot } from '@/components/ui/Badge';

export function OverviewTab({ student, flags }: { student: Student; flags: Flag[] }) {
  const age = differenceInYears(new Date(), new Date(student.dateOfBirth));
  const latestAttendance = student.attendanceByWeek?.at(-1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card className="p-5">
          <CardTitle>What staff need to know</CardTitle>
          {flags.length === 0 ? (
            <p className="mt-2 text-[15px] text-ink-muted">Nothing flagged for this student right now.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {flags.map((f) => (
                <li key={f.id} className="flex items-start gap-2.5 rounded-[8px] bg-surface-sunken px-3 py-3">
                  <span className="mt-1.5">
                    <SeverityDot severity={f.severity} />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium text-ink">{f.label}</p>
                    <p className="mt-0.5 text-[15px] leading-[1.55] text-ink-body">{f.guidance}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <CardTitle>Quick facts</CardTitle>
          <dl className="mt-3 flex flex-col gap-2 text-[15px]">
            <Row label="Year group" value={`Year ${student.yearGroup}`} />
            <Row label="Tutor group" value={student.tutorGroup} />
            <Row label="Campus" value={student.campus} />
            <Row label="Age" value={`${age}`} />
            <Row label="Date of birth" value={format(new Date(student.dateOfBirth), 'd MMM yyyy')} />
            {latestAttendance !== undefined && <Row label="Attendance this week" value={`${latestAttendance}%`} />}
          </dl>
        </Card>
        <Card className="p-5">
          <CardTitle>Guardians</CardTitle>
          <ul className="mt-3 flex flex-col gap-2">
            {student.guardians.map((g) => (
              <li key={g.name} className="text-[15px]">
                <p className="text-ink">
                  {g.name} {g.isPrimary && <span className="text-[13px] text-ink-muted">(primary)</span>}
                </p>
                <p className="text-[13px] text-ink-muted">
                  {g.relationship} · {g.phone}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
