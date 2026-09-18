import type { Student, Case, Action, Activity } from './types';

// A narrow structural type so lib/search.ts doesn't need to import the
// context module (which would create a dependency cycle).
export interface AppStateLike {
  students: Student[];
  cases: Case[];
  actions: Action[];
  activities: Activity[];
}
