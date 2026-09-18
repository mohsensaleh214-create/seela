import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import type { Case, Student } from '@/lib/types';
import { LevelBadge, StatusPill } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export function SafeguardingTab({ student, cases }: { student: Student; cases: Case[] }) {
  if (cases.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No safeguarding history"
        body={`There is no safeguarding history for ${student.preferredName ?? student.firstName}.`}
      />
    );
  }

  const sorted = [...cases].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((c) => (
        <Link key={c.id} to={`/safeguarding/cases/${c.id}`}>
          <Card className="flex flex-col gap-2 p-4 hover:bg-surface-sunken">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={c.status} />
              <LevelBadge level={c.level} size="sm" />
              <span className="text-[13px] text-ink-muted">Reported {format(new Date(c.reportedAt), 'd MMM yyyy')}</span>
            </div>
            <p className="text-[15px] font-medium text-ink">{c.category}</p>
            {c.status === 'closed' && c.closureStatement && (
              <p className="line-clamp-2 text-[14px] text-ink-muted">{c.closureStatement}</p>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
