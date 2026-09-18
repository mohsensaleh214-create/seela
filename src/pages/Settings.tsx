import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName } from '@/lib/selectors';
import { PERMISSIONS } from '@/lib/permissions';
import type { Role } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Card, CardTitle } from '@/components/ui/Card';
import { Banner } from '@/components/ui/Banner';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { AuditEntry } from '@/components/ui/AuditEntry';
import { EmptyState } from '@/components/ui/EmptyState';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { DemoControls } from '@/components/DemoControls';

const ROLE_ORDER: Role[] = ['teacher', 'pastoral-lead', 'nurse', 'dsl', 'senior-dsl'];

const MATRIX_ROWS: { label: string; get: (r: Role) => string }[] = [
  { label: 'Raise a concern, any portal', get: () => 'Yes' },
  { label: 'See student guidance line', get: (r) => ({ all: 'All', 'own-year': 'Own year', 'own-students': 'Own students', 'own-campus': 'Own campus', none: '—' } as const)[PERMISSIONS[r].guidanceScope] },
  { label: 'Read medical records', get: (r) => ({ none: 'No', summary: 'Summary', full: 'Full' } as const)[PERMISSIONS[r].medical] },
  { label: 'Read wellbeing records', get: (r) => ({ none: 'No', 'own-year-full': 'Full, own year', full: 'Full' } as const)[PERMISSIONS[r].wellbeing] },
  { label: 'Read safeguarding cases', get: (r) => ({ none: 'No', 'assigned-only': 'Assigned only', 'own-campus': 'All, own campus', 'all-campuses': 'All campuses' } as const)[PERMISSIONS[r].safeguarding] },
  { label: 'Triage a report', get: (r) => (PERMISSIONS[r].triage ? 'Yes' : 'No') },
  { label: 'Set or change level', get: (r) => ({ none: 'No', propose: 'Propose', set: 'Yes' } as const)[PERMISSIONS[r].levelAction] },
  { label: 'Own a case', get: (r) => (PERMISSIONS[r].ownCase === 'if-assigned' ? 'If assigned' : 'Yes') },
  { label: 'Close a case', get: (r) => (PERMISSIONS[r].closeCase ? 'Yes' : 'No') },
  { label: 'Authorise a contact-home exception', get: (r) => (PERMISSIONS[r].authoriseContactException ? 'Yes' : 'No') },
  { label: 'See the stalled view', get: (r) => ({ none: 'No', 'own-year': 'Own year', 'own-students': 'Own students', 'own-campus': 'Own campus', all: 'All' } as const)[PERMISSIONS[r].stalledScope] },
  { label: 'Read the audit log', get: (r) => ({ none: 'No', 'own-campus': 'Own campus', all: 'All' } as const)[PERMISSIONS[r].auditScope] },
];

export function Settings() {
  const { currentUser, permissions } = useApp();
  const [tab, setTab] = useState('profile');

  const tabs: TabItem[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'audit', label: 'Audit log' },
    { key: 'demo', label: 'Demo controls' },
  ];

  return (
    <>
      <PageHeader title="Settings" description={`Signed in as ${staffName(currentUser)}, ${permissions.shortLabel}.`} />
      <Tabs items={tabs} active={tab} onChange={setTab} />

      {tab === 'profile' && <ProfileTab />}
      {tab === 'permissions' && <PermissionsTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'demo' && <DemoTab />}
    </>
  );
}

function ProfileTab() {
  const { currentUser } = useApp();
  const [notifyAssigned, setNotifyAssigned] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <CardTitle>Your details</CardTitle>
        <dl className="mt-3 flex flex-col gap-2 text-[15px]">
          <Row label="Name" value={staffName(currentUser)} />
          <Row label="Role" value={currentUser.jobTitle} />
          <Row label="Campus" value={currentUser.campus} />
          <Row label="Email" value={currentUser.email} />
        </dl>
      </Card>
      <Card className="p-5">
        <CardTitle>Notification preferences</CardTitle>
        <p className="mt-1 text-[13px] text-ink-muted">Stored for this session only.</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <label className="inline-flex items-center gap-2 text-[15px] text-ink">
            <input type="checkbox" checked={notifyAssigned} onChange={(e) => setNotifyAssigned(e.target.checked)} />
            Notify me when a case or action is assigned to me
          </label>
          <label className="inline-flex items-center gap-2 text-[15px] text-ink">
            <input type="checkbox" checked={notifyOverdue} onChange={(e) => setNotifyOverdue(e.target.checked)} />
            Notify me when something I own becomes overdue
          </label>
          <label className="inline-flex items-center gap-2 text-[15px] text-ink">
            <input type="checkbox" checked={notifyDigest} onChange={(e) => setNotifyDigest(e.target.checked)} />
            Send me a weekly summary email
          </label>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function PermissionsTab() {
  const { currentUser, permissions } = useApp();

  return (
    <div className="flex flex-col gap-4">
      <Banner tone="info">
        <p className="font-medium">{permissions.label}</p>
        <p className="mt-1">{permissions.description}</p>
      </Banner>
      <div className="overflow-x-auto rounded-[12px] border border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="border-b border-line px-3 py-2.5 text-[13px] font-medium text-ink-muted">Can they…</th>
              {ROLE_ORDER.map((r) => (
                <th
                  key={r}
                  className={`border-b border-line px-3 py-2.5 text-[13px] font-medium ${r === currentUser.role ? 'bg-ink text-white' : 'text-ink-muted'}`}
                >
                  {PERMISSIONS[r].shortLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <td className="px-3 py-2.5 text-ink-body">{row.label}</td>
                {ROLE_ORDER.map((r) => (
                  <td key={r} className={`px-3 py-2.5 ${r === currentUser.role ? 'bg-surface-sunken font-medium text-ink' : 'text-ink-body'}`}>
                    {row.get(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const { state, currentUser, permissions, logAudit } = useApp();
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [student, setStudent] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const events = useMemo(
    () =>
      state.auditEvents
        .filter((e) => {
          if (permissions.auditScope !== 'own-campus') return true;
          const evActor = state.staff.find((s) => s.id === e.actorId);
          return !!evActor && (evActor.campus === 'Both campuses' || evActor.campus === currentUser.campus);
        })
        .filter((e) => (actor ? e.actorId === actor : true))
        .filter((e) => (action ? e.action === action : true))
        .filter((e) => (student ? e.entityLabel.toLowerCase().includes(student.toLowerCase()) : true))
        .filter((e) => (from ? new Date(e.at) >= new Date(from) : true))
        .filter((e) => (to ? new Date(e.at) <= new Date(to) : true))
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [state.auditEvents, state.staff, permissions.auditScope, currentUser, actor, action, student, from, to],
  );

  if (permissions.auditScope === 'none') {
    return (
      <Banner tone="locked">
        <p className="flex items-center gap-1.5 font-medium">
          <Lock size={15} aria-hidden />
          Restricted. Audit log access is limited to designated safeguarding leads.
        </p>
      </Banner>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] text-ink-body">
        Every view, create, edit and export is logged. This is append-only and cannot be edited.
      </p>
      <FilterBar chips={[]}>
        <FilterSelect label="Person" value={actor} onChange={setActor} options={state.staff.map((s) => ({ value: s.id, label: staffName(s) }))} />
        <FilterSelect
          label="Action"
          value={action}
          onChange={setAction}
          options={[
            { value: 'view', label: 'View' },
            { value: 'create', label: 'Create' },
            { value: 'edit', label: 'Edit' },
            { value: 'export', label: 'Export' },
          ]}
        />
        <input
          type="text"
          value={student}
          onChange={(e) => setStudent(e.target.value)}
          placeholder="Search student or record"
          aria-label="Search student or record"
          className="rounded-[8px] border border-line-strong bg-surface px-2.5 py-2 text-[13px] text-ink min-h-[40px]"
        />
        <label className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-[8px] border border-line-strong bg-surface px-2 py-1.5 text-[13px]" />
        </label>
        <label className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-[8px] border border-line-strong bg-surface px-2 py-1.5 text-[13px]" />
        </label>
      </FilterBar>
      {events.length === 0 ? (
        <EmptyState title="No matching entries" />
      ) : (
        <Card className="p-5">
          <ul>
            {events.slice(0, 200).map((e) => (
              <AuditEntry key={e.id} event={e} actorName={staffName(state.staff.find((s) => s.id === e.actorId))} />
            ))}
          </ul>
        </Card>
      )}
      <button
        type="button"
        className="self-start text-[13px] font-medium text-ink-muted underline"
        onClick={() =>
          logAudit({ actorId: currentUser.id, action: 'export', entityType: 'audit-log', entityId: 'audit-log', entityLabel: 'the audit log' })
        }
      >
        Log a test export event
      </button>
    </div>
  );
}

function DemoTab() {
  return (
    <div className="flex flex-col gap-6">
      <Banner tone="caution">
        <p className="font-medium">Demo controls</p>
        <p className="mt-1">These exist only for the purpose of a live walkthrough. Nothing here represents production behaviour.</p>
      </Banner>
      <Card className="flex flex-col gap-4 p-5">
        <CardTitle>Switch persona</CardTitle>
        <RoleSwitcher />
      </Card>
      <Card className="flex flex-col gap-4 p-5">
        <CardTitle>Time and data</CardTitle>
        <DemoControls />
      </Card>
    </div>
  );
}
