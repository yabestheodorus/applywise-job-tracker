'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  applyTemplates,
  createTemplate,
  extractTemplates,
} from '@/app/(app)/templates/actions';
import { TemplateCard } from './template-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { topicColor } from '@/lib/topic-color';
import type { Template } from '@/lib/types';

type DraftRow = {
  matchedId: string | null;
  topic: string;
  question: string;
  answer: string;
  include: boolean;
};

export function TemplatesManager({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();
  const [adding, startAdd] = useTransition();

  const [rawText, setRawText] = useState('');
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const topics = useMemo(() => {
    const seen = new Map<string, string>(); // lowercased → display label
    for (const t of templates) {
      const label = t.topic.trim() || 'Others';
      const key = label.toLowerCase();
      if (!seen.has(key)) seen.set(key, label);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const visible = topicFilter
    ? templates.filter(
        (t) => (t.topic.trim() || 'Others').toLowerCase() === topicFilter.toLowerCase(),
      )
    : templates;

  const questionById = useMemo(
    () => new Map(templates.map((t) => [t.id, t.question])),
    [templates],
  );

  function handleExtract() {
    if (!rawText.trim()) {
      toast.error('Paste a filled application form first');
      return;
    }
    startExtract(async () => {
      const res = await extractTemplates(rawText);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.data.items.length === 0) {
        toast.info('No question–answer pairs found in that text');
        return;
      }
      setDrafts(res.data.items.map((it) => ({ ...it, include: true })));
    });
  }

  function patchDraft(i: number, patch: Partial<DraftRow>) {
    setDrafts((prev) =>
      prev ? prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) : prev,
    );
  }

  function handleSaveDrafts() {
    const chosen = (drafts ?? []).filter(
      (d) => d.include && d.question.trim() && d.answer.trim(),
    );
    if (chosen.length === 0) {
      toast.error('Select at least one answer to save');
      return;
    }
    startSave(async () => {
      const res = await applyTemplates(
        chosen.map((d) => ({
          ...(d.matchedId ? { id: d.matchedId } : {}),
          topic: d.topic.trim() || 'Others',
          question: d.question.trim(),
          answer: d.answer.trim(),
        })),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Templates saved');
      setDrafts(null);
      setRawText('');
      router.refresh();
    });
  }

  function handleAdd() {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    startAdd(async () => {
      const res = await createTemplate(
        newTopic.trim() || 'Others',
        newQuestion.trim(),
        newAnswer.trim(),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Template added');
      setNewTopic('');
      setNewQuestion('');
      setNewAnswer('');
      setShowAdd(false);
      router.refresh();
    });
  }

  const newCount = (drafts ?? []).filter((d) => !d.matchedId).length;
  const updateCount = (drafts ?? []).filter((d) => d.matchedId).length;

  return (
    <div className="flex flex-col gap-6">
      {/* AI extract from a pasted form */}
      <Card className="border-primary/30 from-primary/5 gap-3 border bg-linear-to-br to-transparent p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading flex items-center gap-2 text-base">
            <Sparkles className="text-primary size-4" />
            Import from a filled form
          </h2>
          <p className="text-muted-foreground text-sm">
            Paste an application form you’ve already filled out. AI pulls out each
            question and your answer — and updates a matching template instead of
            creating a duplicate.
          </p>
        </div>
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={
            'e.g.\nWhy do you want to join us? — I’m drawn to your work on…\nExpected salary? — IDR 25–30m/month\nNotice period? — 30 days'
          }
          className="max-h-64 min-h-28"
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2 self-start"
          onClick={handleExtract}
          disabled={extracting}
        >
          <Sparkles className="size-4" />
          {extracting ? 'Reading…' : 'Extract with AI'}
        </Button>

        {drafts ? (
          <div className="border-border mt-1 flex flex-col gap-3 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium">
              Review {drafts.length} answer{drafts.length === 1 ? '' : 's'}
              <span className="text-muted-foreground font-normal">
                {' '}
                · {newCount} new, {updateCount} update
                {updateCount === 1 ? '' : 's'}
              </span>
            </p>

            {drafts.map((d, i) => (
              <div
                key={i}
                className="bg-background flex flex-col gap-2 rounded-md border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      d.matchedId
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {d.matchedId
                      ? `Updates: ${questionById.get(d.matchedId) ?? 'existing'}`
                      : 'New'}
                  </span>
                  <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      checked={d.include}
                      onChange={(e) => patchDraft(i, { include: e.target.checked })}
                    />
                    Include
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${topicColor(
                      d.topic,
                    )}`}
                  >
                    {d.topic || 'Others'}
                  </span>
                  <Input
                    value={d.topic}
                    onChange={(e) => patchDraft(i, { topic: e.target.value })}
                    placeholder="Topic"
                    className="h-8 max-w-44"
                  />
                </div>
                <Input
                  value={d.question}
                  onChange={(e) => patchDraft(i, { question: e.target.value })}
                  placeholder="Question"
                />
                <Textarea
                  value={d.answer}
                  onChange={(e) => patchDraft(i, { answer: e.target.value })}
                  placeholder="Answer"
                  className="max-h-48 min-h-16"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="button" onClick={handleSaveDrafts} disabled={saving}>
                {saving ? 'Saving…' : 'Save selected'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDrafts(null)}
              >
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Saved templates */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base">
            Saved answers
            <span className="text-muted-foreground ml-2 text-sm font-normal tabular-nums">
              {templates.length}
            </span>
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAdd((s) => !s)}
          >
            <Plus className="size-4" />
            Add manually
          </Button>
        </div>

        {showAdd ? (
          <Card className="gap-3 p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-t">Topic</Label>
              <Input
                id="new-t"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Motivation"
                className="max-w-48"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-q">Question</Label>
              <Input
                id="new-q"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Why do you want to work at this company?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-a">Answer</Label>
              <Textarea
                id="new-a"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="max-h-72 min-h-24"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={adding}>
                {adding ? 'Adding…' : 'Add template'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        ) : null}

        {topics.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTopicFilter(null)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                topicFilter === null
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              All
            </button>
            {topics.map((topic) => {
              const active = topicFilter?.toLowerCase() === topic.toLowerCase();
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setTopicFilter(active ? null : topic)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${topicColor(
                    topic,
                  )} ${active ? 'ring-foreground/40 ring-2' : 'opacity-80 hover:opacity-100'}`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        ) : null}

        {templates.length === 0 ? (
          <Card className="text-muted-foreground items-center py-10 text-center text-sm">
            No saved answers yet. Import a filled form above or add one manually.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
