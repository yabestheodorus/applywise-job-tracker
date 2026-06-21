import { Layers } from 'lucide-react';

export const metadata = { title: 'Stages · ApplyWise' };

export default function StagesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Layers className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl leading-tight tracking-tight">
            Stages
          </h1>
          <p className="text-muted-foreground text-sm">
            Rename, recolor, and reorder your pipeline stages.
          </p>
        </div>
      </header>

      <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <Layers className="size-8" />
        <div>
          <p className="text-foreground font-medium">
            Stage management is coming soon
          </p>
          <p className="mx-auto max-w-sm text-sm">
            For now, stages are seeded for you and new ones are created
            automatically when an AI status update needs a stage that doesn’t
            exist yet.
          </p>
        </div>
      </div>
    </div>
  );
}
