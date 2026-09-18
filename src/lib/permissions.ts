import type { Role } from './types';

export type ScopeLevel = 'none' | 'own-students' | 'own-year' | 'own-campus' | 'all';
export type MedicalAccess = 'none' | 'summary' | 'full';
export type WellbeingAccess = 'none' | 'own-year-full' | 'full';
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
      'Can raise a concern for any student and sees plain-language guidance for their own students. No access to underlying medical, wellbeing or safeguarding records.',
    raiseConcern: true,
    guidanceScope: 'own-students',
    medical: 'none',
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

export function canReadPortalTab(role: Role, portal: Portal): boolean {
  const p = perms(role);
  if (portal === 'medical') return p.medical !== 'none';
  if (portal === 'wellbeing') return p.wellbeing !== 'none';
  return p.safeguarding !== 'none';
}

type Portal = 'medical' | 'wellbeing' | 'safeguarding';

export function canEnterPortal(role: Role, portal: Portal): boolean {
  return canReadPortalTab(role, portal);
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
