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
  notes: string | null;
};

/** One entry in an application's status timeline (StatusEvent + its stage). */
export type StatusEvent = {
  id: string;
  statusId: string;
  note: string | null;
  occurredAt: string;
  status: StatusStage;
};

/** GET /applications/:id response — the full application + current stage + timeline. */
export type ApplicationDetail = Application & {
  rawText: string;
  status: StatusStage;
  statusHistory: StatusEvent[];
};

export type StatusConfidence = 'high' | 'medium' | 'low';

/** POST /applications/:id/status/extract response — the AI's suggested stage move. */
export type StatusSuggestion = {
  stageId: string | null;
  newStageLabel: string | null;
  note: string | null;
  confidence: StatusConfidence;
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
