import type { RolePermissions } from './permissions';

export interface NavLink {
  key: string;
  label: string;
  to: string;
}

export function portalSubNav(portal: 'medical' | 'wellbeing' | 'safeguarding', perm: RolePermissions): NavLink[] {
  if (portal === 'medical') {
    const links: NavLink[] = [{ key: 'daily', label: "Today's medical view", to: '/medical' }];
    if (perm.medical === 'summary' || perm.medical === 'full') {
      links.push(
        { key: 'plans', label: 'Healthcare plans', to: '/medical/plans' },
        { key: 'allergies', label: 'Allergies and medication', to: '/medical/allergies' },
      );
    }
    return links;
  }
  if (portal === 'wellbeing') {
    const links: NavLink[] = [{ key: 'overview', label: 'Wellbeing overview', to: '/wellbeing' }];
    if (perm.wellbeing === 'own-year-full' || perm.wellbeing === 'full') {
      links.push(
        { key: 'plans', label: 'Support plans', to: '/wellbeing/plans' },
        { key: 'referrals', label: 'Counselling referrals', to: '/wellbeing/referrals' },
        { key: 'patterns', label: 'Year and house patterns', to: '/wellbeing/patterns' },
      );
    }
    return links;
  }
  const links: NavLink[] = [];
  if (perm.safeguarding === 'none') return links;
  if (perm.triage) links.push({ key: 'triage', label: 'Triage queue', to: '/safeguarding/triage' });
  links.push({ key: 'register', label: 'Register and caseload', to: '/safeguarding/register' });
  if (perm.stalledScope !== 'none') links.push({ key: 'stalled', label: 'Stalled', to: '/safeguarding/stalled' });
  return links;
}
