import { KanbanLane } from './kanban-lane';
import type { Application, StatusStage } from '@/lib/types';

export function KanbanBoard({
  stages,
  applications,
}: {
  stages: StatusStage[];
  applications: Application[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {stages.map((stage) => (
        <KanbanLane
          key={stage.id}
          stage={stage}
          apps={applications.filter((a) => a.statusId === stage.id)}
        />
      ))}
    </div>
  );
}
