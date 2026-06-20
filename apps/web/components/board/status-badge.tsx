import { CheckCircle2, XCircle, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';
import { terminalKindOf, type StatusStage } from '@/lib/types';

const terminalIcon = {
  offer: CheckCircle2,
  rejected: XCircle,
  ghosted: Ghost,
} as const;

export function StatusBadge({
  stage,
  className,
}: {
  stage: StatusStage;
  className?: string;
}) {
  const kind = terminalKindOf(stage);
  const TIcon = kind ? terminalIcon[kind] : null;
  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {TIcon ? (
        <TIcon className="size-3.5" style={{ color: stage.color }} />
      ) : (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
      )}
      {stage.label}
    </span>
  );
}
