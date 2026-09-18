import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import type { MedicalRecord, Student } from '@/lib/types';
import type { MedicalAccess } from '@/lib/permissions';
import { Card, CardTitle } from '@/components/ui/Card';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stethoscope } from 'lucide-react';

export function MedicalTab({
  student,
  records,
  access,
}: {
  student: Student;
  records: MedicalRecord[];
  access: MedicalAccess;
}) {
  if (records.length === 0) {
    return <EmptyState icon={Stethoscope} title="No medical records" body={`Nothing has been recorded for ${student.preferredName ?? student.firstName} yet.`} />;
  }

  const severe = records.filter((r) => (r.type === 'allergy' || r.type === 'plan') && r.protocol);
  const visits = records.filter((r) => r.type === 'visit').sort((a, b) => new Date(b.visitTimeIn ?? b.createdAt).getTime() - new Date(a.visitTimeIn ?? a.createdAt).getTime());
  const medications = records.filter((r) => r.type === 'medication');

  return (
    <div className="flex flex-col gap-6">
      {severe.length > 0 && (
        <div className="flex flex-col gap-3">
          {severe.map((r) => (
            <Banner key={r.id} tone={r.severity === 'severe' ? 'urgent' : 'caution'}>
              <p className="font-semibold">Emergency card — {r.description}</p>
              {access === 'full' ? (
                <p className="mt-1">{r.protocol}</p>
              ) : (
                <p className="mt-1">Summary only. Contact the school nurse for the full protocol.</p>
              )}
              {access === 'full' && r.medicationName && (
                <p className="mt-1 text-[13px]">
                  {r.medicationName} · {r.medicationDose} · {r.medicationLocation}
                </p>
              )}
            </Banner>
          ))}
        </div>
      )}

      {access === 'summary' && (
        <Banner tone="info">
          <p>You have summary access. Dosages and full protocols are visible to the school nurse and senior DSL.</p>
        </Banner>
      )}

      {medications.length > 0 && access === 'full' && (
        <Card className="p-5">
          <CardTitle>Medication</CardTitle>
          <ul className="mt-3 flex flex-col gap-3">
            {medications.map((m) => (
              <li key={m.id} className="text-[15px]">
                <p className="text-ink">{m.medicationName}</p>
                <p className="text-[13px] text-ink-muted">
                  {m.medicationDose} · {m.medicationFrequency} · {m.medicationLocation}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <CardTitle>Nurse visits</CardTitle>
        {visits.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-muted">No nurse visits recorded.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {visits.map((v) => (
              <li key={v.id} className="flex items-start gap-2.5 border-b border-line pb-3 last:border-0 last:pb-0">
                {v.visitHomeContacted && <AlertTriangle size={16} className="mt-0.5 text-caution" aria-hidden />}
                <div>
                  <p className="text-[15px] text-ink">{v.visitReason}</p>
                  <p className="text-[13px] text-ink-muted">
                    {format(new Date(v.visitTimeIn ?? v.createdAt), "d MMM yyyy, HH:mm")}
                    {v.visitTimeOut && ` – ${format(new Date(v.visitTimeOut), 'HH:mm')}`}
                    {v.visitHomeContacted && ' · Home contacted'}
                  </p>
                  {access === 'full' && v.visitTreatment && <p className="mt-1 text-[14px] text-ink-body">{v.visitTreatment}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
