'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, RotateCcw, Target, X } from 'lucide-react';
import { toast } from 'sonner';

import { startAssessment } from '@/app/(app)/skills/actions';
import { DifficultyBadge } from '@/components/assessment/difficulty-badge';
import { ProficiencyBadge } from '@/components/assessment/proficiency-badge';
import { Button } from '@/components/ui/button';
import type { Assessment } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D'];

function ringColor(pct: number): string {
  if (pct >= 70) return 'var(--color-chart-1)'; // emerald
  if (pct >= 40) return 'var(--color-chart-3)'; // amber
  return 'var(--color-chart-4)'; // rose
}

export function AssessmentResults({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const score = assessment.scorePct ?? 0;

  function retake() {
    start(async () => {
      const res = await startAssessment(assessment.skill);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/skills/${res.data.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* score summary */}
      <div className="bg-card shadow-card flex flex-col items-center gap-4 rounded-2xl border p-6 ring-1 ring-foreground/5 sm:flex-row sm:items-center sm:gap-6">
        <div
          className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${ringColor(score)} ${score}%, var(--color-muted) 0)`,
          }}
        >
          <div className="bg-card flex size-22 flex-col items-center justify-center rounded-full">
            <span className="text-3xl font-bold tabular-nums">{score}%</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {assessment.correctCount}/{assessment.questionCount}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl">{assessment.skill}</h2>
            <ProficiencyBadge level={assessment.level} />
          </div>
          {assessment.summary ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {assessment.summary}
            </p>
          ) : null}
          <Button
            onClick={retake}
            disabled={pending}
            variant="outline"
            className="mt-1 gap-2"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Retake
          </Button>
        </div>
      </div>

      {/* strengths + focus areas */}
      {(assessment.strengths.length > 0 || assessment.focusAreas.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {assessment.strengths.length > 0 ? (
            <div className="bg-card rounded-2xl border p-4 ring-1 ring-foreground/5">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Check className="size-4" />
                Strong areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assessment.strengths.map((s) => (
                  <span
                    key={s}
                    className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {assessment.focusAreas.length > 0 ? (
            <div className="bg-card rounded-2xl border p-4 ring-1 ring-foreground/5">
              <p className="text-primary mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Target className="size-4" />
                Focus next
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assessment.focusAreas.map((s) => (
                  <span
                    key={s}
                    className="bg-primary/10 text-primary inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* per-question review */}
      <div className="flex flex-col gap-3">
        <h3 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Review
        </h3>
        {assessment.questions.map((q, qi) => {
          const correct = q.isCorrect;
          return (
            <div
              key={q.id}
              className="bg-card rounded-2xl border p-4 ring-1 ring-foreground/5"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white ${
                    correct ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {correct ? <Check className="size-3" /> : <X className="size-3" />}
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  Question {qi + 1}
                </span>
                <DifficultyBadge difficulty={q.difficulty} />
              </div>

              <p className="text-muted-foreground mb-1 text-sm leading-relaxed">
                {q.scenario}
              </p>
              <p className="mb-3 text-sm font-medium">{q.prompt}</p>

              <div className="flex flex-col gap-1.5">
                {q.options.map((option, i) => {
                  const isCorrectOpt = q.correctIndex === i;
                  const isPicked = q.selectedIndex === i;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                        isCorrectOpt
                          ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/50'
                          : isPicked
                            ? 'border-rose-500/40 bg-rose-50 dark:bg-rose-950/50'
                            : 'border-transparent'
                      }`}
                    >
                      <span className="text-muted-foreground w-4 shrink-0 font-semibold">
                        {LETTERS[i]}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrectOpt ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : isPicked ? (
                        <X className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {q.explanation ? (
                <p className="text-muted-foreground bg-muted/40 mt-3 rounded-lg p-3 text-sm leading-relaxed">
                  <span className="text-foreground font-medium">Why: </span>
                  {q.explanation}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
