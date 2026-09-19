import type { Case, Flag, MedicalRecord, WellbeingRecord, HomeContact, Student } from './types';

export interface CallPrepInput {
  student: Student;
  flags: Flag[]; // already permission-filtered — never pass unfiltered data in here
  readableCases: Case[]; // already permission-filtered to what this viewer can read
  hasHiddenCases: boolean; // student has case history this viewer cannot read
  medicalRecords: MedicalRecord[]; // empty unless this viewer has medical access
  wellbeingRecords: WellbeingRecord[]; // empty unless this viewer has wellbeing access
  homeContacts: HomeContact[];
  guidanceRestricted: boolean;
}

export interface CallPrep {
  pointsToRaise: string[];
  beMindfulOf: string[];
  recentContext: string[];
}

/**
 * Deterministic, rule-based "AI advice" synthesised purely from data the
 * caller already has permission to see. This never looks past what's been
 * filtered in by the caller — it composes talking points, it doesn't widen
 * access. There is no model call here: it's a prototype of the *shape* of
 * the feature (pull every module into one briefing) rather than the NLP.
 */
export function buildCallPrep(input: CallPrepInput): CallPrep {
  const { student, flags, readableCases, hasHiddenCases, medicalRecords, wellbeingRecords, homeContacts, guidanceRestricted } = input;
  const name = student.preferredName ?? student.firstName;
  const pointsToRaise: string[] = [];
  const beMindfulOf: string[] = [];
  const recentContext: string[] = [];

  for (const f of flags) {
    pointsToRaise.push(f.guidance);
    if (f.severity === 'severe' || f.severity === 'moderate') {
      beMindfulOf.push(`"${f.label}" is flagged as ${f.severity} — take this part of the call slowly.`);
    }
  }

  for (const c of readableCases.filter((c) => c.status === 'open')) {
    if (c.level === 'immediate' || c.level === 'elevated') {
      beMindfulOf.push(
        `There's an open ${c.level}-level safeguarding matter (${c.category}). Stick to what's already been agreed with home and loop in the DSL before sharing detail.`,
      );
    } else {
      pointsToRaise.push(`There's an open note around ${c.category.toLowerCase()} — worth a gentle check on how things feel from home's side.`);
    }
  }
  if (hasHiddenCases) {
    beMindfulOf.push(`${name} has safeguarding history you don't have visibility of. Check with the DSL before raising anything sensitive.`);
  }

  for (const w of wellbeingRecords) {
    if (w.type === 'support-plan' && w.planStatus === 'active' && w.goals) {
      const open = w.goals.find((g) => g.status !== 'met');
      if (open) pointsToRaise.push(`Support plan goal in progress: ${open.goal}.`);
    }
    if (w.type === 'check-in' && w.mood === 'low') {
      beMindfulOf.push('Most recent wellbeing check-in recorded a low mood — a gentle, open question may land better than logistics first.');
    }
  }

  for (const m of medicalRecords) {
    if (m.type === 'medication' && m.medicationLocation) {
      pointsToRaise.push(`Reminder: ${m.medicationName ?? 'medication'} should stay ${m.medicationLocation}.`);
    }
    if (m.type === 'allergy' && m.severity === 'severe') {
      beMindfulOf.push(`Severe allergy on file (${m.description}) — worth confirming home's care plan is still current.`);
    }
    if (m.reviewDate) {
      const label = m.type === 'plan' ? 'Healthcare plan' : 'Medical record';
      pointsToRaise.push(`${label} review is due ${new Date(m.reviewDate).toLocaleDateString('en-GB')}.`);
    }
  }

  const lastContact = [...homeContacts].sort((a, b) => new Date(b.contactedAt).getTime() - new Date(a.contactedAt).getTime())[0];
  if (lastContact) {
    recentContext.push(`Last contact (${new Date(lastContact.contactedAt).toLocaleDateString('en-GB')}): ${lastContact.summary}`);
  }

  if (guidanceRestricted) {
    beMindfulOf.push("You're seeing this student outside your usual class — switch on duty mode first for the fullest picture.");
  }

  if (pointsToRaise.length === 0) {
    pointsToRaise.push('Nothing flagged right now — a good opportunity for a general, positive check-in call.');
  }

  return { pointsToRaise: dedupe(pointsToRaise), beMindfulOf: dedupe(beMindfulOf), recentContext };
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}
