import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import {
  STUDENTS,
  STAFF,
  CASES,
  ENTRIES,
  ACTIONS,
  CONTACT_RECORDS,
  MEDICAL_RECORDS,
  WELLBEING_RECORDS,
  FLAGS,
  AUDIT_EVENTS,
  ACTIVITIES,
  PATTERN_FLAGS,
} from '@/lib/fixtures';
import { ANCHOR_DATE } from '@/lib/clock';
import { perms } from '@/lib/permissions';
import type {
  Student,
  Staff,
  Case,
  Entry,
  Action,
  ContactRecord,
  MedicalRecord,
  WellbeingRecord,
  Flag,
  AuditEvent,
  Activity,
  PatternFlagState,
  LevelOfConcern,
  CaseCategory,
  Notification,
} from '@/lib/types';

interface AppState {
  students: Student[];
  staff: Staff[];
  cases: Case[];
  entries: Entry[];
  actions: Action[];
  contactRecords: ContactRecord[];
  medicalRecords: MedicalRecord[];
  wellbeingRecords: WellbeingRecord[];
  flags: Flag[];
  auditEvents: AuditEvent[];
  activities: Activity[];
  patternFlags: PatternFlagState[];
  currentUserId: string;
  clockOffsetDays: number;
  seq: number;
}

function initialState(): AppState {
  return {
    students: STUDENTS,
    staff: STAFF,
    cases: CASES,
    entries: ENTRIES,
    actions: ACTIONS,
    contactRecords: CONTACT_RECORDS,
    medicalRecords: MEDICAL_RECORDS,
    wellbeingRecords: WELLBEING_RECORDS,
    flags: FLAGS,
    auditEvents: AUDIT_EVENTS,
    activities: ACTIVITIES,
    patternFlags: PATTERN_FLAGS,
    currentUserId: 'staff-emily-carter',
    clockOffsetDays: 0,
    seq: 5000,
  };
}

type Action_ =
  | { type: 'SWITCH_ROLE'; staffId: string }
  | { type: 'ADVANCE_CLOCK'; days: number }
  | { type: 'RESET_DEMO' }
  | {
      type: 'RAISE_CONCERN';
      payload: {
        studentId: string;
        portal: Case['portal'];
        category: CaseCategory;
        occurredAt: string;
        location: string;
        account: string;
        studentWords?: string;
        othersPresent?: string;
        reportedById: string;
      };
    }
  | { type: 'TRIAGE_CASE'; caseId: string; level: LevelOfConcern; ownerId: string; actorId: string; note?: string }
  | { type: 'SET_LEVEL'; caseId: string; level: LevelOfConcern; actorId: string; note: string }
  | { type: 'ADD_ENTRY'; caseId: string; entryType: Entry['type']; body: string; actorId: string }
  | { type: 'ADD_REVIEW'; caseId: string; body: string; nextReviewDue?: string; actorId: string }
  | { type: 'ADD_ACTION'; caseId: string; description: string; ownerId: string; dueAt: string; actorId: string }
  | { type: 'COMPLETE_ACTION'; actionId: string; outcome: string; actorId: string }
  | { type: 'ADD_CONTACT_RECORD'; record: Omit<ContactRecord, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>; actorId: string }
  | { type: 'CLOSE_CASE'; caseId: string; closureStatement: string; actorId: string }
  | { type: 'REOPEN_CASE'; caseId: string; reason: string; actorId: string }
  | {
      type: 'ADD_MEDICAL_RECORD';
      record: Omit<MedicalRecord, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;
      actorId: string;
    }
  | {
      type: 'ADD_WELLBEING_RECORD';
      record: Omit<WellbeingRecord, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;
      actorId: string;
    }
  | { type: 'ACK_PATTERN_FLAG'; id: string }
  | { type: 'DISMISS_PATTERN_FLAG'; id: string; reason: string }
  | { type: 'AUTHORISE_CONTACT_EXCEPTION'; recordId: string; actorId: string }
  | { type: 'UPDATE_SUPPORT_PLAN_GOAL'; recordId: string; goalIndex: number; status: 'on track' | 'needs attention' | 'met'; actorId: string }
  | { type: 'CLOSE_SUPPORT_PLAN'; recordId: string; actorId: string }
  | { type: 'UPDATE_REFERRAL_STATUS'; recordId: string; status: 'referred' | 'in progress' | 'completed' | 'declined'; actorId: string }
  | { type: 'LOG_AUDIT'; event: Omit<AuditEvent, 'id' | 'at'> };

function nextId(state: AppState, prefix: string): [string, number] {
  const n = state.seq + 1;
  return [`${prefix}-${n}`, n];
}

function nowIso(state: AppState): string {
  const d = new Date(ANCHOR_DATE);
  d.setDate(d.getDate() + state.clockOffsetDays);
  return d.toISOString();
}

function withMeta(actorId: string, at: string) {
  return { createdAt: at, createdBy: actorId, updatedAt: at, updatedBy: actorId };
}

function reducer(state: AppState, action: Action_): AppState {
  switch (action.type) {
    case 'SWITCH_ROLE':
      return { ...state, currentUserId: action.staffId };
    case 'ADVANCE_CLOCK':
      return { ...state, clockOffsetDays: state.clockOffsetDays + action.days };
    case 'RESET_DEMO':
      return initialState();
    case 'RAISE_CONCERN': {
      const at = nowIso(state);
      const [caseId, n] = nextId(state, 'case');
      const newCase: Case = {
        id: caseId,
        studentId: action.payload.studentId,
        portal: action.payload.portal,
        category: action.payload.category,
        level: 'monitored',
        status: 'untriaged',
        reportedById: action.payload.reportedById,
        reportedAt: at,
        occurredAt: action.payload.occurredAt,
        location: action.payload.location,
        account: action.payload.account,
        studentWords: action.payload.studentWords,
        othersPresent: action.payload.othersPresent,
        ...withMeta(action.payload.reportedById, at),
      };
      const auditEvent: AuditEvent = {
        id: `audit-${n}`,
        actorId: action.payload.reportedById,
        action: 'create',
        entityType: 'case',
        entityId: caseId,
        entityLabel: 'a new concern',
        at,
      };
      return {
        ...state,
        cases: [...state.cases, newCase],
        auditEvents: [...state.auditEvents, auditEvent],
        seq: n,
      };
    }
    case 'TRIAGE_CASE': {
      const at = nowIso(state);
      const [entryId, n] = nextId(state, 'entry');
      const entry: Entry = {
        id: entryId,
        caseId: action.caseId,
        type: 'level-change',
        body: action.note ?? `Triaged and set to ${action.level}.`,
        authorId: action.actorId,
        toLevel: action.level,
        ...withMeta(action.actorId, at),
      };
      const reviewDays = action.level === 'immediate' ? 2 : action.level === 'elevated' ? 7 : 21;
      const reviewDate = new Date(at);
      reviewDate.setDate(reviewDate.getDate() + reviewDays);
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.caseId
            ? {
                ...c,
                status: 'open',
                level: action.level,
                ownerId: action.ownerId,
                triagedAt: at,
                triagedById: action.actorId,
                nextReviewDue: reviewDate.toISOString(),
                updatedAt: at,
                updatedBy: action.actorId,
              }
            : c,
        ),
        entries: [...state.entries, entry],
        seq: n,
      };
    }
    case 'SET_LEVEL': {
      const at = nowIso(state);
      const target = state.cases.find((c) => c.id === action.caseId);
      const [entryId, n] = nextId(state, 'entry');
      const entry: Entry = {
        id: entryId,
        caseId: action.caseId,
        type: 'level-change',
        body: action.note,
        authorId: action.actorId,
        fromLevel: target?.level,
        toLevel: action.level,
        ...withMeta(action.actorId, at),
      };
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.caseId ? { ...c, level: action.level, updatedAt: at, updatedBy: action.actorId } : c,
        ),
        entries: [...state.entries, entry],
        seq: n,
      };
    }
    case 'ADD_ENTRY': {
      const at = nowIso(state);
      const [entryId, n] = nextId(state, 'entry');
      const entry: Entry = {
        id: entryId,
        caseId: action.caseId,
        type: action.entryType,
        body: action.body,
        authorId: action.actorId,
        ...withMeta(action.actorId, at),
      };
      return { ...state, entries: [...state.entries, entry], seq: n };
    }
    case 'ADD_REVIEW': {
      const at = nowIso(state);
      const [entryId, n] = nextId(state, 'entry');
      const entry: Entry = {
        id: entryId,
        caseId: action.caseId,
        type: 'review',
        body: action.body,
        authorId: action.actorId,
        ...withMeta(action.actorId, at),
      };
      return {
        ...state,
        entries: [...state.entries, entry],
        cases: state.cases.map((c) =>
          c.id === action.caseId && action.nextReviewDue
            ? { ...c, nextReviewDue: action.nextReviewDue, updatedAt: at, updatedBy: action.actorId }
            : c,
        ),
        seq: n,
      };
    }
    case 'ADD_ACTION': {
      const at = nowIso(state);
      const [actionId, n] = nextId(state, 'action');
      const newAction: Action = {
        id: actionId,
        caseId: action.caseId,
        description: action.description,
        ownerId: action.ownerId,
        dueAt: action.dueAt,
        ...withMeta(action.actorId, at),
      };
      return { ...state, actions: [...state.actions, newAction], seq: n };
    }
    case 'COMPLETE_ACTION': {
      const at = nowIso(state);
      return {
        ...state,
        actions: state.actions.map((a) =>
          a.id === action.actionId
            ? { ...a, completedAt: at, outcome: action.outcome, updatedAt: at, updatedBy: action.actorId }
            : a,
        ),
      };
    }
    case 'ADD_CONTACT_RECORD': {
      const at = nowIso(state);
      const [recordId, n] = nextId(state, 'contact');
      const record: ContactRecord = { id: recordId, ...action.record, ...withMeta(action.actorId, at) };
      return { ...state, contactRecords: [...state.contactRecords, record], seq: n };
    }
    case 'CLOSE_CASE': {
      const at = nowIso(state);
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.caseId
            ? {
                ...c,
                status: 'closed',
                closedAt: at,
                closedById: action.actorId,
                closureStatement: action.closureStatement,
                updatedAt: at,
                updatedBy: action.actorId,
              }
            : c,
        ),
      };
    }
    case 'REOPEN_CASE': {
      const at = nowIso(state);
      const original = state.cases.find((c) => c.id === action.caseId);
      if (!original) return state;
      const [newCaseId, n] = nextId(state, 'case');
      const reopened: Case = {
        ...original,
        id: newCaseId,
        status: 'open',
        closedAt: undefined,
        closedById: undefined,
        closureStatement: undefined,
        reopenedFromCaseId: original.id,
        updatedAt: at,
        updatedBy: action.actorId,
      };
      const [entryId] = nextId(state, 'entry');
      const entry: Entry = {
        id: entryId,
        caseId: newCaseId,
        type: 'note',
        body: `Reopened: ${action.reason}. Original closed record preserved and linked.`,
        authorId: action.actorId,
        ...withMeta(action.actorId, at),
      };
      return { ...state, cases: [...state.cases, reopened], entries: [...state.entries, entry], seq: n + 1 };
    }
    case 'ADD_MEDICAL_RECORD': {
      const at = nowIso(state);
      const [recordId, n] = nextId(state, 'med');
      const record: MedicalRecord = { id: recordId, ...action.record, ...withMeta(action.actorId, at) };
      return { ...state, medicalRecords: [...state.medicalRecords, record], seq: n };
    }
    case 'ADD_WELLBEING_RECORD': {
      const at = nowIso(state);
      const [recordId, n] = nextId(state, 'well');
      const record: WellbeingRecord = { id: recordId, ...action.record, ...withMeta(action.actorId, at) };
      return { ...state, wellbeingRecords: [...state.wellbeingRecords, record], seq: n };
    }
    case 'ACK_PATTERN_FLAG':
      return {
        ...state,
        patternFlags: state.patternFlags.map((p) => (p.id === action.id ? { ...p, status: 'acknowledged' } : p)),
      };
    case 'DISMISS_PATTERN_FLAG':
      return {
        ...state,
        patternFlags: state.patternFlags.map((p) =>
          p.id === action.id ? { ...p, status: 'dismissed', dismissReason: action.reason } : p,
        ),
      };
    case 'AUTHORISE_CONTACT_EXCEPTION': {
      const at = nowIso(state);
      return {
        ...state,
        contactRecords: state.contactRecords.map((r) =>
          r.id === action.recordId
            ? { ...r, authorisedById: action.actorId, updatedAt: at, updatedBy: action.actorId }
            : r,
        ),
      };
    }
    case 'UPDATE_SUPPORT_PLAN_GOAL': {
      const at = nowIso(state);
      return {
        ...state,
        wellbeingRecords: state.wellbeingRecords.map((r) =>
          r.id === action.recordId && r.goals
            ? {
                ...r,
                goals: r.goals.map((g, i) => (i === action.goalIndex ? { ...g, status: action.status } : g)),
                updatedAt: at,
                updatedBy: action.actorId,
              }
            : r,
        ),
      };
    }
    case 'CLOSE_SUPPORT_PLAN': {
      const at = nowIso(state);
      return {
        ...state,
        wellbeingRecords: state.wellbeingRecords.map((r) =>
          r.id === action.recordId ? { ...r, planStatus: 'closed', updatedAt: at, updatedBy: action.actorId } : r,
        ),
      };
    }
    case 'UPDATE_REFERRAL_STATUS': {
      const at = nowIso(state);
      return {
        ...state,
        wellbeingRecords: state.wellbeingRecords.map((r) =>
          r.id === action.recordId ? { ...r, referralStatus: action.status, updatedAt: at, updatedBy: action.actorId } : r,
        ),
      };
    }
    case 'LOG_AUDIT': {
      const at = nowIso(state);
      const [eventId, n] = nextId(state, 'audit');
      const event: AuditEvent = { id: eventId, at, ...action.event };
      return { ...state, auditEvents: [...state.auditEvents, event], seq: n };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action_>;
  now: Date;
  currentUser: Staff;
  permissions: ReturnType<typeof perms>;
  logAudit: (event: Omit<AuditEvent, 'id' | 'at'>) => void;
  notifications: Notification[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const now = useMemo(() => {
    const d = new Date(ANCHOR_DATE);
    d.setDate(d.getDate() + state.clockOffsetDays);
    return d;
  }, [state.clockOffsetDays]);

  const currentUser = useMemo(
    () => state.staff.find((s) => s.id === state.currentUserId) ?? state.staff[0],
    [state.staff, state.currentUserId],
  );

  const permissions = useMemo(() => perms(currentUser.role), [currentUser.role]);

  const logAudit = (event: Omit<AuditEvent, 'id' | 'at'>) => {
    dispatch({ type: 'LOG_AUDIT', event });
  };

  const notifications = useMemo(() => buildNotifications(state, currentUser, now), [state, currentUser, now]);

  const value: AppContextValue = { state, dispatch, now, currentUser, permissions, logAudit, notifications };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function buildNotifications(state: AppState, currentUser: Staff, now: Date): Notification[] {
  const out: Notification[] = [];
  const isSenior = currentUser.role === 'senior-dsl';

  for (const c of state.cases) {
    if (c.status !== 'open') continue;
    const student = state.students.find((s) => s.id === c.studentId);
    if (!student) continue;
    const studentName = `${student.preferredName ?? student.firstName} ${student.lastName}`;

    // Actions assigned to me, due today or overdue
    const myActions = state.actions.filter((a) => a.caseId === c.id && !a.completedAt);
    for (const a of myActions) {
      const due = new Date(a.dueAt);
      const overdue = due.getTime() < now.getTime();
      const dueToday = due.toDateString() === now.toDateString();
      if (a.ownerId === currentUser.id && (overdue || dueToday)) {
        out.push({
          id: `notif-action-${a.id}`,
          recipientId: currentUser.id,
          studentId: student.id,
          message: `${overdue ? 'Overdue: ' : 'Due today: '}${a.description} for ${studentName}`,
          link: `/safeguarding/cases/${c.id}`,
          createdAt: a.dueAt,
          read: false,
          category: overdue ? 'overdue' : 'due-today',
        });
      }
      // Escalation: overdue action on an elevated/immediate case reaches the senior DSL
      if (isSenior && overdue && (c.level === 'elevated' || c.level === 'immediate') && a.ownerId !== currentUser.id) {
        out.push({
          id: `notif-escalate-${a.id}`,
          recipientId: currentUser.id,
          studentId: student.id,
          message: `Escalated: "${a.description}" for ${studentName} is overdue and has not been actioned`,
          link: `/safeguarding/cases/${c.id}`,
          createdAt: a.dueAt,
          read: false,
          category: 'overdue',
        });
      }
    }

    // Review due today or overdue, for the case owner
    if (c.ownerId === currentUser.id && c.nextReviewDue) {
      const due = new Date(c.nextReviewDue);
      const overdue = due.getTime() < now.getTime() && due.toDateString() !== now.toDateString();
      const dueToday = due.toDateString() === now.toDateString();
      if (overdue || dueToday) {
        out.push({
          id: `notif-review-${c.id}`,
          recipientId: currentUser.id,
          studentId: student.id,
          message: `${overdue ? 'Review overdue' : 'Review due today'}: ${studentName}'s case`,
          link: `/safeguarding/cases/${c.id}`,
          createdAt: c.nextReviewDue,
          read: false,
          category: overdue ? 'overdue' : 'due-today',
        });
      }
    }

    // Case assigned to me recently
    if (c.ownerId === currentUser.id && c.triagedAt) {
      const triaged = new Date(c.triagedAt);
      const hoursSince = (now.getTime() - triaged.getTime()) / 36e5;
      if (hoursSince >= 0 && hoursSince < 24) {
        out.push({
          id: `notif-assigned-${c.id}`,
          recipientId: currentUser.id,
          studentId: student.id,
          message: `You were assigned ${studentName}'s case`,
          link: `/safeguarding/cases/${c.id}`,
          createdAt: c.triagedAt,
          read: false,
          category: 'new',
        });
      }
    }

    // A report I filed has been triaged
    if (c.reportedById === currentUser.id && c.triagedAt) {
      const triaged = new Date(c.triagedAt);
      const hoursSince = (now.getTime() - triaged.getTime()) / 36e5;
      if (hoursSince >= 0 && hoursSince < 24) {
        out.push({
          id: `notif-triaged-${c.id}`,
          recipientId: currentUser.id,
          studentId: student.id,
          message: `Your report on ${studentName} has been triaged`,
          link: `/safeguarding/cases/${c.id}`,
          createdAt: c.triagedAt,
          read: false,
          category: 'new',
        });
      }
    }
  }

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
