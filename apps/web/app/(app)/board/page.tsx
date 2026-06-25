import { Briefcase, CalendarClock, Layers, type LucideIcon } from 'lucide-react';
import { KanbanBoard } from '@/components/board/kanban-board';
import { UpcomingPanel } from '@/components/board/upcoming-panel';
import { PageHeader } from '@/components/page-header';
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
    <div className="bg-card/80 shadow-card flex items-center gap-2.5 rounded-xl border px-3.5 py-2 backdrop-blur">
      <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
        <Icon className="size-3.5" />
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold tabular-nums">{value}</span>
        <span className="text-muted-foreground text-[0.7rem]">{label}</span>
      </div>
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
        <PageHeader
          icon={Briefcase}
          title="Your applications"
          description="One board for every application — paste a message and let AI track the rest."
          actions={
            <>
              <StatPill icon={Briefcase} value={applications.length} label="Applications" />
              <StatPill icon={Layers} value={stages.length} label="Stages" />
              <StatPill icon={CalendarClock} value={events.length} label="Upcoming" />
            </>
          }
        />
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
