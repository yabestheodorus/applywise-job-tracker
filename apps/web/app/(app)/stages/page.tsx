import { Layers } from 'lucide-react';

import { PageHeader } from '@/components/page-header';

export const metadata = { title: 'Stages · ApplyWise' };

export default function StagesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <PageHeader
        icon={Layers}
        title="Stages"
        description="Rename, recolor, and reorder your pipeline stages."
        className="mb-6"
      />

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
