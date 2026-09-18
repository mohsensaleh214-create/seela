// The prototype runs on a virtual clock anchored to a fixed date, so seeded
// "review due tomorrow" style data stays meaningful regardless of when the
// demo is actually run. The demo clock-advance control moves this forward.

export const ANCHOR_DATE = new Date('2026-09-18T08:00:00');

export function fromAnchor(offsetDays: number, hours = 8, minutes = 0): string {
  const d = new Date(ANCHOR_DATE);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}
