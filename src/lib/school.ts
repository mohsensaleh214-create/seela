// Derived from the Misk Schools curriculum map: Junior Schools (Kindergarten and
// Lower Primary), Upper Primary Schools, Middle Schools and Senior Schools. Our
// dummy data uses Year 3-12; Year 3 is the youngest year we seed, so it sits in
// Junior Schools alongside where Lower Primary would continue.
export type SchoolTier = 'Junior Schools' | 'Upper Primary Schools' | 'Middle Schools' | 'Senior Schools';

export const SCHOOL_TIERS: SchoolTier[] = ['Junior Schools', 'Upper Primary Schools', 'Middle Schools', 'Senior Schools'];

export function schoolTier(yearGroup: number): SchoolTier {
  if (yearGroup <= 3) return 'Junior Schools';
  if (yearGroup <= 6) return 'Upper Primary Schools';
  if (yearGroup <= 8) return 'Middle Schools';
  return 'Senior Schools';
}

export function classesBySchool(students: { yearGroup: number; tutorGroup: string }[]): Map<SchoolTier, string[]> {
  const sets = new Map<SchoolTier, Set<string>>();
  for (const s of students) {
    const tier = schoolTier(s.yearGroup);
    if (!sets.has(tier)) sets.set(tier, new Set());
    sets.get(tier)!.add(s.tutorGroup);
  }
  const out = new Map<SchoolTier, string[]>();
  for (const [tier, set] of sets) out.set(tier, Array.from(set).sort());
  return out;
}
