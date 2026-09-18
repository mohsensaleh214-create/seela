import type { ThemeKey } from '@/lib/portal-theme';
import { tone } from '@/lib/portal-theme';

const PORTAL_TAGLINE: Record<string, string> = {
  medical: 'Health conditions, medication and nurse visits',
  wellbeing: 'Pastoral support, check-ins and counselling',
  safeguarding: 'Concerns, cases and the level of concern',
};

export function PortalHeader({ portal, title, description }: { portal: ThemeKey; title: string; description?: string }) {
  const t = tone(portal);
  return (
    <div className="rounded-[12px] px-6 py-5" style={{ backgroundColor: t.tint }}>
      <p className="text-[13px] font-medium uppercase tracking-wide" style={{ color: t.accentDeep }}>
        {portal !== 'neutral' ? portal.charAt(0).toUpperCase() + portal.slice(1) : ''}
      </p>
      <h1 className="mt-1 text-[28px] font-semibold leading-[1.2] text-ink">{title}</h1>
      <p className="mt-1 text-[15px] text-ink-body">{description ?? PORTAL_TAGLINE[portal]}</p>
    </div>
  );
}
