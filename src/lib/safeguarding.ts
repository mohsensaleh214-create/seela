import type { Case, Action, ContactRecord, Entry } from './types';

export interface ClosureCondition {
  key: string;
  label: string;
  met: boolean;
  hint: string;
}

export function closureConditions(
  c: Case,
  actions: Action[],
  contactRecords: ContactRecord[],
  entries: Entry[],
): ClosureCondition[] {
  const caseActions = actions.filter((a) => a.caseId === c.id);
  const allActionsDone = caseActions.length === 0 || caseActions.every((a) => !!a.completedAt);
  const hasContact = contactRecords.some((r) => r.caseId === c.id && (!r.isException || !!r.authorisedById));
  const hasReview = entries.some((e) => e.caseId === c.id && e.type === 'review') || !!c.triagedAt;
  const hasStatement = (c.closureStatement ?? '').trim().length >= 20;

  return [
    {
      key: 'actions',
      label: 'All assigned actions are completed',
      met: allActionsDone,
      hint: caseActions.length === 0 ? 'No actions were needed.' : 'Complete every open action below before closing.',
    },
    {
      key: 'contact',
      label: 'Contact with home has been recorded',
      met: hasContact,
      hint: 'Record a contact-home event, or an authorised exception, in the panel on the right.',
    },
    {
      key: 'review',
      label: 'At least one review has taken place',
      met: hasReview,
      hint: 'Add a review entry before closing.',
    },
    {
      key: 'statement',
      label: 'A closure statement explains why the concern is resolved',
      met: hasStatement,
      hint: 'Write at least a sentence or two below.',
    },
  ];
}

export function isActionOverdue(action: Action, now: Date): boolean {
  return !action.completedAt && new Date(action.dueAt).getTime() < now.getTime();
}

export function isActionDueToday(action: Action, now: Date): boolean {
  return !action.completedAt && new Date(action.dueAt).toDateString() === now.toDateString();
}

export function daysBetween(a: string | Date, b: Date): number {
  const ms = b.getTime() - new Date(a).getTime();
  return Math.floor(ms / 86400000);
}

export type Urgency = 'ok' | 'caution' | 'urgent';

export function triageUrgency(reportedAt: string, now: Date): Urgency {
  const hours = (now.getTime() - new Date(reportedAt).getTime()) / 36e5;
  if (hours >= 48) return 'urgent';
  if (hours >= 24) return 'caution';
  return 'ok';
}

export function reviewUrgency(c: Case, now: Date): Urgency {
  if (!c.nextReviewDue) return 'ok';
  const hours = (now.getTime() - new Date(c.nextReviewDue).getTime()) / 36e5;
  if (hours >= 0) return 'urgent';
  if (hours >= -48) return 'caution';
  return 'ok';
}

export function lastMovementAt(c: Case, entries: Entry[], actions: Action[], contactRecords: ContactRecord[]): string {
  const dates = [
    c.triagedAt,
    ...entries.filter((e) => e.caseId === c.id).map((e) => e.createdAt),
    ...actions.filter((a) => a.caseId === c.id).map((a) => a.completedAt ?? a.createdAt),
    ...contactRecords.filter((r) => r.caseId === c.id).map((r) => r.contactedAt),
  ].filter(Boolean) as string[];
  if (dates.length === 0) return c.reportedAt;
  return dates.reduce((latest, d) => (new Date(d) > new Date(latest) ? d : latest), dates[0]);
}
