'use client';

import { useState, useTransition } from 'react';
import { Loader2, MessagesSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

import { mockInterviewTurn } from '@/app/(app)/applications/[id]/interview/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MockMessage } from '@/lib/types';

export function InterviewMock({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, startTurn] = useTransition();
  const [started, setStarted] = useState(false);

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
            question at a time and digs in with follow-ups — just like the real
            thing.
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
    <div className="bg-card flex flex-col rounded-xl border shadow-sm">
      <div className="flex max-h-[28rem] min-h-64 flex-col gap-3 overflow-y-auto p-4">
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
  );
}
