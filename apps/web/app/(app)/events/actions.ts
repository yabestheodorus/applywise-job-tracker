'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch, ApiError } from '@/lib/api/server';
import type { ScheduledEvent, ScheduledEventInput } from '@/lib/types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const errorOf = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

function revalidateEventViews(applicationId?: string) {
  revalidatePath('/upcoming');
  revalidatePath('/board');
  if (applicationId) revalidatePath(`/applications/${applicationId}`);
}

/** Manually add a scheduled event to an application (no AI involved). */
export async function createEvent(
  applicationId: string,
  input: ScheduledEventInput,
): Promise<ActionResult<ScheduledEvent>> {
  try {
    const created = await apiFetch<ScheduledEvent>('/events', {
      method: 'POST',
      body: JSON.stringify({ applicationId, ...input }),
    });
    revalidateEventViews(applicationId);
    return { ok: true, data: created };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not add the event. Please try again.') };
  }
}

/** Mark an event done / not-done (toggles it off the Upcoming list). */
export async function setEventCompleted(
  id: string,
  completed: boolean,
): Promise<ActionResult<ScheduledEvent>> {
  try {
    const updated = await apiFetch<ScheduledEvent>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    revalidateEventViews(updated.applicationId);
    return { ok: true, data: updated };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not update the event. Please try again.') };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const res = await apiFetch<{ id: string }>(`/events/${id}`, { method: 'DELETE' });
    revalidateEventViews();
    return { ok: true, data: res };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not delete the event. Please try again.') };
  }
}
