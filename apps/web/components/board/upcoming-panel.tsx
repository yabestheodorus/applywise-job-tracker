import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

import { EventTypeBadge } from '@/components/application/event-type-badge';
import { Card } from '@/components/ui/card';
import { relativeWhen, type UpcomingEvent } from '@/lib/types';

/** Compact read-only "what's next" rail for the board. Full controls live on /upcoming. */
export function UpcomingPanel({ events }: { events: UpcomingEvent[] }) {
  const now = Date.now();
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="text-muted-foreground size-4" />
          <h2 className="font-heading text-sm">Upcoming</h2>
        </div>
        <Link href="/upcoming" className="text-primary text-xs hover:underline">
          View all
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground border-t px-4 py-6 text-center text-xs">
          Nothing scheduled
        </p>
      ) : (
        <ul className="divide-border divide-y border-t">
          {events.slice(0, 8).map((event) => {
            const overdue = new Date(event.scheduledAt).getTime() < now;
            return (
              <li key={event.id}>
                <Link
                  href={`/applications/${event.application.id}`}
                  className="hover:bg-muted/50 flex flex-col gap-1 px-4 py-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <EventTypeBadge type={event.type} />
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        overdue ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {relativeWhen(event.scheduledAt)}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {event.application.company}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
