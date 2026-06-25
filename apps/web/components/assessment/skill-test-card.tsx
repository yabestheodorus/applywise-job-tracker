'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { startAssessment } from '@/app/(app)/skills/actions';
import { ProficiencyBadge } from '@/components/assessment/proficiency-badge';
import { Button } from '@/components/ui/button';
import type { AssessmentSummary } from '@/lib/types';

export function SkillTestCard({
  skill,
  latest,
}: {
  skill: string;
  latest?: AssessmentSummary;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const inProgress = latest?.status === 'IN_PROGRESS';
  const completed = latest?.status === 'COMPLETED';

  function begin() {
    if (inProgress && latest) {
      router.push(`/skills/${latest.id}`);
      return;
    }
    start(async () => {
      const res = await startAssessment(skill);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/skills/${res.data.id}`);
    });
  }

  return (
    <div className="bg-card shadow-card hover:shadow-card-hover group flex flex-col gap-3 rounded-2xl border p-4 ring-1 ring-foreground/5 transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading min-w-0 truncate text-base leading-tight" title={skill}>
          {skill}
        </h3>
        {completed ? (
          <ProficiencyBadge level={latest!.level} />
        ) : inProgress ? (
          <span className="text-primary bg-primary/10 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium">
            In progress
          </span>
        ) : (
          <span className="text-muted-foreground bg-muted inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium">
            Not tested
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-sm tabular-nums">
        {completed
          ? `Last score ${latest!.scorePct}% · ${latest!.correctCount}/${latest!.questionCount} correct`
          : inProgress
            ? 'Resume your unfinished test.'
            : 'Take a 12-question real-world test to gauge your level.'}
      </p>

      <Button
        type="button"
        onClick={begin}
        disabled={pending}
        variant={completed ? 'outline' : 'default'}
        className="mt-auto gap-2 self-start"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : inProgress ? (
          <ArrowRight className="size-4" />
        ) : completed ? (
          <RotateCcw className="size-4" />
        ) : (
          <Play className="size-4" />
        )}
        {pending
          ? 'Generating…'
          : inProgress
            ? 'Resume'
            : completed
              ? 'Retake'
              : 'Start test'}
      </Button>
    </div>
  );
}
