import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { AssessmentResults } from '@/components/assessment/assessment-results';
import { AssessmentRunner } from '@/components/assessment/assessment-runner';
import { apiFetch, ApiError } from '@/lib/api/server';
import type { Assessment } from '@/lib/types';

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let assessment: Assessment;
  try {
    assessment = await apiFetch<Assessment>(`/assessments/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/skills"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Skills assessment
      </Link>

      <h1 className="font-heading mb-1 text-2xl leading-tight">
        {assessment.status === 'COMPLETED' ? 'Results' : assessment.skill}
        {assessment.status !== 'COMPLETED' ? ' assessment' : ''}
      </h1>
      {assessment.status !== 'COMPLETED' ? (
        <p className="text-muted-foreground mb-6 text-sm">
          {assessment.questionCount} real-world questions · pick the single best
          answer for each.
        </p>
      ) : (
        <div className="mb-6" />
      )}

      {assessment.status === 'COMPLETED' ? (
        <AssessmentResults assessment={assessment} />
      ) : (
        <AssessmentRunner assessment={assessment} />
      )}
    </div>
  );
}
