import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import type { AllergyCategory } from '@/lib/types';

const ALLERGY_CATEGORIES: AllergyCategory[] = ['Food', 'Insect sting', 'Medication', 'Environmental', 'Latex', 'Other'];
import { PortalHeader } from '@/components/PortalHeader';
import { PageHeader } from '@/components/PageHeader';
import { LockedPortal } from '@/components/LockedPortal';
import { Card, CardTitle } from '@/components/ui/Card';
import { StudentChip } from '@/components/ui/StudentChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

export function AllergiesMedication() {
  const { state, currentUser, permissions, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [adding, setAdding] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<AllergyCategory>('Food');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [protocol, setProtocol] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medLocation, setMedLocation] = useState('');

  if (permissions.medical !== 'summary' && permissions.medical !== 'full') return <LockedPortal portal="Medical" />;

  const allergies = state.medicalRecords.filter((m) => m.type === 'allergy');
  const canWrite = permissions.medical === 'full';

  return (
    <>
      <PortalHeader portal="medical" title="Allergies and medication" description="Emergency cards for allergies, and every regular medication on file." />
      <PageHeader
        title="Allergies"
        actions={
          canWrite ? (
            <Button variant="primary" portal="medical" onClick={() => setAdding(true)}>
              Add allergy record
            </Button>
          ) : undefined
        }
      />

      {allergies.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No allergies recorded" />
      ) : (
        <div className="flex flex-col gap-4">
          {allergies.map((a) => {
            const s = state.students.find((st) => st.id === a.studentId);
            if (!s) return null;
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <StudentChip student={s} linkTo={`/students/${s.id}`} />
                  <span className="text-[13px] font-medium capitalize text-urgent">{a.severity}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {a.allergyCategory && (
                    <span className="rounded-full bg-medical-tint px-2 py-0.5 text-[12px] font-medium text-medical-deep">
                      {a.allergyCategory}
                    </span>
                  )}
                  <CardTitle>Emergency card — {a.description}</CardTitle>
                </div>
                {permissions.medical === 'full' ? (
                  <>
                    <p className="mt-1 text-[15px] leading-[1.55] text-ink-body">{a.protocol}</p>
                    {a.medicationName && (
                      <Banner tone="urgent">
                        <p className="font-medium">{a.medicationName}</p>
                        <p className="text-[13px]">
                          {a.medicationDose} · {a.medicationLocation}
                        </p>
                      </Banner>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-[14px] text-ink-muted">Summary access. Contact the nurse for the full emergency protocol.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add allergy record"
        footer={
          <Button
            variant="primary"
            portal="medical"
            disabled={!studentId || !description}
            onClick={() => {
              const s = state.students.find((st) => st.id === studentId);
              if (!s) return;
              dispatch({
                type: 'ADD_MEDICAL_RECORD',
                actorId: currentUser.id,
                record: {
                  studentId,
                  type: 'allergy',
                  allergyCategory: category,
                  severity,
                  description,
                  protocol,
                  medicationName: medName || undefined,
                  medicationDose: medDose || undefined,
                  medicationLocation: medLocation || undefined,
                },
              });
              logAudit({
                actorId: currentUser.id,
                action: 'create',
                entityType: 'medical-record',
                entityId: studentId,
                entityLabel: `an allergy record for ${studentName(s)}`,
              });
              show('Allergy record saved.');
              setStudentId('');
              setCategory('Food');
              setDescription('');
              setProtocol('');
              setMedName('');
              setMedDose('');
              setMedLocation('');
              setAdding(false);
            }}
          >
            Save record
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
            Student
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink min-h-[44px]"
            >
              <option value="">Choose a student</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {studentName(s)} — Year {s.yearGroup}
                </option>
              ))}
            </select>
          </label>
          <SelectField
            label="Allergy type"
            hint="A tag, so allergies can be seen as trends across the school, not just one record at a time"
            value={category}
            onChange={(e) => setCategory(e.target.value as AllergyCategory)}
          >
            {ALLERGY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <TextField label="Specific allergen" hint="e.g. Peanuts, Penicillin, Bee stings" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <SelectField label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </SelectField>
          <TextAreaField label="Emergency protocol" value={protocol} onChange={(e) => setProtocol(e.target.value)} />
          <TextField label="Emergency medication" hint="Optional" value={medName} onChange={(e) => setMedName(e.target.value)} />
          <TextField label="Dose" hint="Optional" value={medDose} onChange={(e) => setMedDose(e.target.value)} />
          <TextField label="Where it's kept" hint="Optional" value={medLocation} onChange={(e) => setMedLocation(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
