'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch, ApiError } from '@/lib/api/server';
import type {
  ApplicationDetail,
  EmploymentType,
  ScheduledEventInput,
  Source,
  StatusSuggestion,
  WorkArrangement,
} from '@/lib/types';

export type ExtractedDraft = {
  company: string | null;
  role: string | null;
  location: string | null;
  workArrangement: WorkArrangement | null;
  employmentType: EmploymentType | null;
  seniority: string | null;
  industry: string | null;
  jobUrl: string | null;
  summary: string | null;
  requirements: string[];
  skills: string[];
  matchedSkills: string[],
  gapSkills: string[],
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const errorOf = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

/** Flow A step 2: ask the API (→ Groq) to extract a draft from pasted text. */
export async function extractApplication(
  rawText: string,
): Promise<ActionResult<ExtractedDraft>> {
  try {
    const draft = await apiFetch<ExtractedDraft>('/applications/extract', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    });
    return { ok: true, data: draft };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Extraction failed. Please try again.') };
  }
}

export type CreateApplicationInput = {
  company: string;
  role: string;
  source: Source;
  location?: string | null;
  workArrangement?: WorkArrangement | null;
  employmentType?: EmploymentType | null;
  seniority?: string | null;
  industry?: string | null;
  jobUrl?: string | null;
  summary?: string | null;
  requirements: string[];
  skills: string[];
  matchedSkills: string[],
  gapSkills: string[],
  salaryExpected?: number;
  deadlineDate?: string;
  rawText?: string;
};

/** Flow A step 3: persist the confirmed draft. Revalidates the board. */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const created = await apiFetch<{ id: string }>('/applications', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    revalidatePath('/board');
    return { ok: true, data: { id: created.id } };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not add application. Please try again.') };
  }
}

/** Delete an application (cascades its timeline/events/interview sessions). */
export async function deleteApplication(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await apiFetch<{ id: string }>(`/applications/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/board');
    revalidatePath('/upcoming');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not delete this application. Please try again.') };
  }
}

/** Recompute the AI job-match score. Revalidates board + detail. */
export async function recalculateMatch(
  id: string,
): Promise<ActionResult<{ matchScore: number | null; matchRationale: string | null; matchedSkills: string[]; gapSkills: string[] }>> {
  try {
    const updated = await apiFetch<{
      matchScore: number | null;
      matchRationale: string | null;
      matchedSkills: string[];
      gapSkills: string[];
    }>(`/applications/${id}/match`, { method: 'POST' });
    revalidatePath('/board');
    revalidatePath(`/applications/${id}`);
    return { ok: true, data: updated };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not score this match. Please try again.') };
  }
}

/** Generate a tailored cover-letter draft (plain text, not saved). */
export async function generateCoverLetter(
  id: string,
): Promise<ActionResult<{ coverLetter: string }>> {
  try {
    const data = await apiFetch<{ coverLetter: string }>(
      `/applications/${id}/cover-letter`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not generate a cover letter. Please try again.') };
  }
}

/** Flow B step 1: ask the API (→ Groq) which stage a status update maps to. */
export async function extractStatusUpdate(
  id: string,
  message: string,
): Promise<ActionResult<StatusSuggestion>> {
  try {
    const suggestion = await apiFetch<StatusSuggestion>(
      `/applications/${id}/status/extract`,
      { method: 'POST', body: JSON.stringify({ message }) },
    );
    return { ok: true, data: suggestion };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not read that update. Please try again.') };
  }
}

export type UpdateStatusInput = (
  | { statusId: string; note?: string | null }
  | { newStageLabel: string; note?: string | null }
) & { rawText?: string | null; event?: ScheduledEventInput | null };

/** Flow B step 3: apply the confirmed stage change. Revalidates board + detail. */
export async function updateApplicationStatus(
  id: string,
  input: UpdateStatusInput,
): Promise<ActionResult<ApplicationDetail>> {
  try {
    const updated = await apiFetch<ApplicationDetail>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    revalidatePath('/board');
    revalidatePath('/upcoming');
    revalidatePath(`/applications/${id}`);
    return { ok: true, data: updated };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not update status. Please try again.') };
  }
}
