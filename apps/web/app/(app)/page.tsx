import { KanbanBoard } from '@/components/board/kanban-board';
import { UpcomingPanel } from '@/components/board/upcoming-panel';
import { apiFetch } from '@/lib/api/server';
import type { Application, StatusStage, UpcomingEvent } from '@/lib/types';

export default async function BoardPage() {
  const [stages, applications, events] = await Promise.all([
    apiFetch<StatusStage[]>('/stages'),
    apiFetch<Application[]>('/applications'),
    apiFetch<UpcomingEvent[]>('/events'),
  ]);

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-heading text-2xl">Your applications</h1>
        <p className="text-muted-foreground text-sm">
          Track every application across stages. Use “Add application” to capture a
          new one with AI.
        </p>
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
