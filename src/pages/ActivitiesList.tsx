import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plane, Trophy, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName } from '@/lib/selectors';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPE_ICON = { trip: Plane, fixture: Trophy, event: CalendarDays } as const;

export function ActivitiesList() {
  const { state } = useApp();
  const activities = [...state.activities].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <>
      <PageHeader
        title="Activities"
        description="Trips, fixtures and events. Open one to see plain-language guidance for every student attending, drawn from all three portals."
      />

      {activities.length === 0 ? (
        <EmptyState icon={Plane} title="No activities scheduled" />
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map((a) => {
            const Icon = TYPE_ICON[a.type];
            return (
              <Link key={a.id} to={`/activities/${a.id}`}>
                <Card className="flex items-center gap-4 p-5 hover:bg-surface-sunken">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-body">
                    <Icon size={20} aria-hidden />
                  </span>
                  <div className="flex-1">
                    <CardTitle>{a.name}</CardTitle>
                    <p className="mt-0.5 text-[14px] text-ink-muted">
                      {format(new Date(a.startsAt), 'd MMM yyyy')}
                      {a.endsAt !== a.startsAt && ` – ${format(new Date(a.endsAt), 'd MMM yyyy')}`} · {a.location}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      {a.studentIds.length} students · Led by {staffName(state.staff.find((s) => s.id === a.leadId))}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
