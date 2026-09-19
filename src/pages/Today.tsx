import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, Clock3, Sparkles, Stethoscope, HeartHandshake, ShieldAlert, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { canSeePortalEntry } from '@/lib/permissions';
import { tone } from '@/lib/portal-theme';
import { EmptyState } from '@/components/ui/EmptyState';

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface PortalCard {
  key: 'wellbeing' | 'safeguarding' | 'medical';
  label: string;
  to: string;
  stat: string;
  needsAttention: number;
  Icon: LucideIcon;
}

export function Today() {
  const { state, currentUser, permissions, now, notifications } = useApp();

  const overdue = notifications.filter((n) => n.category === 'overdue');
  const dueToday = notifications.filter((n) => n.category === 'due-today');
  const fresh = notifications.filter((n) => n.category === 'new');

  const nothingOutstanding = overdue.length === 0 && dueToday.length === 0 && fresh.length === 0;

  const portalCards = useMemo(() => {
    const cards: PortalCard[] = [];
    const myClassIds = new Set(state.students.filter((s) => (currentUser.homeroomOf ?? []).includes(s.tutorGroup)).map((s) => s.id));
    const scopedToOwnClass = { medical: permissions.medical === 'own-students-summary', wellbeing: permissions.wellbeing === 'own-students-summary' };

    if (canSeePortalEntry(currentUser.role, 'wellbeing')) {
      const activeRecords = state.wellbeingRecords.filter((r) => r.type === 'support-plan' && r.planStatus === 'active');
      const active = scopedToOwnClass.wellbeing ? activeRecords.filter((r) => myClassIds.has(r.studentId)).length : activeRecords.length;
      cards.push({
        key: 'wellbeing',
        label: 'Wellbeing',
        to: '/wellbeing',
        stat: scopedToOwnClass.wellbeing
          ? `${active} active support plan${active === 1 ? '' : 's'} in your class`
          : `${active} active support plan${active === 1 ? '' : 's'}`,
        needsAttention: 0,
        Icon: HeartHandshake,
      });
    }
    if (canSeePortalEntry(currentUser.role, 'safeguarding')) {
      const mine = state.cases.filter((c) => c.status === 'open' && c.ownerId === currentUser.id);
      cards.push({
        key: 'safeguarding',
        label: 'Safeguarding',
        to: '/safeguarding',
        stat:
          permissions.safeguarding === 'none'
            ? 'Raise a concern any time'
            : `${mine.length} open case${mine.length === 1 ? '' : 's'} in your caseload`,
        needsAttention: overdue.length + dueToday.length,
        Icon: ShieldAlert,
      });
    }
    if (canSeePortalEntry(currentUser.role, 'medical')) {
      const flaggedRecords = state.medicalRecords.filter((m) => m.type === 'allergy' || m.type === 'plan');
      const flagged = scopedToOwnClass.medical ? flaggedRecords.filter((m) => myClassIds.has(m.studentId)).length : flaggedRecords.length;
      cards.push({
        key: 'medical',
        label: 'Medical',
        to: '/medical',
        stat: scopedToOwnClass.medical
          ? `${flagged} student${flagged === 1 ? '' : 's'} in your class with an allergy or healthcare plan`
          : `${flagged} student${flagged === 1 ? '' : 's'} with an allergy or healthcare plan`,
        needsAttention: 0,
        Icon: Stethoscope,
      });
    }
    return cards;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cases, state.medicalRecords, state.wellbeingRecords, state.students, currentUser, permissions, overdue.length, dueToday.length]);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-ink">
          {greeting(now)}, {currentUser.firstName}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">{format(now, 'd MMM yyyy')}</p>
      </div>

      {portalCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {portalCards.map((p) => (
            <PortalCardTile key={p.key} card={p} />
          ))}
        </div>
      )}

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
    </div>
  );
}

function PortalCardTile({ card }: { card: PortalCard }) {
  const t = tone(card.key);
  return (
    <Link
      to={card.to}
      className="group flex flex-col gap-3 rounded-[12px] border border-line p-5 transition-colors duration-150 ease-out hover:border-line-strong"
      style={{ backgroundColor: t.tint }}
    >
      <div className="flex items-start justify-between">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: t.accent }}
        >
          <card.Icon size={20} aria-hidden />
        </span>
        {card.needsAttention > 0 && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-urgent px-1.5 text-[12px] font-semibold text-white">
            {card.needsAttention}
          </span>
        )}
      </div>
      <div>
        <p className="text-[19px] font-semibold text-ink">{card.label}</p>
        <p className="mt-0.5 text-[14px] text-ink-body">{card.stat}</p>
      </div>
    </Link>
  );
}

function NotifSection({
  title,
  icon: Icon,
  tone: toneClass,
  items,
}: {
  title: string;
  icon: typeof AlertCircle;
  tone: string;
  items: ReturnType<typeof useApp>['notifications'];
}) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide ${toneClass}`}>
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
