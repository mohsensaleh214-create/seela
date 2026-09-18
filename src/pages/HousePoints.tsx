import { useMemo, useState } from 'react';
import { formatDistance } from 'date-fns';
import { Crown, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName, staffName } from '@/lib/selectors';
import { HOUSES, houseTone } from '@/lib/housePoints';
import { SCHOOL_TIERS, classesBySchool, type SchoolTier } from '@/lib/school';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { TextField } from '@/components/ui/FormField';
import { StudentChip } from '@/components/ui/StudentChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { HousePointsAwardPanel } from '@/components/HousePointsAwardPanel';

export function HousePoints() {
  const { state, now } = useApp();
  const [studentId, setStudentId] = useState('');
  const [query, setQuery] = useState('');
  const [school, setSchool] = useState<SchoolTier | ''>('');
  const [tutorGroup, setTutorGroup] = useState('');

  const totals = useMemo(() => {
    const map = new Map<string, number>(HOUSES.map((h) => [h, 0]));
    for (const a of state.housePointAwards) map.set(a.house, (map.get(a.house) ?? 0) + a.points);
    return HOUSES.map((h) => ({ house: h, points: map.get(h) ?? 0 })).sort((a, b) => b.points - a.points);
  }, [state.housePointAwards]);

  const maxPoints = Math.max(1, ...totals.map((t) => t.points));

  const classMap = useMemo(() => classesBySchool(state.students), [state.students]);
  const classOptions = school ? (classMap.get(school) ?? []) : [];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length >= 2) return state.students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 8);
    if (tutorGroup) return state.students.filter((s) => s.tutorGroup === tutorGroup).sort((a, b) => studentName(a).localeCompare(studentName(b)));
    return [];
  }, [query, tutorGroup, state.students]);

  const recent = useMemo(
    () => [...state.housePointAwards].sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()).slice(0, 15),
    [state.housePointAwards],
  );

  return (
    <>
      <PageHeader title="House points" description="Safa, Marwa and Arafat. Pick a student, tap a reason — that's it." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {totals.map((t, i) => {
          const tone = houseTone(t.house);
          return (
            <Card key={t.house} className="p-5" style={{ backgroundColor: tone.tint }}>
              <div className="flex items-center justify-between">
                <p className="text-[19px] font-semibold text-ink">{t.house}</p>
                {i === 0 && t.points > 0 && <Crown size={20} style={{ color: tone.deep }} aria-hidden />}
              </div>
              <p className="mt-1 text-[36px] font-semibold leading-none" style={{ color: tone.deep }}>
                {t.points}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
                <div className="h-full rounded-full" style={{ width: `${(t.points / maxPoints) * 100}%`, backgroundColor: tone.base }} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <CardTitle>Give points</CardTitle>
        {!studentId ? (
          <div className="mt-3 flex flex-col gap-4">
            <TextField label="Search for a student" hint="Type two or three letters of a name" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Omar" />
            <div className="flex items-center gap-3 text-[13px] text-ink-muted">
              <span className="h-px flex-1 bg-line" />
              or browse by class
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="flex flex-wrap gap-3">
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
            </div>
            {matches.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-[8px] border border-line">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentId(s.id);
                        setQuery('');
                      }}
                      className="flex w-full items-center px-3 py-2.5 text-left hover:bg-surface-sunken"
                    >
                      <StudentChip student={s} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <HousePointsAwardPanel studentId={studentId} />
            <button type="button" onClick={() => setStudentId('')} className="self-start text-[13px] font-medium text-ink-muted underline">
              Choose a different student
            </button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <CardTitle>Recent points</CardTitle>
        {recent.length === 0 ? (
          <EmptyState icon={Trophy} title="No points given yet" body="Awards will appear here as soon as you give them." />
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {recent.map((a) => {
              const student = state.students.find((s) => s.id === a.studentId);
              const tone = houseTone(a.house);
              return (
                <li key={a.id} className="flex items-center gap-2.5 text-[14px] text-ink-body">
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tone.base }} aria-hidden />
                  <span className="flex-1">
                    <span className="font-medium text-ink">{staffName(state.staff.find((s) => s.id === a.awardedById))}</span> gave{' '}
                    <span className="font-medium text-ink">
                      {a.points} point{a.points === 1 ? '' : 's'}
                    </span>{' '}
                    to <span className="font-medium text-ink">{student ? studentName(student) : 'a student'}</span> for {a.reason}
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-muted">{formatDistance(new Date(a.awardedAt), now, { addSuffix: true })}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
