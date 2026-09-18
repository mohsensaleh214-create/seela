import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName, staffName } from '@/lib/selectors';
import { SCHOOL_TIERS, classesBySchool, schoolTier, type SchoolTier } from '@/lib/school';

export interface MentionPerson {
  type: 'student' | 'staff';
  id: string;
  name: string;
}

export function PeopleMentionField({
  label,
  hint,
  text,
  onTextChange,
  people,
  onPeopleChange,
}: {
  label: string;
  hint?: string;
  text: string;
  onTextChange: (v: string) => void;
  people: MentionPerson[];
  onPeopleChange: (people: MentionPerson[]) => void;
}) {
  const { state } = useApp();
  const [school, setSchool] = useState<SchoolTier | ''>('');
  const [tutorGroup, setTutorGroup] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const atIndex = text.lastIndexOf('@');
  const mentionActive = atIndex !== -1 && !text.slice(atIndex + 1).includes(' ');
  const mentionQuery = mentionActive ? text.slice(atIndex + 1).toLowerCase() : '';

  const classMap = useMemo(() => classesBySchool(state.students), [state.students]);
  const classOptions = school ? (classMap.get(school) ?? []) : [];

  const staffMatches = useMemo(() => {
    if (!mentionActive) return [];
    return state.staff.filter((s) => staffName(s).toLowerCase().includes(mentionQuery)).slice(0, 5);
  }, [mentionActive, mentionQuery, state.staff]);

  const studentMatches = useMemo(() => {
    if (!mentionActive) return [];
    return state.students
      .filter((s) => studentName(s).toLowerCase().includes(mentionQuery))
      .filter((s) => !school || schoolTier(s.yearGroup) === school)
      .filter((s) => !tutorGroup || s.tutorGroup === tutorGroup)
      .slice(0, 6);
  }, [mentionActive, mentionQuery, state.students, school, tutorGroup]);

  function choose(person: MentionPerson) {
    onTextChange(text.slice(0, atIndex));
    if (!people.some((p) => p.id === person.id && p.type === person.type)) {
      onPeopleChange([...people, person]);
    }
    inputRef.current?.focus();
  }

  function removeChip(person: MentionPerson) {
    onPeopleChange(people.filter((p) => !(p.id === person.id && p.type === person.type)));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ink-muted" htmlFor="people-mention-input">
        {label}
      </label>
      {people.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {people.map((p) => (
            <span
              key={`${p.type}-${p.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken py-1 pl-1 pr-2 text-[13px] text-ink"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                  p.type === 'staff' ? 'bg-safeguarding' : 'bg-medical'
                }`}
                aria-hidden
              >
                {p.type === 'staff' ? 'T' : 'S'}
              </span>
              {p.name}
              <button
                type="button"
                onClick={() => removeChip(p)}
                aria-label={`Remove ${p.name}`}
                className="rounded-full p-0.5 text-ink-muted hover:bg-black/5"
              >
                <X size={12} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          id="people-mention-input"
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type @ to tag a teacher or student, or add a note"
          className="min-h-[44px] w-full rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-muted"
        />
        {mentionActive && (
          <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-line bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <div className="flex flex-wrap gap-2 border-b border-line px-3 py-2">
              <select
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value as SchoolTier | '');
                  setTutorGroup('');
                }}
                className="rounded-[6px] border border-line-strong bg-surface px-2 py-1 text-[12px] text-ink"
                aria-label="Filter students by school"
              >
                <option value="">Any school</option>
                {SCHOOL_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={tutorGroup}
                onChange={(e) => setTutorGroup(e.target.value)}
                disabled={!school}
                className="rounded-[6px] border border-line-strong bg-surface px-2 py-1 text-[12px] text-ink disabled:bg-surface-sunken disabled:text-ink-muted"
                aria-label="Filter students by class"
              >
                <option value="">Any class</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {staffMatches.length === 0 && studentMatches.length === 0 ? (
              <p className="px-3 py-3 text-[13px] text-ink-muted">No matches. Keep typing, or clear the filters above.</p>
            ) : (
              <>
                {staffMatches.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Staff</p>
                    {staffMatches.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => choose({ type: 'staff', id: s.id, name: staffName(s) })}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] text-ink hover:bg-surface-sunken"
                      >
                        {staffName(s)}
                        <span className="text-[12px] text-ink-muted">{s.jobTitle}</span>
                      </button>
                    ))}
                  </div>
                )}
                {studentMatches.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Students</p>
                    {studentMatches.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => choose({ type: 'student', id: s.id, name: studentName(s) })}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] text-ink hover:bg-surface-sunken"
                      >
                        {studentName(s)}
                        <span className="text-[12px] text-ink-muted">
                          Year {s.yearGroup} · {s.tutorGroup}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-[13px] text-ink-muted">{hint}</p>}
    </div>
  );
}
