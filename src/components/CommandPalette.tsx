import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppContext';
import { search } from '@/lib/search';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, currentUser, permissions } = useApp();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => search(state, query, currentUser, permissions), [state, query, currentUser, permissions]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[activeIndex]) {
        navigate(results[activeIndex].to);
        onClose();
      }
    }
    if (open) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, results, activeIndex, navigate]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  let flatIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/40 px-4 pt-24" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={18} className="text-ink-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search students, cases and activities"
            aria-label="Search"
            className="flex-1 text-[16px] text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="rounded-full p-1 text-ink-muted hover:bg-surface-sunken">
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {query.trim().length === 0 && (
            <p className="px-4 py-6 text-center text-[14px] text-ink-muted">Type two or three letters of a name to start.</p>
          )}
          {query.trim().length > 0 && results.length === 0 && (
            <p className="px-4 py-6 text-center text-[14px] text-ink-muted">No matches.</p>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-4 pb-1 pt-2 text-[12px] font-medium uppercase tracking-wide text-ink-muted">{group}</p>
              {items.map((r) => {
                flatIndex += 1;
                const idx = flatIndex;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      navigate(r.to);
                      onClose();
                    }}
                    className={`flex w-full flex-col items-start px-4 py-2.5 text-left ${idx === activeIndex ? 'bg-surface-sunken' : ''}`}
                  >
                    <span className="text-[15px] text-ink">{r.title}</span>
                    <span className="text-[13px] text-ink-muted">{r.subtitle}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
