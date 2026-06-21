'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { generateInterviewSession } from '@/app/(app)/applications/[id]/interview/actions';
import { Button } from '@/components/ui/button';
import type { InterviewSession } from '@/lib/types';

export function InterviewPrepCard({
  applicationId,
  sessions,
}: {
  applicationId: string;
  sessions: InterviewSession[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function startSession() {
    start(async () => {
      const res = await generateInterviewSession(applicationId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Session ready — let’s prep');
      router.push(`/applications/${applicationId}/interview/${res.data.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Generate likely questions for this role, rehearse your answers with AI
        coaching, and drill them until they’re loaded.
      </p>

      {sessions.length ? (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/applications/${applicationId}/interview/${s.id}`}
                className="hover:bg-muted/60 flex items-center justify-between rounded-lg border p-3 text-sm transition-colors"
              >
                <span>
                  {s.questions.length} questions ·{' '}
                  {new Date(s.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {s.readinessScore ?? 0}% ready
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        onClick={startSession}
        disabled={pending}
        className="gap-2 self-start"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {pending
          ? 'Generating…'
          : sessions.length
            ? 'New session'
            : 'Start interview prep'}
      </Button>
    </div>
  );
}
