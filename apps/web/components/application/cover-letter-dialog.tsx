'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, FileText, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { generateCoverLetter } from '@/app/(app)/applications/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CoverLetterDialog({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function generate() {
    start(async () => {
      const res = await generateCoverLetter(applicationId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setLetter(res.data.coverLetter);
    });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    // Generate the first draft as soon as the dialog opens.
    if (next && !letter && !pending) generate();
  }

  async function copy() {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    toast.success('Cover letter copied');
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="size-4" />
          Generate cover letter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cover letter draft</DialogTitle>
          <DialogDescription>
            AI-written from this job and your profile. Review, tweak, and copy —
            it isn’t saved.
          </DialogDescription>
        </DialogHeader>

        {pending && !letter ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Writing your cover letter…
          </div>
        ) : letter ? (
          <>
            <div className="bg-muted/40 max-h-[55vh] overflow-y-auto rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {letter}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={generate}
                disabled={pending}
                className="gap-2"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Regenerate
              </Button>
              <Button onClick={copy} className="gap-2">
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
