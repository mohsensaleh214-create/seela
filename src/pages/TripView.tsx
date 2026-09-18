import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Phone, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName, staffName } from '@/lib/selectors';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { PersonAvatar } from '@/components/ui/PersonAvatar';
import { SeverityDot } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Banner } from '@/components/ui/Banner';

export function TripView() {
  const { activityId } = useParams();
  const { state, currentUser, logAudit } = useApp();

  const activity = state.activities.find((a) => a.id === activityId);

  useEffect(() => {
    if (activity) {
      logAudit({
        actorId: currentUser.id,
        action: 'view',
        entityType: 'student',
        entityId: activity.id,
        entityLabel: `the trip guidance list for ${activity.name}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, currentUser.id]);

  if (!activity) {
    return <EmptyState title="Activity not found" body="This activity does not exist in the dummy dataset." />;
  }

  const students = activity.studentIds.map((id) => state.students.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <>
      <PageHeader
        title={activity.name}
        description={`${format(new Date(activity.startsAt), 'd MMM yyyy')} – ${format(new Date(activity.endsAt), 'd MMM yyyy')} · ${activity.location} · Led by ${staffName(state.staff.find((s) => s.id === activity.leadId))}`}
      />

      <Banner tone="info">
        <p className="font-medium">This shows guidance only, never the underlying case.</p>
        <p className="mt-1">Each line is drawn from the medical, wellbeing and safeguarding portals and filtered to what your role can see.</p>
      </Banner>

      <div className="flex flex-col gap-4">
        {students.map((s) => {
          const flags = state.flags.filter((f) => s.flagIds.includes(f.id) && f.visibleToRoles.includes(currentUser.role));
          const primaryGuardian = s.guardians.find((g) => g.isPrimary) ?? s.guardians[0];
          return (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={studentName(s)} size={40} />
                  <div>
                    <Link to={`/students/${s.id}`} className="text-[16px] font-semibold text-ink hover:underline">
                      {studentName(s)}
                    </Link>
                    <p className="text-[13px] text-ink-muted">
                      Year {s.yearGroup} · {s.tutorGroup}
                    </p>
                  </div>
                </div>
                {primaryGuardian && (
                  <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
                    <Phone size={13} aria-hidden />
                    {primaryGuardian.name} ({primaryGuardian.relationship}) · {primaryGuardian.phone}
                  </p>
                )}
              </div>

              {flags.length === 0 ? (
                <p className="mt-3 flex items-center gap-1.5 text-[14px] text-ink-muted">
                  <ShieldCheck size={15} aria-hidden />
                  Nothing to be mindful of.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {flags.map((f) => (
                    <li key={f.id} className="flex items-start gap-2.5 rounded-[8px] bg-surface-sunken px-3 py-2.5">
                      <span className="mt-1.5">
                        <SeverityDot severity={f.severity} />
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-ink">{f.label}</p>
                        <p className="mt-0.5 text-[14px] leading-[1.5] text-ink-body">{f.guidance}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
