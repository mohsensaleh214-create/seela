import type { Case, Student, Staff, Portal } from './types';
import type { RolePermissions } from './permissions';

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
