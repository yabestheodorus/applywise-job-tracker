import { MessagePreview } from './message-preview';
import type { StatusEvent } from '@/lib/types';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatWhenFull(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StatusTimeline({ events }: { events: StatusEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No status history yet.</p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-5">
      {events.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pl-1">
          {/* connector line to the next (older) event */}
          {i < events.length - 1 ? (
            <span
              className="bg-border absolute left-[7px] top-4 h-[calc(100%+4px)] w-px"
              aria-hidden
            />
          ) : null}
          <span
            className="mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-background"
            style={{ backgroundColor: event.status.color }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="font-medium leading-tight">{event.status.label}</p>
              <time className="text-muted-foreground text-xs tabular-nums">
                {formatWhen(event.occurredAt)}
              </time>
            </div>
            {event.note ? (
              <p className="text-muted-foreground mt-0.5 text-sm">{event.note}</p>
            ) : null}
            {event.rawText ? (
              <MessagePreview
                text={event.rawText}
                stageLabel={event.status.label}
                stageColor={event.status.color}
                when={formatWhenFull(event.occurredAt)}
                note={event.note}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
