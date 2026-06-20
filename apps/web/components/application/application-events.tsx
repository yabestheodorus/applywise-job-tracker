'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { createEvent } from '@/app/(app)/events/actions';
import { EventActions } from './event-actions';
import { EventTypeBadge } from './event-type-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SCHEDULED_EVENT_TYPES,
  SCHEDULED_EVENT_TYPE_LABELS,
  formatEventWhen,
  relativeWhen,
  type ScheduledEvent,
  type ScheduledEventType,
} from '@/lib/types';

export function ApplicationEvents({
  applicationId,
  events,
}: {
  applicationId: string;
  events: ScheduledEvent[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ScheduledEventType>('OTHER');
  const [at, setAt] = useState('');

  function reset() {
    setTitle('');
    setType('OTHER');
    setAt('');
    setAdding(false);
  }

  function save() {
    if (!title.trim() || !at) {
      toast.error('Give the event a title and date/time');
      return;
    }
    startSave(async () => {
      const res = await createEvent(applicationId, {
        title: title.trim(),
        type,
        scheduledAt: at,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Event added');
      reset();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No scheduled events.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <EventTypeBadge type={event.type} />
                  <p
                    className={`font-medium leading-tight ${
                      event.completed ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {event.title}
                  </p>
                </div>
                <p className="text-muted-foreground mt-1 text-sm tabular-nums">
                  {formatEventWhen(event.scheduledAt)}
                  {!event.completed ? (
                    <span className="ml-2">· {relativeWhen(event.scheduledAt)}</span>
                  ) : null}
                </p>
                {event.note ? (
                  <p className="text-muted-foreground mt-1 text-sm">{event.note}</p>
                ) : null}
              </div>
              <EventActions id={event.id} completed={event.completed} />
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="border-border flex flex-col gap-3 rounded-lg border border-dashed p-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newEventTitle">Event</Label>
            <Input
              id="newEventTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Technical interview"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newEventType">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ScheduledEventType)}
              >
                <SelectTrigger id="newEventType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULED_EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SCHEDULED_EVENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newEventAt">When</Label>
              <Input
                id="newEventAt"
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              {saving ? 'Adding…' : 'Add event'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" />
          Add event
        </Button>
      )}
    </div>
  );
}
