// Web-side view types mirroring the API responses (DTO shapes from apps/api).
// Dates arrive as ISO strings over JSON.

export type Source =
  | 'WHATSAPP'
  | 'EMAIL'
  | 'LINKEDIN'
  | 'GLINTS'
  | 'JOBSTREET'
  | 'DIRECT'
  | 'OTHER';

export const SOURCES: Source[] = [
  'WHATSAPP',
  'EMAIL',
  'LINKEDIN',
  'GLINTS',
  'JOBSTREET',
  'DIRECT',
  'OTHER',
];

export type WorkArrangement = 'REMOTE' | 'HYBRID' | 'ONSITE';
export const WORK_ARRANGEMENTS: WorkArrangement[] = ['REMOTE', 'HYBRID', 'ONSITE'];

export type EmploymentType =
  | 'FULLTIME'
  | 'PARTTIME'
  | 'CONTRACT'
  | 'INTERNSHIP';
export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'FULLTIME',
  'PARTTIME',
  'CONTRACT',
  'INTERNSHIP',
];

export type StatusStage = {
  id: string;
  label: string;
  color: string;
  order: number;
  isTerminal: boolean;
};

export type Application = {
  id: string;
  company: string;
  role: string;
  source: Source;
  statusId: string;
  location: string | null;
  workArrangement: WorkArrangement | null;
  employmentType: EmploymentType | null;
  seniority: string | null;
  industry: string | null;
  jobUrl: string | null;
  summary: string | null;
  salaryExpected: number | null;
  appliedDate: string;
  followUpDate: string | null;
  deadlineDate: string | null;
  requirements: string[];
  skills: string[];
  matchedSkills: string[];
  gapSkills: string[];
  matchScore: number | null; // AI job-match 0–100 (null until computed)
  matchRationale: string | null;
  notes: string | null;
  // Latest timeline entry (most recent first, capped to 1 by the list endpoint).
  statusHistory?: { note: string | null; occurredAt: string }[];
};

/** Bucket a 0–100 match score into a colour band for the badge. */
export type MatchTier = 'strong' | 'partial' | 'weak';

export function matchTier(score: number): MatchTier {
  if (score >= 70) return 'strong';
  if (score >= 40) return 'partial';
  return 'weak';
}

/** One entry in an application's status timeline (StatusEvent + its stage). */
export type StatusEvent = {
  id: string;
  statusId: string;
  note: string | null;
  rawText: string | null; // the pasted update, cleaned + markdown-formatted by the LLM
  occurredAt: string;
  status: StatusStage;
};

export type ScheduledEventType =
  | 'INTERVIEW'
  | 'ASSESSMENT'
  | 'DEADLINE'
  | 'FOLLOWUP'
  | 'OTHER';

export const SCHEDULED_EVENT_TYPES: ScheduledEventType[] = [
  'INTERVIEW',
  'ASSESSMENT',
  'DEADLINE',
  'FOLLOWUP',
  'OTHER',
];

export const SCHEDULED_EVENT_TYPE_LABELS: Record<ScheduledEventType, string> = {
  INTERVIEW: 'Interview',
  ASSESSMENT: 'Assessment',
  DEADLINE: 'Deadline',
  FOLLOWUP: 'Follow-up',
  OTHER: 'Other',
};

/** A time-flagged event captured from a status update (or added manually). */
export type ScheduledEvent = {
  id: string;
  applicationId: string;
  title: string;
  type: ScheduledEventType;
  scheduledAt: string;
  note: string | null;
  completed: boolean;
};

/** The AI/user draft of an event before it's persisted. */
export type ScheduledEventInput = {
  title: string;
  type: ScheduledEventType;
  scheduledAt: string;
  note?: string | null;
};

/** GET /events row — an event plus enough of its application to render + link. */
export type UpcomingEvent = ScheduledEvent & {
  application: {
    id: string;
    company: string;
    role: string;
    status: Pick<StatusStage, 'id' | 'label' | 'color'>;
  };
};

/** GET /applications/:id response — the full application + current stage + timeline. */
export type ApplicationDetail = Application & {
  rawText: string;
  status: StatusStage;
  statusHistory: StatusEvent[];
  scheduledEvents: ScheduledEvent[];
};

export type StatusConfidence = 'high' | 'medium' | 'low';

/** POST /applications/:id/status/extract response — the AI's suggested stage move. */
export type StatusSuggestion = {
  stageId: string | null;
  newStageLabel: string | null;
  note: string | null;
  confidence: StatusConfidence;
  formattedMessage: string | null;
  event: ScheduledEventInput | null;
};

/** A reusable answer to a common application question (copy-to-clipboard). */
export type Template = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
};

/** AI draft from a pasted form: matchedId set → updates that template, else new. */
export type TemplateDraft = {
  matchedId: string | null;
  topic: string;
  question: string;
  answer: string;
};

// --- Interview Training Session ---

export type InterviewCategory =
  | 'BEHAVIORAL'
  | 'TECHNICAL'
  | 'ROLE_FIT'
  | 'COMPANY'
  | 'GAP'
  | 'LOGISTICS';

export const INTERVIEW_CATEGORY_LABELS: Record<InterviewCategory, string> = {
  BEHAVIORAL: 'Behavioral',
  TECHNICAL: 'Technical',
  ROLE_FIT: 'Role fit',
  COMPANY: 'Company',
  GAP: 'Skill gap',
  LOGISTICS: 'Logistics',
};

export type InterviewPracticeStatus = 'NOT_STARTED' | 'ANSWERED' | 'REVIEWED';
export type InterviewSessionStatus = 'GENERATING' | 'IN_PROGRESS' | 'COMPLETED';

export type InterviewQuestion = {
  id: string;
  sessionId: string;
  order: number;
  category: InterviewCategory;
  question: string;
  rationale: string | null;
  talkingPoints: string[];
  userAnswer: string | null;
  feedback: string | null;
  improvedAnswer: string | null;
  keyPoints: string[];
  score: number | null;
  selfRating: number | null;
  practiceStatus: InterviewPracticeStatus;
  savedTemplateId: string | null;
};

export type InterviewSession = {
  id: string;
  applicationId: string;
  status: InterviewSessionStatus;
  readinessScore: number | null;
  createdAt: string;
  updatedAt: string;
  questions: InterviewQuestion[];
  application: { id: string; company: string; role: string };
};

/** One turn of the live mock interview transcript. */
export type MockMessage = { role: 'user' | 'assistant'; content: string };

/** End-of-mock debrief returned by the AI. */
export type MockReview = {
  summary: string;
  strengths: string[];
  improvements: string[];
  score: number;
};

// --- Skills Assessment ---

export type AssessmentStatus = 'GENERATING' | 'IN_PROGRESS' | 'COMPLETED';
export type QuestionDifficulty = 'JUNIOR' | 'MID' | 'SENIOR';
export type ProficiencyLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
};

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

/** Tailwind classes per proficiency level for the badge (chip style). */
export const PROFICIENCY_TONE: Record<ProficiencyLevel, string> = {
  BEGINNER:
    'bg-stone-100 text-stone-600 ring-stone-500/20 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-400/20',
  INTERMEDIATE:
    'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-400/20',
  ADVANCED:
    'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-400/20',
  EXPERT:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/20',
};

/** One scenario-MCQ. Answer fields are null until the test is submitted. */
export type AssessmentQuestion = {
  id: string;
  order: number;
  difficulty: QuestionDifficulty;
  subtopic: string | null;
  scenario: string;
  prompt: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
  explanation: string | null;
  isCorrect: boolean | null;
};

/** Full assessment (GET /assessments/:id, POST /assessments, /submit). */
export type Assessment = {
  id: string;
  skill: string;
  status: AssessmentStatus;
  questionCount: number;
  correctCount: number | null;
  scorePct: number | null;
  level: ProficiencyLevel | null;
  summary: string | null;
  strengths: string[];
  focusAreas: string[];
  createdAt: string;
  completedAt: string | null;
  questions: AssessmentQuestion[];
};

/** History row (GET /assessments) — no questions. */
export type AssessmentSummary = {
  id: string;
  skill: string;
  status: AssessmentStatus;
  questionCount: number;
  correctCount: number | null;
  scorePct: number | null;
  level: ProficiencyLevel | null;
  createdAt: string;
  completedAt: string | null;
};

export type CvParseStatus = 'NONE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ProfileLinks = {
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  website?: string | null;
};

export type WorkExperienceRow = {
  id?: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  skillsUsed: string[];
};

export type EducationRow = {
  id?: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

/** GET /profile response (UserProfile + child rows + CV metadata). */
export type ProfileResponse = {
  id: string;
  fullName: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  links: ProfileLinks | null;
  skills: string[];
  yearsExperience: number | null;
  certifications: string[];
  languages: string[];
  experiences: WorkExperienceRow[];
  education: EducationRow[];
  cvFileName: string | null;
  cvUploadedAt: string | null;
  cvParseStatus: CvParseStatus;
};

export type TerminalKind = 'offer' | 'rejected' | 'ghosted';

/** Default terminal stages carry meaning we can infer from the label for icons. */
export function terminalKindOf(stage: StatusStage): TerminalKind | null {
  if (!stage.isTerminal) return null;
  const label = stage.label.toLowerCase();
  if (label.includes('offer')) return 'offer';
  if (label.includes('reject')) return 'rejected';
  if (label.includes('ghost')) return 'ghosted';
  return 'offer'; // generic terminal → check icon
}

export type Urgency = 'overdue' | 'soon' | 'normal';

const DAY = 1000 * 60 * 60 * 24;

export function urgencyOf(dateISO: string): Urgency {
  const days = Math.round((new Date(dateISO).getTime() - Date.now()) / DAY);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'soon';
  return 'normal';
}

export function relativeDays(dateISO: string): string {
  const days = Math.round((new Date(dateISO).getTime() - Date.now()) / DAY);
  if (days === 0) return 'today';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `in ${days}d`;
}

export function formatIDR(n: number): string {
  return `Rp ${(n / 1_000_000).toLocaleString('id-ID')}jt`;
}

/** Absolute date + time for a scheduled event, e.g. "25 Jun 2026, 14:00". */
export function formatEventWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Relative wording for an event time. Under a day → hours (floored at 1h, no
 * minutes), e.g. "in 5h"; a day or more → whole days, e.g. "in 3d". Past →
 * "Xh overdue" / "Xd overdue".
 */
export function relativeWhen(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const past = ms < 0;
  const hours = Math.round(Math.abs(ms) / (1000 * 60 * 60));
  const body = hours < 24 ? `${Math.max(hours, 1)}h` : `${Math.round(hours / 24)}d`;
  return past ? `${body} overdue` : `in ${body}`;
}
