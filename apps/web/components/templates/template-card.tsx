'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteTemplate, updateTemplate } from '@/app/(app)/templates/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { topicColor, topicHex } from '@/lib/topic-color';
import type { Template } from '@/lib/types';

export function TemplateCard({ template }: { template: Template }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();

  const [topic, setTopic] = useState(template.topic);
  const [question, setQuestion] = useState(template.question);
  const [answer, setAnswer] = useState(template.answer);

  async function copy() {
    try {
      await navigator.clipboard.writeText(template.answer);
      setCopied(true);
      toast.success('Answer copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  function save() {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    startSave(async () => {
      const res = await updateTemplate(template.id, {
        topic: topic.trim() || 'Others',
        question: question.trim(),
        answer: answer.trim(),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Template updated');
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startRemove(async () => {
      const res = await deleteTemplate(template.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Template deleted');
      router.refresh();
    });
  }

  if (editing) {
    return (
      <Card
        className="gap-3 border-l-[3px] p-4"
        style={{ borderLeftColor: topicHex(topic) }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`t-${template.id}`}>Topic</Label>
          <Input
            id={`t-${template.id}`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Salary"
            className="max-w-48"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`q-${template.id}`}>Question</Label>
          <Input
            id={`q-${template.id}`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`a-${template.id}`}>Answer</Label>
          <Textarea
            id={`a-${template.id}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="max-h-72 min-h-24"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setQuestion(template.question);
              setAnswer(template.answer);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group gap-2 border-l-[3px] p-4"
      style={{ borderLeftColor: topicHex(template.topic) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span
            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${topicColor(
              template.topic,
            )}`}
          >
            {template.topic}
          </span>
          <h3 className="font-medium leading-snug">{template.question}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={copy}
            aria-label="Copy answer"
            title="Copy answer"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setEditing(true)}
            aria-label="Edit"
            title="Edit"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-7"
            onClick={remove}
            disabled={removing}
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
        {template.answer}
      </p>
    </Card>
  );
}
