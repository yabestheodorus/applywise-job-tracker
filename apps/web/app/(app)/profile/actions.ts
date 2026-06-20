'use server';

import { revalidatePath } from 'next/cache';
import type { UpdateProfileInput } from '@repo/api';

import { apiFetch, ApiError } from '@/lib/api/server';
import type { ProfileResponse } from '@/lib/types';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const errorOf = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

/** Upload a CV (pdf/docx) → API parses + Groq extracts → returns a review draft. */
export async function uploadCv(
  formData: FormData,
): Promise<ActionResult<UpdateProfileInput>> {
  try {
    const draft = await apiFetch<UpdateProfileInput>('/profile/cv', {
      method: 'POST',
      body: formData,
    });
    return { ok: true, data: draft };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not read that CV. Please try again.') };
  }
}

/** Persist the reviewed profile (replaces experience/education rows). */
export async function saveProfile(
  input: UpdateProfileInput,
): Promise<ActionResult<ProfileResponse>> {
  try {
    const saved = await apiFetch<ProfileResponse>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    revalidatePath('/profile');
    return { ok: true, data: saved };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not save your profile. Please try again.') };
  }
}
