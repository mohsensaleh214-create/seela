import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { SCHOOL_TIERS, classesBySchool, type SchoolTier } from '@/lib/school';
import type { AttendanceStatus } from '@/context/AppContext';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { PersonAvatar } from '@/components/ui/PersonAvatar';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; on: string }[] = [
  { value: 'present', label: 'Present', on: 'bg-steady text-white' },
  { value: 'late', label: 'Late', on: 'bg-caution text-white' },
  { value: 'absent', label: 'Absent', on: 'bg-urgent text-white' },
  { value: 'authorised', label: 'Authorised', on: 'bg-info text-white' },
];

export function Registration() {
  const { state, currentUser, now, dispatch } = useApp();
  const dateKey = format(now, 'yyyy-MM-dd');

  const [school, setSchool] = useState<SchoolTier | ''>('');
  const [tutorGroup, setTutorGroup] = useState('');

  const classMap = useMemo(() => classesBySchool(state.students), [state.students]);
  const classOptions = school ? (classMap.get(school) ?? []) : [];

  const roster = useMemo(() => {
    if (!tutorGroup) return [];
    return state.students.filter((s) => s.tutorGroup === tutorGroup).sort((a, b) => studentName(a).localeCompare(studentName(b)));
  }, [state.students, tutorGroup]);

  const presentCount = roster.filter((s) => state.attendanceMarks[`${dateKey}|${s.id}`]?.status === 'present').length;
  const markedCount = roster.filter((s) => state.attendanceMarks[`${dateKey}|${s.id}`]).length;

  return (
    <>
      <PageHeader
        title="Registration"
        description="Take today's class register. Notice something while you're here? Flag it straight away."
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
          School
          <select
            value={school}
            onChange={(e) => {
              setSchool(e.target.value as SchoolTier | '');
              setTutorGroup('');
            }}
            className="min-h-[44px] rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink"
          >
            <option value="">Choose a school</option>
            {SCHOOL_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
          Class
          <select
            value={tutorGroup}
            onChange={(e) => setTutorGroup(e.target.value)}
            disabled={!school}
            className="min-h-[44px] rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink disabled:bg-surface-sunken disabled:text-ink-muted"
          >
            <option value="">{school ? 'Choose a class' : 'Choose a school first'}</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {roster.length > 0 && (
          <p className="pb-2.5 text-[13px] text-ink-muted">
            {markedCount} of {roster.length} marked · {presentCount} present
          </p>
        )}
      </div>

      {!tutorGroup ? (
        <EmptyState icon={ClipboardList} title="Choose a school and class" body="Pick a class above to see today's register." />
      ) : (
        <div className="flex flex-col gap-2">
          {roster.map((s) => {
            const mark = state.attendanceMarks[`${dateKey}|${s.id}`];
            return (
              <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={studentName(s)} size={36} />
                  <div>
                    <Link to={`/students/${s.id}`} className="text-[15px] font-medium text-ink hover:underline">
                      {studentName(s)}
                    </Link>
                    <p className="text-[13px] text-ink-muted">
                      Year {s.yearGroup} · {s.tutorGroup}
                      {s.attendanceByWeek && ` · ${s.attendanceByWeek.at(-1)}% this week`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-[8px] border border-line-strong p-0.5" role="group" aria-label={`Attendance for ${studentName(s)}`}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={mark?.status === opt.value}
                        onClick={() => dispatch({ type: 'MARK_ATTENDANCE', studentId: s.id, dateKey, status: opt.value, actorId: currentUser.id })}
                        className={`rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                          mark?.status === opt.value ? opt.on : 'text-ink-body hover:bg-surface-sunken'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <Link
                    to={`/raise-concern?student=${s.id}`}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[12px] font-medium text-ink-body hover:bg-surface-sunken"
                    title={`Raise a concern about ${studentName(s)}`}
                  >
                    <ShieldAlert size={13} aria-hidden />
                    Flag
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
