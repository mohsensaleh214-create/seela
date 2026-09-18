import type { AuditEvent } from './types';
import { format } from 'date-fns';

export function auditSentence(event: AuditEvent, actorName: string): string {
  const when = format(new Date(event.at), "d MMM yyyy 'at' HH:mm");
  const verb: Record<AuditEvent['action'], string> = {
    view: 'viewed',
    create: 'created',
    edit: 'updated',
    export: 'exported',
    'permission-change': 'changed permissions on',
  };
  return `${actorName} ${verb[event.action]} ${event.entityLabel}, ${when}.`;
}
