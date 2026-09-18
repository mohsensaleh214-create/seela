import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { ThemeKey } from '@/lib/portal-theme';
import { tone } from '@/lib/portal-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  portal?: ThemeKey;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', portal = 'neutral', icon, className = '', children, style, ...rest },
  ref,
) {
  const t = tone(portal);
  const sizeClasses = size === 'sm' ? 'text-[13px] px-3 py-1.5 gap-1.5' : 'text-[15px] px-4 py-2.5 gap-2';

  const base =
    'inline-flex items-center justify-center rounded-[8px] font-medium transition-colors duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0';

  if (variant === 'primary') {
    return (
      <button
        ref={ref}
        className={`${base} ${sizeClasses} text-white ${className}`}
        style={{ backgroundColor: t.accent, ...style }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = t.accentDeep)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = t.accent)}
        {...rest}
      >
        {icon}
        {children}
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        ref={ref}
        className={`${base} ${sizeClasses} text-white bg-urgent hover:brightness-90 ${className}`}
        {...rest}
      >
        {icon}
        {children}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        ref={ref}
        className={`${base} ${sizeClasses} text-ink-body hover:bg-surface-sunken ${className}`}
        {...rest}
      >
        {icon}
        {children}
      </button>
    );
  }

  return (
    <button
      ref={ref}
      className={`${base} ${sizeClasses} border border-line-strong text-ink bg-surface hover:bg-surface-sunken ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
