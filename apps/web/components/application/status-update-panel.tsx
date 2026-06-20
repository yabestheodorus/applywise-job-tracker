'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  extractStatusUpdate,
  updateApplicationStatus,
} from '@/app/(app)/applications/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  SCHEDULED_EVENT_TYPES,
  SCHEDULED_EVENT_TYPE_LABELS,
  type ScheduledEventType,
  type StatusConfidence,
  type StatusStage,
} from '@/lib/types';

// Sentinel Select value meaning "create a brand-new stage".
const NEW_STAGE = '__new__';

const CONFIDENCE_STYLE: Record<StatusConfidence, string> = {
  high: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-muted text-muted-foreground',
};

export function StatusUpdatePanel({
  applicationId,
  stages,
  currentStageId,
}: {
  applicationId: string;
  stages: StatusStage[];
  currentStageId: string;
}) {
  const router = useRouter();
  const [extracting, startExtract] = useTransition();
  const [submitting, startSubmit] = useTransition();

  const [message, setMessage] = useState('');
  const [suggested, setSuggested] = useState(false);
  const [confidence, setConfidence] = useState<StatusConfidence | null>(null);
  // The chosen stage: an existing stage id, or NEW_STAGE to create one.
  const [choice, setChoice] = useState<string>(currentStageId);
  const [newStageLabel, setNewStageLabel] = useState('');
  const [note, setNote] = useState('');
  // Optional time-flagged event (AI-suggested or added by hand).
  const [hasEvent, setHasEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<ScheduledEventType>('OTHER');
  const [eventAt, setEventAt] = useState(''); // datetime-local "YYYY-MM-DDTHH:mm"

  function handleExtract() {
    if (!message.trim()) {
      toast.error('Paste the status update first');
      return;
    }
    startExtract(async () => {
      const res = await extractStatusUpdate(applicationId, message);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const s = res.data;
      if (s.stageId && stages.some((st) => st.id === s.stageId)) {
        setChoice(s.stageId);
        setNewStageLabel('');
      } else if (s.newStageLabel) {
        setChoice(NEW_STAGE);
        setNewStageLabel(s.newStageLabel);
      }
      setNote(s.note ?? '');
      if (s.event) {
        setHasEvent(true);
        setEventTitle(s.event.title);
        setEventType(s.event.type);
        // The API returns "YYYY-MM-DDTHH:mm"; trim any seconds for the input.
        setEventAt(s.event.scheduledAt.slice(0, 16));
      } else {
        setHasEvent(false);
        setEventTitle('');
        setEventType('OTHER');
        setEventAt('');
      }
      setConfidence(s.confidence);
      setSuggested(true);
    });
  }

  function handleSubmit() {
    const creatingNew = choice === NEW_STAGE;
    if (creatingNew && !newStageLabel.trim()) {
      toast.error('Name the new stage');
      return;
    }
    if (hasEvent && (!eventTitle.trim() || !eventAt)) {
      toast.error('Give the scheduled event a title and date/time');
      return;
    }
    const event =
      hasEvent && eventTitle.trim() && eventAt
        ? { title: eventTitle.trim(), type: eventType, scheduledAt: eventAt }
        : null;
    startSubmit(async () => {
      const res = await updateApplicationStatus(
        applicationId,
        creatingNew
          ? { newStageLabel: newStageLabel.trim(), note: note.trim() || null, event }
          : { statusId: choice, note: note.trim() || null, event },
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(event ? 'Status updated · event added' : 'Status updated');
      setMessage('');
      setSuggested(false);
      setConfidence(null);
      setNote('');
      setHasEvent(false);
      setEventTitle('');
      setEventType('OTHER');
      setEventAt('');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="statusMessage">Paste a status update</Label>
        <Textarea
          id="statusMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. an email: 'Lamaranmu sedang direview lebih lanjut' or 'We'd like to invite you to a technical interview.'"
          className="max-h-48 min-h-24 overflow-y-auto"
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2 self-start"
          onClick={handleExtract}
          disabled={extracting}
        >
          <Sparkles className="size-4" />
          {extracting ? 'Reading…' : 'Suggest stage with AI'}
        </Button>
      </div>

      {suggested ? (
        <div className="border-border flex flex-col gap-3 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">AI suggestion</p>
            {confidence ? (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${CONFIDENCE_STYLE[confidence]}`}
              >
                {confidence} confidence
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stageChoice">Move to stage</Label>
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger id="stageChoice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_STAGE}>+ Create new stage…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {choice === NEW_STAGE ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newStageLabel">New stage name</Label>
              <Input
                id="newStageLabel"
                value={newStageLabel}
                onChange={(e) => setNewStageLabel(e.target.value)}
                placeholder="Technical Test"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="statusNote">Timeline note</Label>
            <Input
              id="statusNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened"
            />
          </div>

          <div className="border-border flex flex-col gap-3 rounded-md border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="accent-primary size-4"
                checked={hasEvent}
                onChange={(e) => setHasEvent(e.target.checked)}
              />
              Add a scheduled event
            </label>

            {hasEvent ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="eventTitle">Event</Label>
                  <Input
                    id="eventTitle"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Technical interview"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="eventType">Type</Label>
                    <Select
                      value={eventType}
                      onValueChange={(v) => setEventType(v as ScheduledEventType)}
                    >
                      <SelectTrigger id="eventType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULED_EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {SCHEDULED_EVENT_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="eventAt">When</Label>
                    <Input
                      id="eventAt"
                      type="datetime-local"
                      value={eventAt}
                      onChange={(e) => setEventAt(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Updating…' : 'Update status'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
