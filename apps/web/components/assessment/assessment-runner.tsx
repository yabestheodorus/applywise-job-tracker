'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { submitAssessment } from '@/app/(app)/skills/actions';
import { DifficultyBadge } from '@/components/assessment/difficulty-badge';
import { Button } from '@/components/ui/button';
import type { Assessment } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D'];

export function AssessmentRunner({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const questions = assessment.questions;
  const total = questions.length;
  const question = questions[index]!;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const progress = useMemo(
    () => Math.round((answeredCount / total) * 100),
    [answeredCount, total],
  );

  function choose(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  }

  function submit() {
    if (!allAnswered) {
      toast.error(`Answer all ${total} questions first (${answeredCount}/${total} done).`);
      return;
    }
    start(async () => {
      const res = await submitAssessment(
        assessment.id,
        Object.entries(answers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Test graded');
      router.refresh();
    });
  }

  const selected = answers[question.id];

  return (
    <div className="flex flex-col gap-5">
      {/* progress */}
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
          <span>
            Question {index + 1} of {total}
          </span>
          <span className="tabular-nums">{answeredCount}/{total} answered</span>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-gradient-brand h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* question card */}
      <div className="bg-card shadow-card rounded-2xl border p-5 ring-1 ring-foreground/5">
        <div className="mb-3 flex items-center gap-2">
          <DifficultyBadge difficulty={question.difficulty} />
          {question.subtopic ? (
            <span className="text-muted-foreground text-xs">{question.subtopic}</span>
          ) : null}
        </div>

        <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
          {question.scenario}
        </p>
        <p className="mb-4 font-medium">{question.prompt}</p>

        <div className="flex flex-col gap-2">
          {question.options.map((option, i) => {
            const active = selected === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                  active
                    ? 'border-primary bg-primary/5 ring-primary/30 ring-1'
                    : 'hover:border-foreground/20 hover:bg-muted/40'
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* nav */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        {index < total - 1 ? (
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending} className="gap-2">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Submit test
          </Button>
        )}
      </div>

      {/* quick jump dots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`size-2.5 rounded-full transition-all ${
                i === index
                  ? 'bg-primary ring-primary/30 ring-2 ring-offset-1'
                  : answered
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/30'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
