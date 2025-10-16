import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

type ProgressProps = {
  value: number;
  max: number;
  label?: ReactNode;
  className?: string;
  barClassName?: string;
};

export function Progress({ value, max, label, className, barClassName }: ProgressProps) {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.max(0, Math.min(1, value / safeMax));

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <div className="text-xs font-medium text-plum-600 md:text-sm">{label}</div> : null}
      <div
        className="h-2 rounded-full bg-plum-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={value}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-plum-400 via-plum-500 to-plum-600 transition-all duration-300 ease-out',
            barClassName,
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
