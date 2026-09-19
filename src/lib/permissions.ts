import type { Role } from './types';

export type ScopeLevel = 'none' | 'own-students' | 'own-year' | 'own-campus' | 'all';
export type MedicalAccess = 'none' | 'own-students-summary' | 'summary' | 'full';
export type WellbeingAccess = 'none' | 'own-students-summary' | 'own-year-full' | 'full';
export type SafeguardingAccess = 'none' | 'assigned-only' | 'own-campus' | 'all-campuses';
export type LevelAction = 'none' | 'propose' | 'set';

export interface RolePermissions {
  role: Role;
  label: string;
  shortLabel: string;
  description: string;
  raiseConcern: true;
  guidanceScope: ScopeLevel;
  medical: MedicalAccess;
  wellbeing: WellbeingAccess;
  safeguarding: SafeguardingAccess;
  triage: boolean;
  levelAction: LevelAction;
  ownCase: 'if-assigned' | 'any';
  closeCase: boolean;
  authoriseContactException: boolean;
  stalledScope: ScopeLevel;
  auditScope: 'none' | 'own-campus' | 'all';
}

export const PERMISSIONS: Record<Role, RolePermissions> = {
  teacher: {
    role: 'teacher',
    label: 'Class teacher',
    shortLabel: 'Teacher',
    description:
      'Can raise a concern for any student, sees plain-language guidance for their own students, and a summary of medical and wellbeing information for their own class — enough to teach them safely, not full clinical or case detail. No access to safeguarding records.',
    raiseConcern: true,
    guidanceScope: 'own-students',
    medical: 'own-students-summary',
    wellbeing: 'own-students-summary',
    safeguarding: 'none',
    triage: false,
    levelAction: 'none',
    ownCase: 'if-assigned',
    closeCase: false,
    authoriseContactException: false,
    stalledScope: 'none',
    auditScope: 'none',
  },
  'pastoral-lead': {
    role: 'pastoral-lead',
    label: 'Head of year and pastoral lead',
    shortLabel: 'Pastoral lead',
    description:
      'Sees guidance and wellbeing records for their own year group, and any safeguarding case they are assigned to. Cannot triage or change a level of concern.',
    raiseConcern: true,
    guidanceScope: 'own-year',
    medical: 'summary',
    wellbeing: 'own-year-full',
    safeguarding: 'assigned-only',
    triage: false,
    levelAction: 'none',
    ownCase: 'any',
    closeCase: false,
    authoriseContactException: false,
    stalledScope: 'own-year',
    auditScope: 'none',
  },
  nurse: {
    role: 'nurse',
    label: 'School nurse',
    shortLabel: 'Nurse',
    description:
      'Full access to medical records for every student. No access to wellbeing or safeguarding records beyond the guidance line.',
    raiseConcern: true,
    guidanceScope: 'all',
    medical: 'full',
    wellbeing: 'none',
    safeguarding: 'none',
    triage: false,
    levelAction: 'none',
    ownCase: 'if-assigned',
    closeCase: false,
    authoriseContactException: false,
    stalledScope: 'none',
    auditScope: 'none',
  },
  dsl: {
    role: 'dsl',
    label: 'Designated safeguarding lead',
    shortLabel: 'DSL',
    description:
      'Triages new reports, proposes a level of concern, and reads all safeguarding cases and the stalled view for their own campus.',
    raiseConcern: true,
    guidanceScope: 'all',
    medical: 'summary',
    wellbeing: 'full',
    safeguarding: 'own-campus',
    triage: true,
    levelAction: 'propose',
    ownCase: 'any',
    closeCase: false,
    authoriseContactException: false,
    stalledScope: 'own-campus',
    auditScope: 'own-campus',
  },
  'senior-dsl': {
    role: 'senior-dsl',
    label: 'Senior designated safeguarding lead',
    shortLabel: 'Senior DSL',
    description:
      'Full read and write access across both campuses: sets levels, closes cases, authorises contact-home exceptions, and reads the full audit log.',
    raiseConcern: true,
    guidanceScope: 'all',
    medical: 'full',
    wellbeing: 'full',
    safeguarding: 'all-campuses',
    triage: true,
    levelAction: 'set',
    ownCase: 'any',
    closeCase: true,
    authoriseContactException: true,
    stalledScope: 'all',
    auditScope: 'all',
  },
};

export function perms(role: Role): RolePermissions {
  return PERMISSIONS[role];
}

/**
 * Whole-school portal entry (the Medical/Wellbeing nav items and their
 * school-wide lists — every allergy, every referral, every year's pattern).
 * Deliberately stricter than "has some access": 'own-students-summary' is a
 * per-student, own-class scope meant for the student profile tab, not an
 * unscoped, whole-school view. A teacher gets the former, never this.
 */
export function canReadPortalTab(role: Role, portal: Portal): boolean {
  const p = perms(role);
  if (portal === 'medical') return p.medical === 'summary' || p.medical === 'full';
  if (portal === 'wellbeing') return p.wellbeing === 'own-year-full' || p.wellbeing === 'full';
  return p.safeguarding !== 'none';
}

type Portal = 'medical' | 'wellbeing' | 'safeguarding';

export function canEnterPortal(role: Role, portal: Portal): boolean {
  return canReadPortalTab(role, portal);
}

/**
 * Whether a role sees the portal as a destination at all — the sidebar link,
 * the front-and-center card on Today. Every role sees Safeguarding: raising
 * a concern into it is universal, so the entry point should be too, even for
 * a role that can never browse the register (canReadPortalTab handles that
 * narrower question once they're inside). Medical/Wellbeing follow whether
 * the role has any access, including the scoped 'own-students-summary' tier
 * — that tier gets a real, own-class landing page instead of the school-wide
 * view, not a locked wall it can't do anything from.
 */
export function canSeePortalEntry(role: Role, portal: Portal): boolean {
  if (portal === 'safeguarding') return true;
  const p = perms(role);
  if (portal === 'medical') return p.medical !== 'none';
  return p.wellbeing !== 'none';
}

export function canSeeStudentSafeguarding(
  role: Role,
  opts: { isAssignedOwner: boolean; sameCampus: boolean },
): boolean {
  const p = perms(role);
  if (p.safeguarding === 'none') return false;
  if (p.safeguarding === 'assigned-only') return opts.isAssignedOwner;
  if (p.safeguarding === 'own-campus') return opts.sameCampus;
  return true;
}
