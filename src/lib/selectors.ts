import type { Case, Student, Staff, Portal } from './types';
import type { RolePermissions, MedicalAccess, WellbeingAccess } from './permissions';

export function studentName(student: Student): string {
  return `${student.preferredName ?? student.firstName} ${student.lastName}`;
}

export function staffName(staff: Staff | undefined): string {
  if (!staff) return 'Unknown';
  return `${staff.firstName} ${staff.lastName}`;
}

export function isCaseAssignedTo(c: Case, actionOwnerIds: string[], userId: string): boolean {
  return c.ownerId === userId || actionOwnerIds.includes(userId);
}

export function canReadCase(
  perm: RolePermissions,
  c: Case,
  student: Student,
  currentUser: Staff,
  actionOwnerIds: string[],
): boolean {
  if (perm.safeguarding === 'none') return false;
  if (perm.safeguarding === 'assigned-only') return isCaseAssignedTo(c, actionOwnerIds, currentUser.id);
  if (perm.safeguarding === 'own-campus') return sameCampus(student.campus, currentUser.campus);
  return true;
}

export function yearGroupForStaff(staff: Staff): number | null {
  // Tom Reilly is Head of Year 9 in the seed data; inferred from job title for the demo.
  const match = staff.jobTitle.match(/Year (\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Whether a member of staff can see the plain-language guidance line (and the
 * flags behind it) for a given student. "Own students" for a teacher means a
 * class they are the homeroom/form tutor for, unless duty mode is on — a
 * school-wide cover moment (break duty, a trip, a fire drill) where a teacher
 * may reasonably need to see any student's guidance.
 */
export function canSeeStudentGuidance(perm: RolePermissions, student: Student, currentUser: Staff, dutyMode: boolean): boolean {
  if (perm.guidanceScope === 'all') return true;
  if (dutyMode) return true;
  if (perm.guidanceScope === 'own-year') return student.yearGroup === yearGroupForStaff(currentUser);
  if (perm.guidanceScope === 'own-students') return (currentUser.homeroomOf ?? []).includes(student.tutorGroup);
  return false;
}

/**
 * The medical access a member of staff actually has for THIS student — not
 * just the role's ceiling. Nurse/senior DSL 'full' and DSL/pastoral-lead
 * 'summary' are school-wide by design (need-to-know for those jobs spans
 * the whole school). A teacher's 'own-students-summary' is the one level
 * that's scoped: enough to teach the class safely, only for their class,
 * with the same duty-mode escape hatch as guidance.
 */
export function medicalAccessFor(
  perm: RolePermissions,
  student: Student,
  currentUser: Staff,
  dutyMode: boolean,
): MedicalAccess | 'locked' {
  if (perm.medical === 'none') return 'none';
  if (perm.medical !== 'own-students-summary') return perm.medical;
  if (dutyMode || (currentUser.homeroomOf ?? []).includes(student.tutorGroup)) return 'own-students-summary';
  return 'locked';
}

/** Same reasoning as medicalAccessFor, and also now enforces pastoral-lead's
 * existing "own-year-full" for real — previously declared but not checked
 * outside the timeline, so a pastoral lead could open any student's full
 * wellbeing tab regardless of year group. */
export function wellbeingAccessFor(
  perm: RolePermissions,
  student: Student,
  currentUser: Staff,
  dutyMode: boolean,
): WellbeingAccess | 'locked' {
  if (perm.wellbeing === 'none') return 'none';
  if (perm.wellbeing === 'full') return 'full';
  if (perm.wellbeing === 'own-year-full') {
    return student.yearGroup === yearGroupForStaff(currentUser) ? 'full' : 'locked';
  }
  if (dutyMode || (currentUser.homeroomOf ?? []).includes(student.tutorGroup)) return 'own-students-summary';
  return 'locked';
}

export function levelRank(level: Case['level']): number {
  return level === 'immediate' ? 3 : level === 'elevated' ? 2 : 1;
}

export function sameCampus(a: Student['campus'], b: Staff['campus']): boolean {
  return b === 'Both campuses' || b === a;
}

export const PORTAL_LABEL: Record<Portal, string> = {
  medical: 'Medical',
  wellbeing: 'Wellbeing',
  safeguarding: 'Safeguarding',
};
