import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

import { EventActions } from '@/components/application/event-actions';
import { EventTypeBadge } from '@/components/application/event-type-badge';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/server';
import {
  formatEventWhen,
  relativeWhen,
  type UpcomingEvent,
} from '@/lib/types';

export default async function UpcomingPage() {
  const events = await apiFetch<UpcomingEvent[]>('/events');

  const now = Date.now();
  const overdue = events.filter((e) => new Date(e.scheduledAt).getTime() < now);
  const upcoming = events.filter((e) => new Date(e.scheduledAt).getTime() >= now);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <PageHeader
        icon={CalendarClock}
        title="Upcoming"
        description="Interviews, assessment deadlines, and follow-ups across all your applications — soonest first."
        className="mb-6"
      />

      {events.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center">
          <CalendarClock className="text-muted-foreground size-8" />
          <div>
            <p className="font-medium">Nothing scheduled yet</p>
            <p className="text-muted-foreground text-sm">
              When a status update mentions a date or time, it shows up here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <Section title="Overdue" tone="overdue" events={overdue} />
          )}
          {upcoming.length > 0 && (
            <Section title="Upcoming" tone="normal" events={upcoming} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  tone,
  events,
}: {
  title: string;
  tone: 'overdue' | 'normal';
  events: UpcomingEvent[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} overdue={tone === 'overdue'} />
        ))}
      </div>
    </section>
  );
}

function EventRow({
  event,
  overdue,
}: {
  event: UpcomingEvent;
  overdue: boolean;
}) {
  return (
    <Card
      size="sm"
      className="flex-row items-center justify-between gap-3 border-l-[3px] px-4"
      style={{ borderLeftColor: event.application.status.color }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <EventTypeBadge type={event.type} />
          <p className="font-medium leading-tight">{event.title}</p>
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <Link
            href={`/applications/${event.application.id}`}
            className="hover:text-foreground hover:underline"
          >
            {event.application.company} · {event.application.role}
          </Link>
        </div>
        {event.note ? (
          <p className="text-muted-foreground mt-1 text-sm">{event.note}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p
            className={`text-sm font-medium tabular-nums ${
              overdue ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {relativeWhen(event.scheduledAt)}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatEventWhen(event.scheduledAt)}
          </p>
        </div>
        <EventActions id={event.id} completed={event.completed} />
      </div>
    </Card>
  );
}
