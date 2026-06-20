import { z } from 'zod';

export const sourceEnum = z.enum([
  'WHATSAPP',
  'EMAIL',
  'LINKEDIN',
  'GLINTS',
  'JOBSTREET',
  'DIRECT',
  'OTHER',
]);

export const workArrangementEnum = z.enum(['REMOTE', 'HYBRID', 'ONSITE']);
export const employmentTypeEnum = z.enum([
  'FULLTIME',
  'PARTTIME',
  'CONTRACT',
  'INTERNSHIP',
]);

export const extractApplicationSchema = z.object({
  rawText: z.string().min(1, 'Paste the job text first'),
});
export type ExtractApplicationDto = z.infer<typeof extractApplicationSchema>;

/**
 * Shape Groq must return for a new-application draft (also the response sent
 * back to the client for review). Tolerant of nulls — never invent data.
 * The two enum fields use `.catch(null)` so an unexpected label from the model
 * degrades to null instead of failing the whole extraction.
 */
export const extractedDraftSchema = z.object({
  company: z.string().nullable().default(null),
  role: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  workArrangement: workArrangementEnum.nullable().catch(null).default(null),
  employmentType: employmentTypeEnum.nullable().catch(null).default(null),
  seniority: z.string().nullable().default(null),
  industry: z.string().nullable().default(null),
  jobUrl: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  requirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  matchedSkills: z.array(z.string()).default([]),
  gapSkills: z.array(z.string()).default([]),
  salaryMin: z.number().nullable().default(null),
  salaryMax: z.number().nullable().default(null),
  deadline: z.string().nullable().default(null),
});
export type ExtractedDraft = z.infer<typeof extractedDraftSchema>;


export const scheduledEventTypeEnum = z.enum([
  'INTERVIEW',
  'ASSESSMENT',
  'DEADLINE',
  'FOLLOWUP',
  'OTHER',
]);

/** A time-flagged event: AI-suggested in the status flow, or user-entered. */
export const scheduledEventInputSchema = z.object({
  title: z.string().min(1, 'Event needs a title'),
  type: scheduledEventTypeEnum.catch('OTHER').default('OTHER'),
  scheduledAt: z.string().min(1), // ISO date-time ("YYYY-MM-DDTHH:mm" or full ISO)
  note: z.string().nullable().optional(),
});
export type ScheduledEventInputDto = z.infer<typeof scheduledEventInputSchema>;

/** Flow B step 1: client posts the raw status-update message to interpret. */
export const extractStatusSchema = z.object({
  message: z.string().min(1, 'Paste the status update first'),
});
export type ExtractStatusDto = z.infer<typeof extractStatusSchema>;

/**
 * Shape Groq returns for a status-update suggestion (also the review payload
 * sent to the client). Exactly one of `stageId` / `newStageLabel` is set;
 * `event` is present only when the message schedules a concrete date/time.
 */
export const statusSuggestionSchema = z.object({
  stageId: z.string().nullable().default(null),
  newStageLabel: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium').default('medium'),
  event: scheduledEventInputSchema
    .nullable()
    .catch(null)
    .default(null),
});
export type StatusSuggestion = z.infer<typeof statusSuggestionSchema>;

/**
 * Flow B step 3: confirmed status change. The user either picks an existing
 * stage (`statusId`) or creates one on the fly (`newStageLabel`); optional note.
 */
export const updateStatusSchema = z
  .object({
    statusId: z.string().optional(),
    newStageLabel: z.string().min(1).optional(),
    note: z.string().nullable().optional(),
    event: scheduledEventInputSchema.nullable().optional(),
  })
  .refine((v) => Boolean(v.statusId) !== Boolean(v.newStageLabel), {
    message: 'Provide exactly one of statusId or newStageLabel',
  });
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;

export const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  source: sourceEnum.default('OTHER'),
  rawText: z.string().default(''),
  statusId: z.string().optional(),
  location: z.string().nullable().optional(),
  workArrangement: workArrangementEnum.nullable().optional(),
  employmentType: employmentTypeEnum.nullable().optional(),
  seniority: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  jobUrl: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  requirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  matchedSkills: z.array(z.string()).default([]),
  gapSkills: z.array(z.string()).default([]),
  salaryExpected: z.number().int().positive().nullable().optional(),
  deadlineDate: z.string().optional(), // ISO date (YYYY-MM-DD) or datetime
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
