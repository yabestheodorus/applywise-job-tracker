'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch, ApiError } from '@/lib/api/server';
import type { Assessment } from '@/lib/types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const errorOf = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

/** Start a new scenario-MCQ test for a profile skill. */
export async function startAssessment(
  skill: string,
): Promise<ActionResult<Assessment>> {
  try {
    const assessment = await apiFetch<Assessment>('/assessments', {
      method: 'POST',
      body: JSON.stringify({ skill }),
    });
    revalidatePath('/skills');
    return { ok: true, data: assessment };
  } catch (e) {
    return {
      ok: false,
      error: errorOf(e, 'Could not generate the test. Please try again.'),
    };
  }
}

/** Submit all answers → graded results + debrief. */
export async function submitAssessment(
  id: string,
  answers: { questionId: string; selectedIndex: number }[],
): Promise<ActionResult<Assessment>> {
  try {
    const result = await apiFetch<Assessment>(`/assessments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    revalidatePath('/skills');
    revalidatePath(`/skills/${id}`);
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: errorOf(e, 'Could not submit the test. Please try again.'),
    };
  }
}
