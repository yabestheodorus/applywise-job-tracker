'use client';

import { useState } from 'react';

import { FormattedText } from './formatted-text';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

/** Collapse the LLM Markdown to a single readable line for the clamped preview. */
function toPlain(md: string): string {
  return md
    .replace(/\r\n/g, '\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .split('\n')
    .map((l) => l.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean)
    .join(' · ');
}

export function MessagePreview({
  text,
  stageLabel,
  stageColor,
  when,
  note,
}: {
  text: string;
  stageLabel: string;
  stageColor: string;
  when: string;
  note: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="View full message"
        className="bg-muted/50 hover:bg-muted text-muted-foreground mt-2 block w-full rounded-md border-l-2 px-3 py-2 text-left text-sm transition-colors"
      >
        <span className="line-clamp-2 wrap-anywhere">{toPlain(text)}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: stageColor }}
              />
              {stageLabel}
            </SheetTitle>
            <SheetDescription className="tabular-nums">{when}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 px-4 pb-6">
            {note ? <p className="text-sm font-medium">{note}</p> : null}
            <FormattedText text={text} className="text-foreground text-sm" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
