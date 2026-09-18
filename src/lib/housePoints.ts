import type { House, HousePointReason } from './types';

export const HOUSES: House[] = ['Safa', 'Marwa', 'Arafat'];

export const REASON_PRESETS: { reason: HousePointReason; points: number }[] = [
  { reason: 'Kindness', points: 3 },
  { reason: 'Effort', points: 3 },
  { reason: 'Teamwork', points: 5 },
  { reason: 'Leadership', points: 5 },
  { reason: 'Achievement', points: 10 },
];

export interface HouseTone {
  base: string;
  deep: string;
  tint: string;
}

export function houseTone(house: House): HouseTone {
  if (house === 'Safa') return { base: 'var(--color-safa)', deep: 'var(--color-safa-deep)', tint: 'var(--color-safa-tint)' };
  if (house === 'Marwa') return { base: 'var(--color-marwa)', deep: 'var(--color-marwa-deep)', tint: 'var(--color-marwa-tint)' };
  return { base: 'var(--color-arafat)', deep: 'var(--color-arafat-deep)', tint: 'var(--color-arafat-tint)' };
}
