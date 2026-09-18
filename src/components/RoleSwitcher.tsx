import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { staffName } from '@/lib/selectors';
import { perms } from '@/lib/permissions';

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { state, dispatch } = useApp();
  const { show } = useToast();

  return (
    <div className="flex flex-col gap-1">
      {!compact && (
        <label htmlFor="role-switcher" className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">
          Demo: switch role
        </label>
      )}
      <select
        id="role-switcher"
        value={state.currentUserId}
        onChange={(e) => {
          dispatch({ type: 'SWITCH_ROLE', staffId: e.target.value });
          const staff = state.staff.find((s) => s.id === e.target.value);
          if (staff) show(`Now viewing as ${staffName(staff)}, ${perms(staff.role).shortLabel}`, 'info');
        }}
        className="rounded-[8px] border border-line-strong bg-surface px-2.5 py-2 text-[13px] text-ink min-h-[40px]"
      >
        {state.staff.map((s) => (
          <option key={s.id} value={s.id}>
            {staffName(s)} — {perms(s.role).shortLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
