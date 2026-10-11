import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'slate',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 leading-tight font-medium',
    md: 'text-xs px-2.5 py-1 leading-normal font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
