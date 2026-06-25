import Link from 'next/link';
import { GraduationCap, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { ProficiencyBadge } from '@/components/assessment/proficiency-badge';
import { SkillTestCard } from '@/components/assessment/skill-test-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/server';
import type { AssessmentSummary, ProfileResponse } from '@/lib/types';

export const metadata = { title: 'Skills · ApplyWise' };

export default async function SkillsPage() {
  const [profile, history] = await Promise.all([
    apiFetch<ProfileResponse>('/profile'),
    apiFetch<AssessmentSummary[]>('/assessments'),
  ]);

  // Latest assessment per skill (history is newest-first from the API).
  const latestBySkill = new Map<string, AssessmentSummary>();
  for (const a of history) {
    if (!latestBySkill.has(a.skill.toLowerCase())) {
      latestBySkill.set(a.skill.toLowerCase(), a);
    }
  }

  const skills = profile.skills ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader
        icon={GraduationCap}
        title="Skills assessment"
        description="Prove the skills on your profile with short, real-world tests — and see exactly what to sharpen before interviews."
        className="mb-6"
      />

      {skills.length === 0 ? (
        <div className="bg-card text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <Sparkles className="size-8" />
          <div>
            <p className="text-foreground font-medium">No skills to test yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm">
              Add skills to your profile (or upload your CV) and they’ll show up
              here, ready to assess.
            </p>
          </div>
          <Button asChild className="mt-1">
            <Link href="/profile">Go to profile</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillTestCard
              key={skill}
              skill={skill}
              latest={latestBySkill.get(skill.toLowerCase())}
            />
          ))}
        </div>
      )}

      {history.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-heading text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Recent tests
          </h2>
          <div className="bg-card divide-y overflow-hidden rounded-2xl border ring-1 ring-foreground/5">
            {history.slice(0, 10).map((a) => (
              <Link
                key={a.id}
                href={`/skills/${a.id}`}
                className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors"
              >
                <span className="min-w-0 truncate font-medium">{a.skill}</span>
                <div className="flex shrink-0 items-center gap-3">
                  {a.status === 'COMPLETED' ? (
                    <>
                      <span className="text-muted-foreground tabular-nums">
                        {a.scorePct}%
                      </span>
                      <ProficiencyBadge level={a.level} />
                    </>
                  ) : (
                    <span className="text-primary text-xs font-medium">
                      In progress
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {new Date(a.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
