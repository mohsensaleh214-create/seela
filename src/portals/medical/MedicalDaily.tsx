import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Pill, Stethoscope } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PortalHeader } from '@/components/PortalHeader';
import { LockedPortal } from '@/components/LockedPortal';
import { Card, CardTitle } from '@/components/ui/Card';
import { StudentChip } from '@/components/ui/StudentChip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LogVisitModal } from './LogVisitModal';

export function MedicalDaily() {
  const { state, permissions, now } = useApp();
  const [logging, setLogging] = useState(false);

  if (permissions.medical === 'none') return <LockedPortal portal="Medical" />;

  const todayVisits = useMemo(
    () =>
      state.medicalRecords
        .filter((m) => m.type === 'visit' && m.visitTimeIn && new Date(m.visitTimeIn).toDateString() === now.toDateString())
        .sort((a, b) => new Date(a.visitTimeIn!).getTime() - new Date(b.visitTimeIn!).getTime()),
    [state.medicalRecords, now],
  );

  const medicationToday = useMemo(
    () => state.medicalRecords.filter((m) => m.type === 'medication' && m.medicationFrequency?.toLowerCase().includes('daily')),
    [state.medicalRecords],
  );

  const canLog = permissions.medical === 'full';

  return (
    <>
      <PortalHeader portal="medical" title="Today's medical view" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <CardTitle>Medication due today</CardTitle>
            <Pill size={18} className="text-medical" aria-hidden />
          </div>
          {medicationToday.length === 0 ? (
            <p className="mt-2 text-[14px] text-ink-muted">No scheduled medication today.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {medicationToday.map((m) => {
                const s = state.students.find((st) => st.id === m.studentId);
                return (
                  s && (
                    <li key={m.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                      <StudentChip student={s} linkTo={`/students/${s.id}`} />
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-ink">{m.medicationName}</p>
                        <p className="text-[13px] text-ink-muted">{m.medicationFrequency}</p>
                      </div>
                    </li>
                  )
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <CardTitle>Nurse visits today</CardTitle>
            {canLog && (
              <Button size="sm" variant="secondary" onClick={() => setLogging(true)}>
                Log a visit
              </Button>
            )}
          </div>
          {todayVisits.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No visits yet today" body="Logged visits will appear here as they happen." />
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {todayVisits.map((v) => {
                const s = state.students.find((st) => st.id === v.studentId);
                return (
                  s && (
                    <li key={v.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <StudentChip student={s} linkTo={`/students/${s.id}`} />
                        <span className="text-[13px] text-ink-muted">{format(new Date(v.visitTimeIn!), 'HH:mm')}</span>
                      </div>
                      <p className="mt-1 text-[14px] text-ink-body">{v.visitReason}</p>
                    </li>
                  )
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <LogVisitModal open={logging} onClose={() => setLogging(false)} />
    </>
  );
}
