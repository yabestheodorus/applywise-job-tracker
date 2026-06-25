'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { recalculateMatch } from '@/app/(app)/applications/actions';
import { MatchBadge } from '@/components/board/match-badge';
import { Button } from '@/components/ui/button';

/**
 * Detail-page header for the Skill match card: the AI score badge + rationale,
 * with a Recalculate button (re-runs Groq against the current profile + job).
 */
export function MatchSummary({
  applicationId,
  score,
  rationale,
}: {
  applicationId: string;
  score: number | null;
  rationale: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function recalc() {
    start(async () => {
      const res = await recalculateMatch(applicationId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Match score updated');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        {score == null ? (
          <span className="text-muted-foreground text-sm">
            Not scored yet — add your profile, then recalculate.
          </span>
        ) : (
          <MatchBadge score={score} showLabel className="text-sm" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={recalc}
          disabled={pending}
          className="gap-1.5"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {score == null ? 'Calculate' : 'Recalculate'}
        </Button>
      </div>
      {rationale ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{rationale}</p>
      ) : null}
    </div>
  );
}
