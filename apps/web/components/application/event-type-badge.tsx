import {
  AlarmClock,
  Bell,
  CalendarClock,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import {
  SCHEDULED_EVENT_TYPE_LABELS,
  type ScheduledEventType,
} from '@/lib/types';

const META: Record<
  ScheduledEventType,
  { Icon: React.ComponentType<{ className?: string }>; chip: string }
> = {
  INTERVIEW: {
    Icon: Users,
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  ASSESSMENT: {
    Icon: ClipboardCheck,
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  DEADLINE: {
    Icon: AlarmClock,
    chip: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  FOLLOWUP: {
    Icon: Bell,
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  OTHER: { Icon: CalendarClock, chip: 'bg-muted text-muted-foreground' },
};

export function EventTypeBadge({ type }: { type: ScheduledEventType }) {
  const { Icon, chip } = META[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${chip}`}
    >
      <Icon className="size-3.5" />
      {SCHEDULED_EVENT_TYPE_LABELS[type]}
    </span>
  );
}
