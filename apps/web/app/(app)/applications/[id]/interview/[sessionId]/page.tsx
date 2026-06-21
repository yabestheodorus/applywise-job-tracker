import { notFound } from 'next/navigation';

import { InterviewWorkspace } from '@/components/interview/interview-workspace';
import { apiFetch, ApiError } from '@/lib/api/server';
import type { InterviewSession } from '@/lib/types';

export const metadata = { title: 'Interview prep · ApplyWise' };

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  let session: InterviewSession;
  try {
    session = await apiFetch<InterviewSession>(`/interview/sessions/${sessionId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <InterviewWorkspace applicationId={id} session={session} />
    </div>
  );
}
