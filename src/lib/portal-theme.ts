import type { Portal } from './types';

export type ThemeKey = Portal | 'neutral';

export interface PortalTone {
  accent: string;
  accentDeep: string;
  tint: string;
  ring: string;
  bg: string;
  bgHover: string;
  text: string;
  textOn: string;
  border: string;
}

const TONES: Record<ThemeKey, PortalTone> = {
  medical: {
    accent: 'var(--color-medical)',
    accentDeep: 'var(--color-medical-deep)',
    tint: 'var(--color-medical-tint)',
    ring: 'focus-ring-medical',
    bg: 'bg-medical',
    bgHover: 'hover:bg-medical-deep',
    text: 'text-medical',
    textOn: 'text-white',
    border: 'border-medical',
  },
  wellbeing: {
    accent: 'var(--color-wellbeing)',
    accentDeep: 'var(--color-wellbeing-deep)',
    tint: 'var(--color-wellbeing-tint)',
    ring: 'focus-ring-wellbeing',
    bg: 'bg-wellbeing',
    bgHover: 'hover:bg-wellbeing-deep',
    text: 'text-wellbeing',
    textOn: 'text-white',
    border: 'border-wellbeing',
  },
  safeguarding: {
    accent: 'var(--color-safeguarding)',
    accentDeep: 'var(--color-safeguarding-deep)',
    tint: 'var(--color-safeguarding-tint)',
    ring: 'focus-ring-safeguarding',
    bg: 'bg-safeguarding',
    bgHover: 'hover:bg-safeguarding-deep',
    text: 'text-safeguarding',
    textOn: 'text-white',
    border: 'border-safeguarding',
  },
  neutral: {
    accent: 'var(--color-ink)',
    accentDeep: '#000000',
    tint: 'var(--color-surface-sunken)',
    ring: '',
    bg: 'bg-ink',
    bgHover: 'hover:bg-black',
    text: 'text-ink',
    textOn: 'text-white',
    border: 'border-ink',
  },
};

export function tone(key: ThemeKey = 'neutral'): PortalTone {
  return TONES[key];
}

export const PORTAL_ROUTE: Record<Portal, string> = {
  medical: '/medical',
  wellbeing: '/wellbeing',
  safeguarding: '/safeguarding',
};

export const PORTAL_ICON_LABEL: Record<Portal, string> = {
  medical: 'Medical',
  wellbeing: 'Wellbeing',
  safeguarding: 'Safeguarding',
};
