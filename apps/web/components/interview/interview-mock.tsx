'use client';

import { useState, useTransition, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MessagesSquare,
  RotateCcw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  mockInterviewTurn,
  reviewMockInterview,
} from '@/app/(app)/applications/[id]/interview/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MockMessage, MockReview } from '@/lib/types';

export function InterviewMock({
  sessionId,
  messages,
  setMessages,
  started,
  setStarted,
  review,
  setReview,
}: {
  sessionId: string;
  messages: MockMessage[];
  setMessages: Dispatch<SetStateAction<MockMessage[]>>;
  started: boolean;
  setStarted: Dispatch<SetStateAction<boolean>>;
  review: MockReview | null;
  setReview: Dispatch<SetStateAction<MockReview | null>>;
}) {
  const [input, setInput] = useState('');
  const [pending, startTurn] = useTransition();
  const [reviewing, startReview] = useTransition();

  const hasAnswered = messages.some((m) => m.role === 'user');

  function runTurn(history: MockMessage[]) {
    startTurn(async () => {
      const res = await mockInterviewTurn(sessionId, history);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setMessages([...history, { role: 'assistant', content: res.data.reply }]);
    });
  }

  function start() {
    setStarted(true);
    runTurn([]);
  }

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    const next: MockMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    runTurn(next);
  }

  function finish() {
    startReview(async () => {
      const res = await reviewMockInterview(sessionId, messages);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setReview(res.data);
      toast.success('Here’s your debrief');
    });
  }

  function restart() {
    setMessages([]);
    setReview(null);
    setStarted(false);
  }

  if (!started) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-xl border p-8 text-center shadow-sm">
        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
          <MessagesSquare className="size-6" />
        </span>
        <div>
          <p className="font-medium">Live mock interview</p>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            A back-and-forth with an AI interviewer for this role. It asks one
            question at a time and digs in with follow-ups. When you’re done, hit
            <span className="font-medium"> Finish</span> for a full debrief.
          </p>
        </div>
        <Button type="button" onClick={start} disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessagesSquare className="size-4" />
          )}
          Start mock interview
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex flex-col rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-medium">Mock interview</p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={finish}
              disabled={!hasAnswered || pending || reviewing}
            >
              {reviewing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ClipboardCheck className="size-4" />
              )}
              {reviewing ? 'Reviewing…' : 'Finish & get feedback'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={restart}
              aria-label="Restart"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex max-h-112 min-h-64 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending ? (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Interviewer is thinking…
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-end gap-2 border-t p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your answer… (Enter to send, Shift+Enter for a new line)"
            className="max-h-32 min-h-11"
          />
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={pending || !input.trim()}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {review ? (
        <div className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Interview debrief</p>
            <span className="bg-primary/15 text-primary inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
              {review.score}/5
            </span>
          </div>
          <p className="text-sm leading-relaxed">{review.summary}</p>

          {review.strengths.length ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                What went well
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {review.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {review.improvements.length ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Work on this
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {review.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="text-primary mt-0.5 size-4 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
