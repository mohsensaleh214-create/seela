import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

export function SearchField({
  className = '',
  ...rest
}: { className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
      <input
        type="search"
        className="w-full rounded-[8px] border border-line-strong bg-surface py-2.5 pl-9 pr-3 text-[15px] text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-ink min-h-[44px]"
        {...rest}
      />
    </div>
  );
}
