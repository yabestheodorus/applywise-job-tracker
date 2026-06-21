'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch, ApiError } from '@/lib/api/server';
import type {
  InterviewQuestion,
  InterviewSession,
  MockMessage,
  Template,
} from '@/lib/types';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const errorOf = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

/** Generate a tailored interview-prep session for an application. */
export async function generateInterviewSession(
  applicationId: string,
  count?: number,
): Promise<ActionResult<InterviewSession>> {
  try {
    const session = await apiFetch<InterviewSession>(
      `/applications/${applicationId}/interview/sessions`,
      { method: 'POST', body: JSON.stringify(count ? { count } : {}) },
    );
    revalidatePath(`/applications/${applicationId}`);
    return { ok: true, data: session };
  } catch (e) {
    return {
      ok: false,
      error: errorOf(e, 'Could not generate a session. Please try again.'),
    };
  }
}

/** Submit the user's attempt and get AI coaching back (returns the updated question). */
export async function coachInterviewAnswer(
  questionId: string,
  userAnswer: string,
): Promise<ActionResult<InterviewQuestion>> {
  try {
    const updated = await apiFetch<InterviewQuestion>(
      `/interview/questions/${questionId}/coach`,
      { method: 'POST', body: JSON.stringify({ userAnswer }) },
    );
    return { ok: true, data: updated };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Coaching failed. Please try again.') };
  }
}

export type UpdateInterviewQuestionInput = {
  userAnswer?: string;
  improvedAnswer?: string;
  selfRating?: number;
  practiceStatus?: 'NOT_STARTED' | 'ANSWERED' | 'REVIEWED';
};

/** Edit an answer, record a self-rating, or update practice status (drill loop). */
export async function updateInterviewQuestion(
  questionId: string,
  input: UpdateInterviewQuestionInput,
): Promise<ActionResult<InterviewQuestion>> {
  try {
    const updated = await apiFetch<InterviewQuestion>(
      `/interview/questions/${questionId}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return { ok: true, data: updated };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not save. Please try again.') };
  }
}

/** Save a question's polished answer into the Template library. */
export async function saveInterviewTemplate(
  questionId: string,
  input?: { answer?: string; topic?: string },
): Promise<ActionResult<Template>> {
  try {
    const template = await apiFetch<Template>(
      `/interview/questions/${questionId}/save-template`,
      { method: 'POST', body: JSON.stringify(input ?? {}) },
    );
    revalidatePath('/templates');
    return { ok: true, data: template };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'Could not save to library. Please try again.') };
  }
}

/** One turn of the live mock interview — the client holds the running transcript. */
export async function mockInterviewTurn(
  sessionId: string,
  messages: MockMessage[],
): Promise<ActionResult<{ reply: string }>> {
  try {
    const data = await apiFetch<{ reply: string }>(
      `/interview/sessions/${sessionId}/mock`,
      { method: 'POST', body: JSON.stringify({ messages }) },
    );
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errorOf(e, 'The interviewer went quiet. Please try again.') };
  }
}
