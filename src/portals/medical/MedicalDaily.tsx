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
  const { state, currentUser, permissions, now } = useApp();
  const [logging, setLogging] = useState(false);

  if (permissions.medical === 'none') {
    return (
      <LockedPortal
        portal="Medical"
        note="You can still raise a concern about a student's health at any time — it goes straight to the medical team."
      />
    );
  }

  if (permissions.medical === 'own-students-summary') {
    const myStudents = state.students.filter((s) => (currentUser.homeroomOf ?? []).includes(s.tutorGroup));
    return (
      <>
        <PortalHeader
          portal="medical"
          title="Medical — your class"
          description="A summary for your own students. Full protocols and dosages are visible to the school nurse and senior DSL."
        />
        {myStudents.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No class assigned" body="You are not set as form tutor for any class." />
        ) : (
          <div className="flex flex-col gap-3">
            {myStudents.map((s) => {
              const allergies = state.medicalRecords.filter((m) => m.studentId === s.id && m.type === 'allergy');
              const hasPlan = state.medicalRecords.some((m) => m.studentId === s.id && m.type === 'plan');
              return (
                <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <StudentChip student={s} linkTo={`/students/${s.id}`} />
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    {allergies.map((a) => (
                      <span key={a.id} className="rounded-full bg-medical-tint px-2 py-0.5 font-medium text-medical-deep">
                        {a.allergyCategory ?? 'Allergy'}
                      </span>
                    ))}
                    {hasPlan && <span className="rounded-full bg-medical-tint px-2 py-0.5 font-medium text-medical-deep">Healthcare plan</span>}
                    {allergies.length === 0 && !hasPlan && <span className="text-ink-muted">Nothing on file</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </>
    );
  }

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
