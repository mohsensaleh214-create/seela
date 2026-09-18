import type { AuditEvent } from '@/lib/types';
import { auditSentence } from '@/lib/audit';

export function AuditEntry({ event, actorName }: { event: AuditEvent; actorName: string }) {
  return (
    <li className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
      <p className="text-[15px] text-ink-body">{auditSentence(event, actorName)}</p>
    </li>
  );
}
