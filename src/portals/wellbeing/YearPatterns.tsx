import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PortalHeader } from '@/components/PortalHeader';
import { LockedPortal } from '@/components/LockedPortal';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const MOOD_COLOR: Record<string, string> = { positive: 'bg-steady', mixed: 'bg-caution', low: 'bg-urgent' };

export function YearPatterns() {
  const { state, permissions } = useApp();

  if (permissions.wellbeing === 'none') return <LockedPortal portal="Wellbeing" />;

  const byYear = useMemo(() => {
    const map = new Map<number, { positive: number; mixed: number; low: number }>();
    for (const r of state.wellbeingRecords) {
      if (r.type !== 'check-in' || !r.mood) continue;
      const s = state.students.find((st) => st.id === r.studentId);
      if (!s) continue;
      const bucket = map.get(s.yearGroup) ?? { positive: 0, mixed: 0, low: 0 };
      bucket[r.mood] += 1;
      map.set(s.yearGroup, bucket);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [state.wellbeingRecords, state.students]);

  return (
    <>
      <PortalHeader portal="wellbeing" title="Year and house patterns" description="Check-in moods grouped by year, drawn from the dummy data." />

      {byYear.length === 0 ? (
        <EmptyState title="No check-ins recorded yet" body="Once check-ins are logged, mood patterns by year group will appear here." />
      ) : (
        <div className="flex flex-col gap-4">
          {byYear.map(([year, counts]) => {
            const total = counts.positive + counts.mixed + counts.low;
            return (
              <Card key={year} className="p-5">
                <div className="flex items-center justify-between">
                  <CardTitle>Year {year}</CardTitle>
                  <span className="text-[13px] text-ink-muted">{total} check-ins</span>
                </div>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-sunken">
                  {(['positive', 'mixed', 'low'] as const).map((mood) => (
                    <div key={mood} className={MOOD_COLOR[mood]} style={{ width: `${(counts[mood] / total) * 100}%` }} title={`${mood}: ${counts[mood]}`} />
                  ))}
                </div>
                <div className="mt-2 flex gap-4 text-[13px] text-ink-muted">
                  <span>Positive: {counts.positive}</span>
                  <span>Mixed: {counts.mixed}</span>
                  <span>Low: {counts.low}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
