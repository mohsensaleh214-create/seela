// Core data model for the school staff portal prototype.
// Everything here is dummy, in-memory data. Nothing is ever hard deleted.

export type Role = 'teacher' | 'pastoral-lead' | 'nurse' | 'dsl' | 'senior-dsl';

export type Portal = 'medical' | 'wellbeing' | 'safeguarding';

export interface WithMeta {
  id: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Guardian {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface Student extends WithMeta {
  firstName: string;
  lastName: string;
  preferredName?: string;
  yearGroup: number; // 3-12
  tutorGroup: string;
  campus: 'Girls School' | 'Boys School';
  dateOfBirth: string;
  photoInitial: string;
  guardians: Guardian[];
  flagIds: string[];
  attendanceByWeek?: number[]; // last 8 weeks, percentage, most recent last
}

export interface Certification {
  name: string;
  expiry: string;
}

export interface Staff extends WithMeta {
  firstName: string;
  lastName: string;
  jobTitle: string;
  role: Role;
  campus: 'Girls School' | 'Boys School' | 'Both campuses';
  email: string;
  certifications: Certification[];
}

export type CaseCategory =
  | 'Peer relationships'
  | 'Emotional wellbeing'
  | 'Physical harm'
  | 'Neglect'
  | 'Online safety'
  | 'Attendance concern'
  | 'Family circumstances'
  | 'Behaviour';

export type LevelOfConcern = 'monitored' | 'elevated' | 'immediate';

export type CaseStatus = 'untriaged' | 'open' | 'closed';

export interface Case extends WithMeta {
  studentId: string;
  portal: Portal;
  category: CaseCategory;
  level: LevelOfConcern;
  status: CaseStatus;
  ownerId?: string;
  reportedById: string;
  reportedAt: string;
  occurredAt: string;
  location: string;
  account: string; // locked original account, never edited after submission
  studentWords?: string;
  othersPresent?: string;
  triagedAt?: string;
  triagedById?: string;
  closedAt?: string;
  closedById?: string;
  closureStatement?: string;
  nextReviewDue?: string;
  reopenedFromCaseId?: string;
}

export type EntryType = 'note' | 'action' | 'review' | 'contact' | 'level-change' | 'handover' | 'pattern-flag';

export interface Entry extends WithMeta {
  caseId: string;
  type: EntryType;
  body: string;
  authorId: string;
  // type specific
  fromLevel?: LevelOfConcern;
  toLevel?: LevelOfConcern;
}

export interface Action extends WithMeta {
  caseId: string;
  description: string;
  ownerId: string;
  dueAt: string;
  completedAt?: string;
  outcome?: string;
}

export interface ContactRecord extends WithMeta {
  caseId: string;
  method: 'phone' | 'in person' | 'video call' | 'letter';
  contactedAt: string;
  contactedById: string;
  personSpoken: string;
  relationship: string;
  discussed: string;
  agreed: string;
  nextStep: string;
  isException: boolean;
  exceptionReason?: string;
  authorisedById?: string;
  alternativeAction?: string;
}

export type MedicalRecordType = 'condition' | 'allergy' | 'medication' | 'visit' | 'plan';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface MedicalRecord extends WithMeta {
  studentId: string;
  type: MedicalRecordType;
  severity?: Severity;
  description: string;
  protocol?: string;
  medicationName?: string;
  medicationDose?: string;
  medicationFrequency?: string;
  medicationLocation?: string;
  reviewDate?: string;
  // visit-specific
  visitReason?: string;
  visitTreatment?: string;
  visitTimeIn?: string;
  visitTimeOut?: string;
  visitHomeContacted?: boolean;
}

export type WellbeingRecordType = 'check-in' | 'pastoral-note' | 'session' | 'support-plan';

export interface SupportPlanGoal {
  goal: string;
  reviewDate: string;
  status: 'on track' | 'needs attention' | 'met';
}

export interface WellbeingRecord extends WithMeta {
  studentId: string;
  type: WellbeingRecordType;
  summary: string;
  mood?: 'low' | 'mixed' | 'positive';
  authorId: string;
  goals?: SupportPlanGoal[];
  planReviewDate?: string;
  planStatus?: 'active' | 'closed';
  referralStatus?: 'referred' | 'in progress' | 'completed' | 'declined';
}

export interface Flag extends WithMeta {
  studentId: string;
  sourcePortal: Portal;
  label: string;
  guidance: string;
  visibleToRoles: Role[];
  severity: Severity | 'info';
}

export type AuditAction = 'view' | 'create' | 'edit' | 'export' | 'permission-change';

export interface AuditEvent {
  id: string;
  actorId: string;
  action: AuditAction;
  entityType: 'student' | 'case' | 'medical-record' | 'wellbeing-record' | 'audit-log' | 'report' | 'permissions';
  entityId: string;
  entityLabel: string;
  at: string;
  context?: string;
}

export interface Activity extends WithMeta {
  name: string;
  type: 'trip' | 'fixture' | 'event';
  startsAt: string;
  endsAt: string;
  leadId: string;
  studentIds: string[];
  location: string;
}

export interface PatternFlagState {
  id: string;
  studentId: string;
  summary: string;
  basedOn: string[];
  status: 'open' | 'acknowledged' | 'dismissed';
  dismissReason?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  studentId?: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
  category: 'overdue' | 'due-today' | 'new';
}
