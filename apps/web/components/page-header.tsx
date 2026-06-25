import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Unified page heading: a gradient brand icon badge, a Cal-Sans title, a muted
 * subtitle, and an optional right-aligned slot for stats/actions. Used across
 * every top-level app page so the product reads as one coherent surface.
 */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-3.5">
        <span className="bg-gradient-brand text-primary-foreground shadow-brand flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-foreground text-2xl leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground mt-0.5 max-w-2xl text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
