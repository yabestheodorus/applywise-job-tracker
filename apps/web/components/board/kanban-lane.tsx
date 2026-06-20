import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ApplicationCard } from './application-card';
import type { Application, StatusStage } from '@/lib/types';

export function KanbanLane({
  stage,
  apps,
}: {
  stage: StatusStage;
  apps: Application[];
}) {
  return (
    <section className="bg-muted/40 flex flex-col gap-2 rounded-xl p-3">
      <header className="flex items-center gap-2 px-1">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <h2 className="font-heading text-sm">{stage.label}</h2>
        <span
          className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums"
          style={{ backgroundColor: `${stage.color}1A`, color: stage.color }}
        >
          {apps.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground ml-auto size-7"
          aria-label={`Add to ${stage.label}`}
        >
          <Plus className="size-4" />
        </Button>
      </header>

      {apps.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
          Nothing here yet
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {apps.map((app) => (
              <div key={app.id} className="w-72 shrink-0">
                <ApplicationCard app={app} stage={stage} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </section>
  );
}
