'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Dumbbell, MessagesSquare, Layers3 } from 'lucide-react';

import { InterviewPractice } from './interview-practice';
import { InterviewMock } from './interview-mock';
import { InterviewRecap } from './interview-recap';
import type {
  InterviewQuestion,
  InterviewSession,
  MockMessage,
  MockReview,
} from '@/lib/types';

type Mode = 'practice' | 'mock' | 'recap';

const MODES: { key: Mode; label: string; icon: typeof Dumbbell }[] = [
  { key: 'practice', label: 'Practice', icon: Dumbbell },
  { key: 'mock', label: 'Live mock', icon: MessagesSquare },
  { key: 'recap', label: 'Recap & drill', icon: Layers3 },
];

export function InterviewWorkspace({
  applicationId,
  session,
}: {
  applicationId: string;
  session: InterviewSession;
}) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(session.questions);
  const [mode, setMode] = useState<Mode>('practice');
  // Mock state lives here (not in InterviewMock) so switching tabs doesn't reset it,
  // and is mirrored to localStorage so a refresh/crash never loses the transcript.
  const [mockMessages, setMockMessages] = useState<MockMessage[]>([]);
  const [mockStarted, setMockStarted] = useState(false);
  const [mockReview, setMockReview] = useState<MockReview | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const storageKey = `applywise:interview-mock:${session.id}`;

  // Restore any saved mock transcript for this session on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          messages?: MockMessage[];
          started?: boolean;
          review?: MockReview | null;
        };
        if (Array.isArray(saved.messages)) setMockMessages(saved.messages);
        if (saved.started) setMockStarted(true);
        if (saved.review) setMockReview(saved.review);
      }
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (after the initial restore, so we don't clobber it).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          messages: mockMessages,
          started: mockStarted,
          review: mockReview,
        }),
      );
    } catch {
      // ignore storage write failures (quota / private mode)
    }
  }, [hydrated, mockMessages, mockStarted, mockReview, storageKey]);

  function patchQuestion(updated: InterviewQuestion) {
    setQuestions((qs) => qs.map((q) => (q.id === updated.id ? updated : q)));
  }

  const reviewed = questions.filter((q) => q.practiceStatus === 'REVIEWED').length;
  const progress = questions.length
    ? Math.round((reviewed / questions.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href={`/applications/${applicationId}`}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to application
        </Link>

        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Dumbbell className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl leading-tight tracking-tight">
              Interview prep
            </h1>
            <p className="text-muted-foreground truncate text-sm">
              {session.application.company} · {session.application.role}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {reviewed} of {questions.length} questions practiced
          </span>
          <span className="tabular-nums">{progress}% ready</span>
        </div>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Mode switcher */}
      <div className="bg-muted/60 flex gap-1 rounded-lg p-1">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === 'practice' ? (
        <InterviewPractice questions={questions} onUpdate={patchQuestion} />
      ) : mode === 'mock' ? (
        <InterviewMock
          sessionId={session.id}
          messages={mockMessages}
          setMessages={setMockMessages}
          started={mockStarted}
          setStarted={setMockStarted}
          review={mockReview}
          setReview={setMockReview}
        />
      ) : (
        <InterviewRecap questions={questions} onUpdate={patchQuestion} />
      )}
    </div>
  );
}
