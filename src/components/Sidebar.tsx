import { NavLink, useLocation } from 'react-router-dom';
import { Stethoscope, HeartHandshake, ShieldAlert, Home, ClipboardList, Plane, BarChart3, Settings, Plus, X, Eye, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { canEnterPortal } from '@/lib/permissions';
import { portalSubNav } from '@/lib/nav';
import { PersonAvatar } from '@/components/ui/PersonAvatar';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { DemoControls } from '@/components/DemoControls';
import { staffName } from '@/lib/selectors';
import { tone } from '@/lib/portal-theme';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentUser, permissions, state, dispatch } = useApp();
  const location = useLocation();

  const portals = [
    { key: 'medical', label: 'Medical', to: '/medical', Icon: Stethoscope, allowed: canEnterPortal(currentUser.role, 'medical') },
    { key: 'wellbeing', label: 'Wellbeing', to: '/wellbeing', Icon: HeartHandshake, allowed: canEnterPortal(currentUser.role, 'wellbeing') },
    {
      key: 'safeguarding',
      label: 'Safeguarding',
      to: '/safeguarding',
      Icon: ShieldAlert,
      allowed: canEnterPortal(currentUser.role, 'safeguarding'),
    },
  ] as const;

  const currentPortal = portals.find((p) => location.pathname.startsWith(p.to))?.key as
    | 'medical'
    | 'wellbeing'
    | 'safeguarding'
    | undefined;

  const subNav = currentPortal ? portalSubNav(currentPortal, permissions) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-3">
        <p className="text-[16px] font-semibold text-ink">Seela</p>
        <p className="text-[12px] text-ink-muted">Staff portal · Misk Schools</p>
      </div>

      <div className="px-4 pb-4">
        <NavLink
          to="/raise-concern"
          onClick={onNavigate}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[8px] bg-ink px-3 py-2.5 text-[15px] font-medium text-white hover:bg-black"
        >
          <Plus size={16} aria-hidden />
          Raise a concern
        </NavLink>
      </div>

      <nav aria-label="Portals" className="flex flex-col gap-0.5 px-3">
        <SidebarLink to="/" label="Today" Icon={Home} onNavigate={onNavigate} end />
        <SidebarLink to="/registration" label="Registration" Icon={ClipboardList} onNavigate={onNavigate} />
        <SidebarLink to="/house-points" label="House points" Icon={Trophy} onNavigate={onNavigate} />
        {portals
          .filter((p) => p.allowed)
          .map((p) => (
            <SidebarLink key={p.key} to={p.to} label={p.label} Icon={p.Icon} onNavigate={onNavigate} accent={p.key} />
          ))}
        <SidebarLink to="/activities" label="Activities" Icon={Plane} onNavigate={onNavigate} />
        {currentUser.role !== 'teacher' && <SidebarLink to="/reporting" label="Reporting" Icon={BarChart3} onNavigate={onNavigate} />}
      </nav>

      {currentPortal && subNav.length > 0 && (
        <div className="mt-4 border-t border-line px-3 pt-4">
          <p className="px-3 pb-1 text-[12px] font-medium uppercase tracking-wide text-ink-muted">
            {currentPortal.charAt(0).toUpperCase() + currentPortal.slice(1)}
          </p>
          <nav aria-label={`${currentPortal} navigation`} className="flex flex-col gap-0.5">
            {subNav.map((link) => (
              <SidebarLink key={link.key} to={link.to} label={link.label} onNavigate={onNavigate} indent accent={currentPortal} end />
            ))}
          </nav>
        </div>
      )}

      <div className="mt-auto border-t border-line px-4 py-4">
        {permissions.guidanceScope !== 'all' && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_DUTY_MODE' })}
            aria-pressed={state.dutyMode}
            className={`mb-3 flex w-full items-center justify-between gap-2 rounded-[8px] border px-3 py-2.5 text-left transition-colors duration-150 ${
              state.dutyMode ? 'border-caution bg-caution-tint' : 'border-line-strong bg-surface hover:bg-surface-sunken'
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye size={16} className={state.dutyMode ? 'text-caution-deep' : 'text-ink-muted'} aria-hidden />
              <span>
                <span className={`block text-[13px] font-medium ${state.dutyMode ? 'text-caution-deep' : 'text-ink'}`}>On duty</span>
                <span className="block text-[11px] text-ink-muted">See guidance for any student</span>
              </span>
            </span>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ${
                state.dutyMode ? 'bg-caution' : 'bg-line-strong'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150 ${
                  state.dutyMode ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={staffName(currentUser)} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-ink">{staffName(currentUser)}</p>
            <p className="truncate text-[12px] text-ink-muted">{currentUser.jobTitle}</p>
          </div>
        </div>
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="mt-3 flex min-h-[40px] items-center gap-1.5 rounded-[8px] px-2 text-[14px] text-ink-body hover:bg-surface-sunken"
        >
          <Settings size={16} aria-hidden />
          Settings
        </NavLink>
        <div className="mt-3 flex flex-col gap-3 rounded-[8px] border border-line-strong border-dashed p-2.5">
          <RoleSwitcher />
          <DemoControls compact />
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  Icon,
  onNavigate,
  indent,
  accent,
  end,
}: {
  to: string;
  label: string;
  Icon?: typeof Home;
  onNavigate?: () => void;
  indent?: boolean;
  accent?: 'medical' | 'wellbeing' | 'safeguarding';
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex min-h-[40px] items-center gap-2.5 rounded-[8px] px-3 text-[15px] transition-colors duration-150 ${
          indent ? 'ml-1' : ''
        } ${isActive ? 'font-medium text-ink' : 'text-ink-body hover:bg-surface-sunken'}`
      }
      style={({ isActive }) => (isActive ? { backgroundColor: tone(accent ?? 'neutral').tint } : undefined)}
    >
      {Icon && <Icon size={17} aria-hidden />}
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-[264px] lg:shrink-0 lg:border-r lg:border-line lg:bg-surface">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-surface shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-full p-1.5 text-ink-muted hover:bg-surface-sunken"
        >
          <X size={18} aria-hidden />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
