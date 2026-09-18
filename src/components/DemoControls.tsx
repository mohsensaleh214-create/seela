import { useState } from 'react';
import { format } from 'date-fns';
import { RotateCcw, FastForward } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function DemoControls({ compact }: { compact?: boolean }) {
  const { state, now, dispatch } = useApp();
  const { show } = useToast();
  const [resetting, setResetting] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {!compact && <p className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">Demo tools</p>}
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="text-ink-body">
          Today is <span className="font-medium text-ink">{format(now, 'd MMM yyyy')}</span>
          {state.clockOffsetDays > 0 && ` (+${state.clockOffsetDays}d)`}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<FastForward size={13} />}
          onClick={() => {
            dispatch({ type: 'ADVANCE_CLOCK', days: 1 });
            show('Clock advanced by one day. Watch reminders become overdue.', 'info');
          }}
        >
          Advance 1 day
        </Button>
        <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => setResetting(true)}>
          Reset dummy data
        </Button>
      </div>
      <ConfirmDialog
        open={resetting}
        title="Reset dummy data"
        body="This resets every case, record and the clock back to the start of the demo. This cannot be undone."
        confirmLabel="Reset"
        danger
        onCancel={() => setResetting(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET_DEMO' });
          setResetting(false);
          show('Dummy data reset.', 'info');
        }}
      />
    </div>
  );
}
