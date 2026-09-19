import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import type { AllergyCategory } from '@/lib/types';
import { PortalHeader } from '@/components/PortalHeader';
import { PageHeader } from '@/components/PageHeader';
import { LockedPortal } from '@/components/LockedPortal';
import { StudentPicker } from '@/components/StudentPicker';
import { Card, CardTitle } from '@/components/ui/Card';
import { StudentChip } from '@/components/ui/StudentChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

const ALLERGY_CATEGORIES: AllergyCategory[] = ['Food', 'Insect sting', 'Medication', 'Environmental', 'Latex', 'Other'];

/** Common, named allergens per category — a dropdown first, so the same allergen is always spelled and tagged the same way across the whole school (which is what makes the trends dashboard meaningful). */
const COMMON_ALLERGENS: Record<AllergyCategory, string[]> = {
  Food: ['Peanuts', 'Tree nuts', 'Milk / dairy', 'Eggs', 'Wheat / gluten', 'Soy', 'Shellfish', 'Fish', 'Sesame'],
  'Insect sting': ['Bee stings', 'Wasp stings', 'Ant stings'],
  Medication: ['Penicillin', 'Ibuprofen / NSAIDs', 'Aspirin', 'Sulfa drugs'],
  Environmental: ['Pollen', 'Dust mites', 'Pet dander', 'Mould'],
  Latex: ['Latex'],
  Other: [],
};
const OTHER_ALLERGEN = 'Other / not listed';

export function AllergiesMedication() {
  const { state, currentUser, permissions, dispatch, logAudit } = useApp();
  const { show } = useToast();
  const [adding, setAdding] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<AllergyCategory>('Food');
  const [allergen, setAllergen] = useState('');
  const [customAllergen, setCustomAllergen] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [protocol, setProtocol] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medLocation, setMedLocation] = useState('');

  if (permissions.medical !== 'summary' && permissions.medical !== 'full') return <LockedPortal portal="Medical" />;

  const allergies = state.medicalRecords.filter((m) => m.type === 'allergy');
  const canWrite = permissions.medical === 'full';
  const pickedStudent = state.students.find((s) => s.id === studentId);
  const finalAllergen = allergen === OTHER_ALLERGEN ? customAllergen.trim() : allergen;

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
            disabled={!studentId || !finalAllergen}
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
                  description: finalAllergen,
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
              setAllergen('');
              setCustomAllergen('');
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
          {pickedStudent ? (
            <div className="flex items-center justify-between rounded-[8px] bg-surface-sunken px-3 py-2.5">
              <StudentChip student={pickedStudent} />
              <button type="button" onClick={() => setStudentId('')} className="text-[13px] font-medium text-ink-muted underline">
                Change
              </button>
            </div>
          ) : (
            <StudentPicker onSelect={(s) => setStudentId(s.id)} autoFocusSearch />
          )}
          <SelectField
            label="Allergy type"
            hint="A tag, so allergies can be seen as trends across the school, not just one record at a time"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as AllergyCategory);
              setAllergen('');
              setCustomAllergen('');
            }}
          >
            {ALLERGY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <SelectField label="Specific allergen" value={allergen} onChange={(e) => setAllergen(e.target.value)} required>
            <option value="">Choose an allergen</option>
            {COMMON_ALLERGENS[category].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value={OTHER_ALLERGEN}>{OTHER_ALLERGEN}</option>
          </SelectField>
          {allergen === OTHER_ALLERGEN && (
            <TextField label="Name the allergen" value={customAllergen} onChange={(e) => setCustomAllergen(e.target.value)} required autoFocus />
          )}
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
