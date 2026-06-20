import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationCard } from './application-card';
import type { Application, StatusStage } from '@/lib/types';

export function KanbanColumn({
  stage,
  apps,
}: {
  stage: StatusStage;
  apps: Application[];
}) {
  return (
    <section className="bg-muted/40 flex w-80 shrink-0 flex-col rounded-xl">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <h2 className="font-heading text-sm">{stage.label}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
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

      <div className="flex flex-col gap-3 px-3 pb-3">
        {apps.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-xs">
            Nothing here yet
          </div>
        ) : (
          apps.map((app) => (
            <ApplicationCard key={app.id} app={app} stage={stage} />
          ))
        )}
      </div>
    </section>
  );
}
