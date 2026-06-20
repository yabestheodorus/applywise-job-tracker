'use client';

import { useTransition } from 'react';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteEvent, setEventCompleted } from '@/app/(app)/events/actions';
import { Button } from '@/components/ui/button';

/** Done / reopen + delete controls for a single scheduled event. */
export function EventActions({
  id,
  completed,
}: {
  id: string;
  completed: boolean;
}) {
  const [pending, start] = useTransition();

  function toggleDone() {
    start(async () => {
      const res = await setEventCompleted(id, !completed);
      if (!res.ok) toast.error(res.error);
      else toast.success(completed ? 'Marked as not done' : 'Marked as done');
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteEvent(id);
      if (!res.ok) toast.error(res.error);
      else toast.success('Event removed');
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={pending}
        onClick={toggleDone}
        aria-label={completed ? 'Reopen event' : 'Mark done'}
        title={completed ? 'Reopen' : 'Mark done'}
      >
        {completed ? (
          <RotateCcw className="size-4" />
        ) : (
          <Check className="size-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive size-7"
        disabled={pending}
        onClick={remove}
        aria-label="Delete event"
        title="Delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
