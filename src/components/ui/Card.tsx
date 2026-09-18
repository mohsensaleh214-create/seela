import type { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[12px] border border-line bg-surface ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-[16px] font-semibold leading-[1.4] text-ink ${className}`}>{children}</h3>;
}
