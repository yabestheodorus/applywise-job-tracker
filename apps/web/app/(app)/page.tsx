import { Briefcase, CalendarClock, Layers, type LucideIcon } from 'lucide-react';
import { KanbanBoard } from '@/components/board/kanban-board';
import { UpcomingPanel } from '@/components/board/upcoming-panel';
import { apiFetch } from '@/lib/api/server';
import type { Application, StatusStage, UpcomingEvent } from '@/lib/types';

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-card flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm">
      <Icon className="text-muted-foreground size-4" />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

export default async function BoardPage() {
  const [stages, applications, events] = await Promise.all([
    apiFetch<StatusStage[]>('/stages'),
    apiFetch<Application[]>('/applications'),
    apiFetch<UpcomingEvent[]>('/events'),
  ]);

  return (
    <div>
      <div className="px-6 pt-6 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Briefcase className="size-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl leading-tight tracking-tight">
                Your applications
              </h1>
              <p className="text-muted-foreground text-sm">
                One board for every application — paste a message and let AI track
                the rest.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatPill icon={Briefcase} value={applications.length} label="Applications" />
            <StatPill icon={Layers} value={stages.length} label="Stages" />
            <StatPill icon={CalendarClock} value={events.length} label="Upcoming" />
          </div>
        </div>
      </div>
      <div className="flex gap-6 px-6 pb-6">
        <div className="min-w-0 flex-1">
          <KanbanBoard stages={stages} applications={applications} />
        </div>
        <aside className="hidden w-80 shrink-0 xl:block">
          <UpcomingPanel events={events} />
        </aside>
      </div>
    </div>
  );
}
