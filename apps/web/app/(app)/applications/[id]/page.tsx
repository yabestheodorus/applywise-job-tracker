import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  ExternalLink,
  MapPin,
} from 'lucide-react';

import { StatusBadge } from '@/components/board/status-badge';
import { SourceIcon } from '@/components/board/source-icon';
import { ApplicationEvents } from '@/components/application/application-events';
import { StatusTimeline } from '@/components/application/status-timeline';
import { StatusUpdatePanel } from '@/components/application/status-update-panel';
import { InterviewPrepCard } from '@/components/interview/interview-prep-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api/server';
import {
  formatIDR,
  relativeDays,
  type ApplicationDetail,
  type EmploymentType,
  type InterviewSession,
  type StatusStage,
  type WorkArrangement,
} from '@/lib/types';

const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULLTIME: 'Full-time',
  PARTTIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let application: ApplicationDetail;
  let stages: StatusStage[];
  let interviewSessions: InterviewSession[];
  try {
    [application, stages, interviewSessions] = await Promise.all([
      apiFetch<ApplicationDetail>(`/applications/${id}`),
      apiFetch<StatusStage[]>('/stages'),
      apiFetch<InterviewSession[]>(`/applications/${id}/interview/sessions`),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const metaBits: { Icon: typeof MapPin; text: string }[] = [];
  if (application.location)
    metaBits.push({ Icon: MapPin, text: application.location });
  if (application.workArrangement)
    metaBits.push({
      Icon: Building2,
      text: WORK_ARRANGEMENT_LABELS[application.workArrangement],
    });
  if (application.employmentType)
    metaBits.push({
      Icon: Briefcase,
      text: EMPLOYMENT_TYPE_LABELS[application.employmentType],
    });
  if (application.seniority)
    metaBits.push({ Icon: Briefcase, text: application.seniority });

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <Link
        href="/board"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to board
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl leading-tight">
              {application.company}
            </h1>
            <p className="text-muted-foreground">{application.role}</p>
          </div>
          <StatusBadge stage={application.status} />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <SourceIcon source={application.source} />
          {metaBits.map((bit, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <bit.Icon className="size-3.5" />
              {bit.text}
            </span>
          ))}
          {application.salaryExpected ? (
            <span className="text-foreground/80 font-medium tabular-nums">
              {formatIDR(application.salaryExpected)}
            </span>
          ) : null}
          {application.jobUrl ? (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              View posting
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </div>

        {(application.deadlineDate || application.followUpDate) && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            {application.deadlineDate ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-3.5" />
                Deadline {relativeDays(application.deadlineDate)}
              </span>
            ) : null}
            {application.followUpDate ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-3.5" />
                Follow up {relativeDays(application.followUpDate)}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {application.summary ? (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {application.summary}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Skill match</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <SkillRow
                label="Matched skills"
                tone="emerald"
                skills={application.matchedSkills}
                empty="No matched skills yet — add your profile to compute these."
              />
              <SkillRow
                label="Gap skills"
                tone="red"
                skills={application.gapSkills}
                empty="No gaps detected yet."
              />
              <SkillRow
                label="Required skills"
                tone="muted"
                skills={application.skills}
                empty="No skills extracted."
              />
            </CardContent>
          </Card>

          {application.requirements.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
                  {application.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Aside: interview prep + status flow + timeline */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview prep</CardTitle>
            </CardHeader>
            <CardContent>
              <InterviewPrepCard
                applicationId={application.id}
                sessions={interviewSessions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusUpdatePanel
                applicationId={application.id}
                stages={stages}
                currentStageId={application.statusId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled events</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationEvents
                applicationId={application.id}
                events={application.scheduledEvents}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline events={application.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SkillRow({
  label,
  tone,
  skills,
  empty,
}: {
  label: string;
  tone: 'emerald' | 'red' | 'muted';
  skills: string[];
  empty: string;
}) {
  const chip =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : tone === 'red'
        ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
        : 'bg-muted text-muted-foreground';
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">{label}</p>
      {skills.length ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${chip}`}
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">{empty}</p>
      )}
    </div>
  );
}
