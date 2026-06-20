import { ClipboardPaste, Copy, Library, Sparkles } from 'lucide-react';

import { TemplatesManager } from '@/components/templates/templates-manager';
import { apiFetch } from '@/lib/api/server';
import type { Template } from '@/lib/types';

export const metadata = { title: 'Templates · ApplyWise' };

const STEPS = [
  {
    icon: ClipboardPaste,
    title: 'Paste a filled form',
    desc: 'Drop in an application you’ve already answered.',
    tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    icon: Sparkles,
    title: 'AI builds your library',
    desc: 'It pulls out each Q&A and updates matches — no duplicates.',
    tint: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    icon: Copy,
    title: 'Copy when applying',
    desc: 'One click to reuse any answer on your next form.',
    tint: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
];

export default async function TemplatesPage() {
  const templates = await apiFetch<Template[]>('/templates');

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="border-primary/20 from-primary/10 via-primary/5 mb-8 overflow-hidden rounded-2xl border bg-linear-to-br to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm">
            <Library className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl">Templates</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              A reusable library of answers to the questions every application
              keeps asking — “why this company”, salary expectation, notice
              period. Build it once, reuse it everywhere.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, desc, tint }) => (
            <div
              key={title}
              className="bg-background/60 flex items-start gap-3 rounded-xl border p-3"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tint}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-xs leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      <TemplatesManager templates={templates} />
    </div>
  );
}
