import type { AppStateLike } from './app-state-like';
import { studentName, canReadCase } from './selectors';
import type { Staff } from './types';
import type { RolePermissions } from './permissions';

export interface SearchResult {
  id: string;
  group: 'Students' | 'Cases' | 'Activities';
  title: string;
  subtitle: string;
  to: string;
}

export function search(state: AppStateLike, query: string, currentUser: Staff, perm: RolePermissions): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const results: SearchResult[] = [];

  for (const s of state.students) {
    const name = studentName(s).toLowerCase();
    if (name.includes(q)) {
      results.push({
        id: s.id,
        group: 'Students',
        title: studentName(s),
        subtitle: `Year ${s.yearGroup} · ${s.tutorGroup} · ${s.campus}`,
        to: `/students/${s.id}`,
      });
    }
  }

  for (const c of state.cases) {
    const student = state.students.find((s) => s.id === c.studentId);
    if (!student) continue;
    const actionOwnerIds = state.actions.filter((a) => a.caseId === c.id).map((a) => a.ownerId);
    const readable = canReadCase(perm, c, student, currentUser, actionOwnerIds);
    if (!readable) continue;
    const haystack = `${studentName(student)} ${c.category} ${c.level}`.toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        id: c.id,
        group: 'Cases',
        title: `${studentName(student)} — ${c.category}`,
        subtitle: `${c.status === 'untriaged' ? 'Untriaged' : c.status === 'open' ? 'Open' : 'Closed'} · ${c.level} level`,
        to: `/safeguarding/cases/${c.id}`,
      });
    }
  }

  for (const a of state.activities) {
    if (a.name.toLowerCase().includes(q)) {
      results.push({
        id: a.id,
        group: 'Activities',
        title: a.name,
        subtitle: a.location,
        to: `/activities/${a.id}`,
      });
    }
  }

  return results.slice(0, 20);
}
