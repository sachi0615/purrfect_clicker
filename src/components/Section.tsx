import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

type SectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export function Section({
  title,
  description,
  icon,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
}: SectionProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg backdrop-blur md:p-6',
        'focus-within:ring-2 focus-within:ring-plum-400/60',
        className,
      )}
    >
      {(title || description || icon || action) && (
        <header
          className={cn(
            'mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
            headerClassName,
          )}
        >
          <div className="flex items-start gap-3">
            {icon ? <div className="mt-0.5 text-plum-500">{icon}</div> : null}
            <div>
              {title ? (
                <h2 className="text-lg font-semibold text-plum-900 md:text-xl">{title}</h2>
              ) : null}
              {description ? (
                <p className="text-sm text-plum-600 md:text-base">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}
      <div className={cn('space-y-3 md:space-y-4', contentClassName)}>{children}</div>
    </section>
  );
}
