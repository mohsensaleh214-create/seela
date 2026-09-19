import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { SCHOOL_TIERS, classesBySchool, type SchoolTier } from '@/lib/school';
import { TextField } from '@/components/ui/FormField';
import { StudentChip } from '@/components/ui/StudentChip';
import type { Student } from '@/lib/types';

/**
 * The standard way to find one student out of the whole school: narrow by
 * school section and class first, then type a name — never a single flat
 * dropdown of every student, which is unusable past a couple of classes.
 */
export function StudentPicker({ onSelect, autoFocusSearch }: { onSelect: (student: Student) => void; autoFocusSearch?: boolean }) {
  const { state } = useApp();
  const [school, setSchool] = useState<SchoolTier | ''>('');
  const [tutorGroup, setTutorGroup] = useState('');
  const [query, setQuery] = useState('');

  const classMap = useMemo(() => classesBySchool(state.students), [state.students]);
  const classOptions = school ? (classMap.get(school) ?? []) : [];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length >= 2) return state.students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 8);
    if (tutorGroup) return state.students.filter((s) => s.tutorGroup === tutorGroup).sort((a, b) => studentName(a).localeCompare(studentName(b)));
    return [];
  }, [query, tutorGroup, state.students]);

  return (
    <div className="flex flex-col gap-4">
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
      <div className="flex items-center gap-3 text-[13px] text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        or type a name
        <span className="h-px flex-1 bg-line" />
      </div>
      <TextField
        label="Search for a student"
        hint="Type two or three letters of a name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Soph"
        autoFocus={autoFocusSearch}
      />
      {matches.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-[8px] border border-line">
          {matches.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onSelect(s)} className="flex w-full items-center px-3 py-2.5 text-left hover:bg-surface-sunken">
                <StudentChip student={s} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
