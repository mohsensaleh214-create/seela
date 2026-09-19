import { useMemo, useState } from 'react';
import { Timeline } from '@/components/ui/Timeline';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import type { TimelineItem } from '@/lib/timeline';
import type { Student, Staff } from '@/lib/types';
import { useApp } from '@/context/AppContext';

const PORTAL_OPTIONS = [
  { value: 'medical', label: 'Medical' },
  { value: 'wellbeing', label: 'Wellbeing' },
  { value: 'safeguarding', label: 'Safeguarding' },
  { value: 'communication', label: 'Communication' },
];

const SIGNIFICANT_TYPES = new Set([
  'Concern raised',
  'Triaged',
  'Level of concern changed',
  'Case closed',
  'Contact home',
  'Nurse visit',
  'Healthcare plan',
  'Allergy record',
  'Support plan',
  'Counselling',
  'System flag',
  'Home contact logged',
  'Home contact · auto-captured',
]);

export function TimelineTab({
  items,
  onAcknowledgeFlag,
  onDismissFlag,
}: {
  items: TimelineItem[];
  student: Student;
  onAcknowledgeFlag: (id: string) => void;
  onDismissFlag: (id: string, reason: string) => void;
}) {
  const { state } = useApp();
  const [portal, setPortal] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [density, setDensity] = useState<'all' | 'significant'>('all');

  const typeOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.typeLabel))).map((t) => ({ value: t, label: t })),
    [items],
  );

  const filtered = items.filter((i) => {
    if (portal && i.portal !== portal) return false;
    if (type && i.typeLabel !== type) return false;
    if (from && new Date(i.at) < new Date(from)) return false;
    if (to && new Date(i.at) > new Date(to)) return false;
    if (density === 'significant' && !i.isPatternFlag && !SIGNIFICANT_TYPES.has(i.typeLabel)) return false;
    return true;
  });

  const chips = [
    portal && { key: 'portal', label: PORTAL_OPTIONS.find((o) => o.value === portal)?.label ?? portal, onRemove: () => setPortal('') },
    type && { key: 'type', label: type, onRemove: () => setType('') },
    from && { key: 'from', label: `From ${from}`, onRemove: () => setFrom('') },
    to && { key: 'to', label: `To ${to}`, onRemove: () => setTo('') },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];

  const getStaff = (id: string): Staff | undefined => state.staff.find((s) => s.id === id);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar chips={chips}>
        <FilterSelect label="Portal" value={portal} onChange={setPortal} options={PORTAL_OPTIONS} />
        <FilterSelect label="Type" value={type} onChange={setType} options={typeOptions} />
        <label className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-[8px] border border-line-strong bg-surface px-2 py-1.5 text-[13px]"
          />
        </label>
        <label className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-[8px] border border-line-strong bg-surface px-2 py-1.5 text-[13px]"
          />
        </label>
        <div className="ml-auto inline-flex rounded-[8px] border border-line-strong p-0.5" role="group" aria-label="Density">
          {(['all', 'significant'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              aria-pressed={density === d}
              className={`rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium ${
                density === d ? 'bg-ink text-white' : 'text-ink-body hover:bg-surface-sunken'
              }`}
            >
              {d === 'all' ? 'All events' : 'Significant only'}
            </button>
          ))}
        </div>
      </FilterBar>

      {filtered.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-line bg-surface-sunken px-4 py-10 text-center text-[15px] text-ink-muted">
          No events match these filters.
        </p>
      ) : (
        <Timeline items={filtered} getStaff={getStaff} onAcknowledgeFlag={onAcknowledgeFlag} onDismissFlag={onDismissFlag} />
      )}
    </div>
  );
}
