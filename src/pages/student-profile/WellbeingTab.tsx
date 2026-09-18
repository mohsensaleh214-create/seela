import { format } from 'date-fns';
import { HeartHandshake } from 'lucide-react';
import type { WellbeingRecord, Student } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const MOOD_LABEL: Record<string, string> = { low: 'Low', mixed: 'Mixed', positive: 'Positive' };

export function WellbeingTab({ student, records }: { student: Student; records: WellbeingRecord[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No wellbeing records"
        body={`Nothing has been recorded for ${student.preferredName ?? student.firstName} yet.`}
      />
    );
  }

  const plans = records.filter((r) => r.type === 'support-plan');
  const others = records
    .filter((r) => r.type !== 'support-plan')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className="p-5">
          <div className="flex items-center justify-between">
            <CardTitle>Support plan</CardTitle>
            <span className={`text-[13px] font-medium ${plan.planStatus === 'active' ? 'text-steady' : 'text-ink-muted'}`}>
              {plan.planStatus === 'active' ? 'Active' : 'Closed'}
            </span>
          </div>
          <p className="mt-2 text-[15px] text-ink-body">{plan.summary}</p>
          {plan.goals && (
            <ul className="mt-3 flex flex-col gap-2">
              {plan.goals.map((g, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-[8px] bg-surface-sunken px-3 py-2">
                  <span className="text-[14px] text-ink">{g.goal}</span>
                  <span className="shrink-0 text-[13px] text-ink-muted">
                    {g.status} · review {format(new Date(g.reviewDate), 'd MMM')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      <Card className="p-5">
        <CardTitle>Recent record</CardTitle>
        <ul className="mt-3 flex flex-col gap-3">
          {others.map((r) => (
            <li key={r.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <p className="text-[13px] font-medium text-ink-muted">
                {r.type === 'check-in' ? 'Check-in' : r.type === 'pastoral-note' ? 'Pastoral note' : 'Counselling'}
                {r.mood && ` · Mood: ${MOOD_LABEL[r.mood]}`}
              </p>
              <p className="mt-0.5 text-[15px] text-ink-body">{r.summary}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">{format(new Date(r.createdAt), 'd MMM yyyy')}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
