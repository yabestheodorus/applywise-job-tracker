import { KanbanBoard } from '@/components/board/kanban-board';
import { apiFetch } from '@/lib/api/server';
import type { Application, StatusStage } from '@/lib/types';

export default async function BoardPage() {
  const [stages, applications] = await Promise.all([
    apiFetch<StatusStage[]>('/stages'),
    apiFetch<Application[]>('/applications'),
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
      <KanbanBoard stages={stages} applications={applications} />
    </div>
  );
}
