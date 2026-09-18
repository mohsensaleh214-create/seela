import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function FilterBar({ children, chips }: { children: ReactNode; chips: FilterChip[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface px-3 py-1 text-[13px] text-ink-body hover:bg-surface-sunken"
            >
              {chip.label}
              <X size={12} aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="rounded-[8px] border border-line-strong bg-surface px-2.5 py-2 text-[13px] text-ink min-h-[40px]"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
