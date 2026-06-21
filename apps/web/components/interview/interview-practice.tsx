'use client';

import { useState, useTransition } from 'react';
import {
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  coachInterviewAnswer,
  saveInterviewTemplate,
} from '@/app/(app)/applications/[id]/interview/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CategoryBadge } from './category-badge';
import type { InterviewQuestion } from '@/lib/types';

export function InterviewPractice({
  questions,
  onUpdate,
}: {
  questions: InterviewQuestion[];
  onUpdate: (q: InterviewQuestion) => void;
}) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState(questions[0]?.userAnswer ?? '');
  const [coaching, startCoach] = useTransition();
  const [saving, startSave] = useTransition();

  const q = questions[index];
  if (!q) return null;

  function go(next: number) {
    const clamped = Math.max(0, Math.min(questions.length - 1, next));
    setIndex(clamped);
    setDraft(questions[clamped]?.userAnswer ?? '');
  }

  function handleCoach() {
    const question = questions[index];
    if (!question) return;
    if (!draft.trim()) {
      toast.error('Write an answer first');
      return;
    }
    startCoach(async () => {
      const res = await coachInterviewAnswer(question.id, draft.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onUpdate(res.data);
      toast.success('Coached — review the feedback below');
    });
  }

  function handleSave() {
    const question = questions[index];
    if (!question) return;
    startSave(async () => {
      const res = await saveInterviewTemplate(question.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onUpdate({ ...question, savedTemplateId: res.data.id });
      toast.success('Saved to your template library');
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Question header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={q.category} />
          <span className="text-muted-foreground text-xs tabular-nums">
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous question"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => go(index + 1)}
            disabled={index === questions.length - 1}
            aria-label="Next question"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
        <div>
          <p className="font-heading text-lg leading-snug">{q.question}</p>
          {q.rationale ? (
            <p className="text-muted-foreground mt-1 text-sm">{q.rationale}</p>
          ) : null}
        </div>

        {q.talkingPoints.length ? (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
              <Lightbulb className="size-3.5" />
              Points to weave in
            </p>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {q.talkingPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Answer in your own words first — then get coaching."
            className="max-h-60 min-h-28 overflow-y-auto"
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 self-start"
            onClick={handleCoach}
            disabled={coaching}
          >
            {coaching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {coaching ? 'Coaching…' : 'Get coaching'}
          </Button>
        </div>
      </div>

      {/* Coaching result */}
      {q.feedback ? (
        <div className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Coach feedback</p>
            {q.score != null ? (
              <span className="bg-primary/15 text-primary inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                {q.score}/5
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed">{q.feedback}</p>

          {q.improvedAnswer ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Stronger version
              </p>
              <p className="bg-background rounded-lg border p-3 text-sm leading-relaxed">
                {q.improvedAnswer}
              </p>
            </div>
          ) : null}

          {q.keyPoints.length ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Key points to remember
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {q.keyPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            {q.savedTemplateId ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                <Check className="size-4 text-emerald-600" />
                Saved to library
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BookmarkPlus className="size-4" />
                )}
                Save answer to library
              </Button>
            )}
            {index < questions.length - 1 ? (
              <Button
                type="button"
                size="sm"
                className="ml-auto gap-1"
                onClick={() => go(index + 1)}
              >
                Next question
                <ChevronRight className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
