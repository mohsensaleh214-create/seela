import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { studentName, staffName, canReadCase } from '@/lib/selectors';
import { daysBetween, lastMovementAt } from '@/lib/safeguarding';
import type { Case } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { StudentChip } from '@/components/ui/StudentChip';
import { LevelBadge, StatusPill } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { LockedPortal } from '@/components/LockedPortal';
import { BookOpen, Bookmark } from 'lucide-react';

export function Register() {
  const { state, currentUser, permissions, now } = useApp();
  const navigate = useNavigate();
  const { show } = useToast();

  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [category, setCategory] = useState('');
  const [savedViews, setSavedViews] = useState<string[]>([]);

  const readableCases = useMemo(
    () =>
      state.cases.filter((c) => {
        const student = state.students.find((s) => s.id === c.studentId);
        if (!student) return false;
        const actionOwnerIds = state.actions.filter((a) => a.caseId === c.id).map((a) => a.ownerId);
        return canReadCase(permissions, c, student, currentUser, actionOwnerIds);
      }),
    [state.cases, state.students, state.actions, permissions, currentUser],
  );

  const filtered = readableCases.filter((c) => {
    if (level && c.level !== level) return false;
    if (status && c.status !== status) return false;
    if (owner && c.ownerId !== owner) return false;
    if (category && c.category !== category) return false;
    return true;
  });

  const rows = filtered.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  const owners = state.staff.filter((s) => ['dsl', 'senior-dsl', 'pastoral-lead'].includes(s.role));
  const categories = Array.from(new Set(state.cases.map((c) => c.category)));

  const columns: Column<Case>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (c) => {
        const s = state.students.find((st) => st.id === c.studentId);
        return s ? <StudentChip student={s} /> : '—';
      },
    },
    { key: 'level', header: 'Level', render: (c) => <LevelBadge level={c.level} size="sm" /> },
    { key: 'status', header: 'Status', render: (c) => <StatusPill status={c.status} /> },
    { key: 'owner', header: 'Owner', render: (c) => (c.ownerId ? staffName(state.staff.find((s) => s.id === c.ownerId)) : '—') },
    {
      key: 'days',
      header: 'Days open',
      render: (c) => (c.status === 'open' ? `${daysBetween(c.reportedAt, now)}` : '—'),
    },
    {
      key: 'review',
      header: 'Next review',
      render: (c) => (c.nextReviewDue ? format(new Date(c.nextReviewDue), 'd MMM yyyy') : '—'),
    },
    {
      key: 'movement',
      header: 'Last movement',
      render: (c) => format(new Date(lastMovementAt(c, state.entries, state.actions, state.contactRecords)), 'd MMM yyyy'),
    },
  ];

  const chips = [
    level && { key: 'level', label: level, onRemove: () => setLevel('') },
    status && { key: 'status', label: status, onRemove: () => setStatus('') },
    owner && { key: 'owner', label: staffName(state.staff.find((s) => s.id === owner)), onRemove: () => setOwner('') },
    category && { key: 'category', label: category, onRemove: () => setCategory('') },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];

  if (permissions.safeguarding === 'none') return <LockedPortal portal="Safeguarding" />;

  return (
    <>
      <PageHeader
        title="Register and caseload"
        description="Every safeguarding case you can read, current and closed."
        actions={
          <Button
            variant="secondary"
            icon={<Bookmark size={15} />}
            onClick={() => {
              const name = `${level || 'All levels'} · ${status || 'All statuses'}`;
              setSavedViews((v) => Array.from(new Set([...v, name])));
              show('View saved for this session.');
            }}
          >
            Save this view
          </Button>
        }
      />

      {savedViews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {savedViews.map((v) => (
            <span key={v} className="rounded-full bg-surface-sunken px-3 py-1 text-[13px] text-ink-body">
              {v}
            </span>
          ))}
        </div>
      )}

      <FilterBar chips={chips}>
        <FilterSelect
          label="Level"
          value={level}
          onChange={setLevel}
          options={[
            { value: 'monitored', label: 'Monitored' },
            { value: 'elevated', label: 'Elevated' },
            { value: 'immediate', label: 'Immediate' },
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'untriaged', label: 'Untriaged' },
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <FilterSelect label="Owner" value={owner} onChange={setOwner} options={owners.map((o) => ({ value: o.id, label: staffName(o) }))} />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={categories.map((c) => ({ value: c, label: c }))} />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState icon={BookOpen} title="No cases match" body="Try clearing a filter." />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(c) => navigate(`/safeguarding/cases/${c.id}`)}
          rowLabel={(c) => `Open ${studentName(state.students.find((s) => s.id === c.studentId)!)}'s case`}
        />
      )}
    </>
  );
}
