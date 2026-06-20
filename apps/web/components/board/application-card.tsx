'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SourceIcon } from './source-icon';
import { UrgencyChip } from './urgency-chip';
import { formatIDR, type Application, type StatusStage } from '@/lib/types';

export function ApplicationCard({
  app,
  stage,
}: {
  app: Application;
  stage: StatusStage;
}) {
  const router = useRouter();
  const href = `/applications/${app.id}`;
  return (
    <Card
      className="group hover:border-foreground/15 gap-0 border-l-[3px] p-3 shadow-xs transition-shadow hover:shadow-md"
      style={{ borderLeftColor: stage.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="min-w-0">
          <p className="truncate font-medium leading-tight">{app.company}</p>
          <p className="text-muted-foreground truncate text-sm">{app.role}</p>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground -mr-1 -mt-1 size-7 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Card actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(href)}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(href)}>
              Update status
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <SourceIcon source={app.source} />
        {app.salaryExpected ? (
          <span className="text-foreground/80 text-xs font-medium tabular-nums">
            {formatIDR(app.salaryExpected)}
          </span>
        ) : null}
      </div>

      {(app.matchedSkills?.length || app.gapSkills?.length) && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {app.matchedSkills?.map((s) => (
            <span
              key={s}
              className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            >
              {s}
            </span>
          ))}
          {app.gapSkills?.map((s) => (
            <span
              key={s}
              className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {(app.followUpDate || app.deadlineDate) && (
        <div className="mt-3 flex items-center gap-1.5">
          {app.deadlineDate ? (
            <UrgencyChip label="Deadline" date={app.deadlineDate} />
          ) : null}
          {app.followUpDate ? (
            <UrgencyChip label="Follow up" date={app.followUpDate} />
          ) : null}
        </div>
      )}
    </Card>
  );
}
