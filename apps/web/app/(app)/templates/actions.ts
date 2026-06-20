'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch, ApiError } from '@/lib/api/server';
import type { Template, TemplateDraft } from '@/lib/types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const errorOf = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

/** Mine a pasted application form for Q&A drafts (deduped against existing). */
export async function extractTemplates(
  rawText: string,
): Promise<ActionResult<{ items: TemplateDraft[] }>> {
  try {
    const data = await apiFetch<{ items: TemplateDraft[] }>('/templates/extract', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    });
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not read that form. Please try again.') };
  }
}

type ApplyItem = { id?: string; topic: string; question: string; answer: string };

/** Save reviewed drafts: items with an id update, others are created. */
export async function applyTemplates(
  items: ApplyItem[],
): Promise<ActionResult<Template[]>> {
  try {
    const data = await apiFetch<Template[]>('/templates/apply', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    revalidatePath('/templates');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not save templates. Please try again.') };
  }
}

export async function createTemplate(
  topic: string,
  question: string,
  answer: string,
): Promise<ActionResult<Template>> {
  try {
    const data = await apiFetch<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify({ topic, question, answer }),
    });
    revalidatePath('/templates');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not add the template. Please try again.') };
  }
}

export async function updateTemplate(
  id: string,
  patch: { topic?: string; question?: string; answer?: string },
): Promise<ActionResult<Template>> {
  try {
    const data = await apiFetch<Template>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    revalidatePath('/templates');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not update the template. Please try again.') };
  }
}

export async function deleteTemplate(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await apiFetch<{ id: string }>(`/templates/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/templates');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not delete the template. Please try again.') };
  }
}
