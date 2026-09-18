import { Link } from 'react-router-dom';
import { PersonAvatar } from './PersonAvatar';
import type { Student } from '@/lib/types';
import { studentName } from '@/lib/selectors';

export function StudentChip({ student, subtitle, linkTo }: { student: Student; subtitle?: string; linkTo?: string }) {
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <PersonAvatar name={studentName(student)} size={32} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[15px] font-medium text-ink">{studentName(student)}</span>
        <span className="text-[13px] text-ink-muted">{subtitle ?? `Year ${student.yearGroup} · ${student.tutorGroup}`}</span>
      </span>
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="rounded-[8px] hover:underline">
        {content}
      </Link>
    );
  }
  return content;
}
