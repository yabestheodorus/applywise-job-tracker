'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, MoreHorizontal, Wallet } from 'lucide-react';
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

export function ApplicationCard({
  app,
  stage,
}: {
  app: Application;
  stage: StatusStage;
}) {
  const router = useRouter();
  const href = `/applications/${app.id}`;

  const matched = app.matchedSkills ?? [];
  const gap = app.gapSkills ?? [];
  const totalSkills = matched.length + gap.length;
  const chips = [
    ...matched.map((s) => ({ s, matched: true })),
    ...gap.map((s) => ({ s, matched: false })),
  ];
  const shown = chips.slice(0, 5);
  const overflow = chips.length - shown.length;

  return (
    <Card className="group hover:border-foreground/15 gap-0 p-0 shadow-xs transition-all hover:shadow-md">
      {/* stage accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: stage.color }} />

      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
            style={{ backgroundColor: `${stage.color}1A`, color: stage.color }}
            aria-hidden
          >
            {initials(app.company)}
          </span>

          <Link href={href} className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{app.company}</p>
            <p className="text-muted-foreground truncate text-xs">{app.role}</p>
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

        {/* meta row */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <SourceIcon source={app.source} />
          {app.location ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{app.location}</span>
            </span>
          ) : null}
          {app.salaryExpected ? (
            <span className="text-foreground/80 inline-flex items-center gap-1 font-medium tabular-nums">
              <Wallet className="size-3.5" />
              {formatIDR(app.salaryExpected)}
            </span>
          ) : null}
        </div>

        {/* skill match */}
        {chips.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {totalSkills > 0 ? (
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {matched.length} matched
                </span>
                <span className="text-border">·</span>
                <span className="text-red-600 dark:text-red-400">{gap.length} gap</span>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1">
              {shown.map(({ s, matched: isMatched }) => (
                <span
                  key={s}
                  className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                    isMatched
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {s}
                </span>
              ))}
              {overflow > 0 ? (
                <span className="text-muted-foreground bg-muted inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                  +{overflow}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* footer dates */}
        {app.deadlineDate || app.followUpDate ? (
          <div className="flex items-center gap-1.5">
            {app.deadlineDate ? (
              <UrgencyChip label="Deadline" date={app.deadlineDate} />
            ) : null}
            {app.followUpDate ? (
              <UrgencyChip label="Follow up" date={app.followUpDate} />
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
