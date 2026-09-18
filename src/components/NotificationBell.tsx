import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';

export function NotificationBell() {
  const { notifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ''}`}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-body hover:bg-surface-sunken"
      >
        <Bell size={20} aria-hidden />
        {notifications.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[11px] font-semibold text-white">
            {notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[340px] rounded-[12px] border border-line bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[15px] font-semibold text-ink">Notifications</p>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-[14px] text-ink-muted">Nothing needs your attention.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(n.link);
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
              >
                <span className="text-[14px] text-ink">{n.message}</span>
                <span className="text-[12px] text-ink-muted">{format(new Date(n.createdAt), 'd MMM, HH:mm')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
