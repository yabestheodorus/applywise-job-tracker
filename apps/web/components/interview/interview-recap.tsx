'use client';

import { useState, useTransition } from 'react';
import { Eye, Layers3, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { updateInterviewQuestion } from '@/app/(app)/applications/[id]/interview/actions';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './category-badge';
import type { InterviewQuestion } from '@/lib/types';

// Self-rating buttons → score. <=2 re-queues the card to drill again this round.
const RATINGS: { score: number; label: string; tone: string }[] = [
  { score: 1, label: 'Missed it', tone: 'text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950' },
  { score: 2, label: 'Shaky', tone: 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950' },
  { score: 4, label: 'Got it', tone: 'text-sky-600 border-sky-200 hover:bg-sky-50 dark:hover:bg-sky-950' },
  { score: 5, label: 'Nailed it', tone: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950' },
];

export function InterviewRecap({
  questions,
  onUpdate,
}: {
  questions: InterviewQuestion[];
  onUpdate: (q: InterviewQuestion) => void;
}) {
  const deck = questions.filter((q) => q.keyPoints.length > 0);
  const [queue, setQueue] = useState<string[]>(deck.map((q) => q.id));
  const [revealed, setRevealed] = useState(false);
  const [rating, startRate] = useTransition();

  if (deck.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <Layers3 className="size-8" />
        <div>
          <p className="text-foreground font-medium">Nothing to drill yet</p>
          <p className="mx-auto max-w-sm text-sm">
            Coach a few answers in Practice first — each one’s key points show up
            here as flashcards to lock into memory.
          </p>
        </div>
      </div>
    );
  }

  const current = questions.find((q) => q.id === queue[0]);

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
          <Layers3 className="size-6" />
        </span>
        <div>
          <p className="font-medium">Drilled every card 🎉</p>
          <p className="text-muted-foreground text-sm">
            Those answers should be loaded now. Run it again any time.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            setQueue(deck.map((q) => q.id));
            setRevealed(false);
          }}
        >
          <RotateCcw className="size-4" />
          Drill again
        </Button>
      </div>
    );
  }

  function rate(score: number) {
    const card = current!;
    startRate(async () => {
      const res = await updateInterviewQuestion(card.id, { selfRating: score });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onUpdate(res.data);
      setRevealed(false);
      setQueue((prev) => {
        const [head, ...rest] = prev;
        if (!head) return rest;
        return score <= 2 ? [...rest, head] : rest;
      });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-center text-xs tabular-nums">
        {queue.length} {queue.length === 1 ? 'card' : 'cards'} left this round
      </p>

      <div className="bg-card flex min-h-56 flex-col gap-4 rounded-xl border p-6 shadow-sm">
        <CategoryBadge category={current.category} />
        <p className="font-heading text-lg leading-snug">{current.question}</p>

        {revealed ? (
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {current.keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Recall your key points out loud, then reveal to check.
          </p>
        )}

        <div className="mt-auto">
          {revealed ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RATINGS.map((r) => (
                <button
                  key={r.score}
                  type="button"
                  disabled={rating}
                  onClick={() => rate(r.score)}
                  className={`rounded-lg border bg-transparent px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${r.tone}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setRevealed(true)}
            >
              <Eye className="size-4" />
              Reveal key points
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
