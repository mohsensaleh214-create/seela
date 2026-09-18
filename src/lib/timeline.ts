import type {
  Case,
  Entry,
  ContactRecord,
  MedicalRecord,
  WellbeingRecord,
  PatternFlagState,
  Student,
  Staff,
  Portal,
} from './types';
import type { RolePermissions } from './permissions';
import { canReadCase, sameCampus } from './selectors';

export interface TimelineItem {
  id: string;
  portal: Portal;
  typeLabel: string;
  summary: string;
  detail?: string;
  authorId: string;
  at: string;
  restricted: boolean;
  isPatternFlag?: boolean;
  patternFlagId?: string;
  linkTo?: string;
}

export function sortTimeline(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export interface TimelineSourceState {
  cases: Case[];
  entries: Entry[];
  actions: { caseId: string; ownerId: string }[];
  contactRecords: ContactRecord[];
  medicalRecords: MedicalRecord[];
  wellbeingRecords: WellbeingRecord[];
  patternFlags: PatternFlagState[];
}

const ENTRY_LABEL: Record<Entry['type'], string> = {
  note: 'Note',
  action: 'Action',
  review: 'Review',
  contact: 'Contact home',
  'level-change': 'Level of concern changed',
  handover: 'Handover',
  'pattern-flag': 'System flag',
};

function staffYearGroup(staff: Staff): number | null {
  const match = staff.jobTitle.match(/Year (\d+)/);
  return match ? Number(match[1]) : null;
}

export function buildStudentTimeline(
  source: TimelineSourceState,
  student: Student,
  currentUser: Staff,
  perm: RolePermissions,
): TimelineItem[] {
  const items: TimelineItem[] = [];

  const studentCases = source.cases.filter((c) => c.studentId === student.id);

  for (const c of studentCases) {
    const actionOwnerIds = source.actions.filter((a) => a.caseId === c.id).map((a) => a.ownerId);
    const readable = canReadCase(perm, c, student, currentUser, actionOwnerIds);

    items.push({
      id: `${c.id}-created`,
      portal: 'safeguarding',
      typeLabel: 'Concern raised',
      summary: `${c.category} — ${c.location}`,
      detail: c.account,
      authorId: c.reportedById,
      at: c.reportedAt,
      restricted: !readable,
      linkTo: readable ? `/safeguarding/cases/${c.id}` : undefined,
    });

    if (c.triagedAt) {
      items.push({
        id: `${c.id}-triaged`,
        portal: 'safeguarding',
        typeLabel: 'Triaged',
        summary: `Set to ${c.level} level of concern`,
        authorId: c.triagedById ?? c.reportedById,
        at: c.triagedAt,
        restricted: !readable,
        linkTo: readable ? `/safeguarding/cases/${c.id}` : undefined,
      });
    }

    for (const e of source.entries.filter((entry) => entry.caseId === c.id)) {
      items.push({
        id: e.id,
        portal: 'safeguarding',
        typeLabel: ENTRY_LABEL[e.type],
        summary: e.body,
        authorId: e.authorId,
        at: e.createdAt,
        restricted: !readable,
        linkTo: readable ? `/safeguarding/cases/${c.id}` : undefined,
      });
    }

    for (const contact of source.contactRecords.filter((cr) => cr.caseId === c.id)) {
      items.push({
        id: contact.id,
        portal: 'safeguarding',
        typeLabel: 'Contact home',
        summary: contact.isException
          ? `Contact exception authorised: ${contact.exceptionReason}`
          : `Spoke with ${contact.personSpoken} (${contact.relationship}) by ${contact.method}`,
        detail: contact.isException ? contact.alternativeAction : `${contact.discussed} Agreed: ${contact.agreed}`,
        authorId: contact.contactedById,
        at: contact.contactedAt,
        restricted: !readable,
        linkTo: readable ? `/safeguarding/cases/${c.id}` : undefined,
      });
    }

    if (c.closedAt) {
      items.push({
        id: `${c.id}-closed`,
        portal: 'safeguarding',
        typeLabel: 'Case closed',
        summary: c.closureStatement ?? 'Case closed.',
        authorId: c.closedById ?? c.reportedById,
        at: c.closedAt,
        restricted: !readable,
        linkTo: readable ? `/safeguarding/cases/${c.id}` : undefined,
      });
    }
  }

  const medicalReadable = perm.medical !== 'none';
  for (const m of source.medicalRecords.filter((r) => r.studentId === student.id)) {
    const label =
      m.type === 'visit'
        ? 'Nurse visit'
        : m.type === 'allergy'
          ? 'Allergy record'
          : m.type === 'plan'
            ? 'Healthcare plan'
            : m.type === 'medication'
              ? 'Medication record'
              : 'Condition recorded';
    items.push({
      id: m.id,
      portal: 'medical',
      typeLabel: label,
      summary: m.description,
      detail: m.protocol,
      authorId: m.createdBy,
      at: m.type === 'visit' ? (m.visitTimeIn ?? m.createdAt) : m.createdAt,
      restricted: !medicalReadable,
      linkTo: medicalReadable ? `/students/${student.id}?tab=medical` : undefined,
    });
  }

  const wellbeingYear = staffYearGroup(currentUser);
  const wellbeingReadable =
    perm.wellbeing === 'full' || (perm.wellbeing === 'own-year-full' && wellbeingYear === student.yearGroup);
  for (const w of source.wellbeingRecords.filter((r) => r.studentId === student.id)) {
    const label =
      w.type === 'check-in'
        ? 'Wellbeing check-in'
        : w.type === 'pastoral-note'
          ? 'Pastoral note'
          : w.type === 'session'
            ? 'Counselling'
            : 'Support plan';
    items.push({
      id: w.id,
      portal: 'wellbeing',
      typeLabel: label,
      summary: w.summary + (w.mood ? ` (mood: ${w.mood})` : ''),
      authorId: w.authorId,
      at: w.createdAt,
      restricted: !(perm.wellbeing !== 'none') || !wellbeingReadable,
      linkTo: wellbeingReadable ? `/students/${student.id}?tab=wellbeing` : undefined,
    });
  }

  for (const p of source.patternFlags.filter((f) => f.studentId === student.id && f.status !== 'dismissed')) {
    items.push({
      id: p.id,
      portal: 'safeguarding',
      typeLabel: 'System flag',
      summary: p.summary,
      authorId: 'system',
      at: p.createdAt,
      restricted: false,
      isPatternFlag: true,
      patternFlagId: p.id,
    });
  }

  return sortTimeline(items);
}

export function canSeeSafeguardingCampus(perm: RolePermissions, student: Student, currentUser: Staff): boolean {
  if (perm.safeguarding !== 'own-campus') return true;
  return sameCampus(student.campus, currentUser.campus);
}
