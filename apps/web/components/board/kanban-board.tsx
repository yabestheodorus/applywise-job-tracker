import { KanbanColumn } from './kanban-column';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Application, StatusStage } from '@/lib/types';

export function KanbanBoard({
  stages,
  applications,
}: {
  stages: StatusStage[];
  applications: Application[];
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 px-6 pb-6">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            apps={applications.filter((a) => a.statusId === stage.id)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
