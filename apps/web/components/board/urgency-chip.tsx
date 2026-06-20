import { AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { urgencyOf, relativeDays, type Urgency } from '@/lib/types';

const styles: Record<Urgency, string> = {
  overdue:
    'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  soon: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  normal: 'bg-muted text-muted-foreground',
};

const icons: Record<Urgency, React.ComponentType<{ className?: string }>> = {
  overdue: AlertCircle,
  soon: Clock,
  normal: CalendarDays,
};

export function UrgencyChip({
  label,
  date,
}: {
  label: string;
  date: string;
}) {
  const urgency = urgencyOf(date);
  const Icon = icons[urgency];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        styles[urgency],
      )}
      title={`${label}: ${date}`}
    >
      <Icon className="size-3.5" />
      {relativeDays(date)}
    </span>
  );
}
