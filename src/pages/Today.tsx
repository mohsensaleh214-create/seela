import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, Clock3, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { canEnterPortal } from '@/lib/permissions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Today() {
  const { state, currentUser, now, notifications } = useApp();

  const overdue = notifications.filter((n) => n.category === 'overdue');
  const dueToday = notifications.filter((n) => n.category === 'due-today');
  const fresh = notifications.filter((n) => n.category === 'new');

  const nothingOutstanding = overdue.length === 0 && dueToday.length === 0 && fresh.length === 0;

  const portalSummaries = useMemo(() => {
    const items: { label: string; to: string; stat: string }[] = [];
    if (canEnterPortal(currentUser.role, 'safeguarding')) {
      const mine = state.cases.filter((c) => c.status === 'open' && c.ownerId === currentUser.id);
      items.push({ label: 'Safeguarding', to: '/safeguarding/register', stat: `${mine.length} open case${mine.length === 1 ? '' : 's'} in your caseload` });
    }
    if (canEnterPortal(currentUser.role, 'medical')) {
      const flagged = state.medicalRecords.filter((m) => m.type === 'allergy' || m.type === 'plan').length;
      items.push({ label: 'Medical', to: '/medical', stat: `${flagged} student${flagged === 1 ? '' : 's'} with an allergy or healthcare plan` });
    }
    if (canEnterPortal(currentUser.role, 'wellbeing')) {
      const active = state.wellbeingRecords.filter((r) => r.type === 'support-plan' && r.planStatus === 'active').length;
      items.push({ label: 'Wellbeing', to: '/wellbeing/plans', stat: `${active} active support plan${active === 1 ? '' : 's'}` });
    }
    return items;
  }, [state.cases, state.medicalRecords, state.wellbeingRecords, currentUser]);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-ink">
          {greeting(now)}, {currentUser.firstName}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">{format(now, 'd MMM yyyy')}</p>
      </div>

      {nothingOutstanding ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing outstanding"
          body="Nothing is overdue, due today, or newly assigned to you. Enjoy the quiet."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <NotifSection title="Overdue" icon={AlertCircle} tone="text-urgent" items={overdue} />
          )}
          {dueToday.length > 0 && (
            <NotifSection title="Due today" icon={Clock3} tone="text-caution" items={dueToday} />
          )}
          {fresh.length > 0 && (
            <NotifSection title="New since you last looked" icon={Sparkles} tone="text-info" items={fresh} />
          )}
        </div>
      )}

      {portalSummaries.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-6">
          <p className="text-[13px] font-medium uppercase tracking-wide text-ink-muted">Your portals</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {portalSummaries.map((p) => (
              <Link key={p.label} to={p.to} className="flex-1">
                <Card className="p-4 hover:bg-surface-sunken">
                  <p className="text-[14px] font-medium text-ink">{p.label}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{p.stat}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifSection({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: typeof AlertCircle;
  tone: string;
  items: ReturnType<typeof useApp>['notifications'];
}) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide ${tone}`}>
        <Icon size={14} aria-hidden />
        {title}
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((n) => (
          <li key={n.id}>
            <Link to={n.link} className="block rounded-[8px] border border-line bg-surface px-4 py-3 text-[15px] text-ink hover:bg-surface-sunken">
              {n.message}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
