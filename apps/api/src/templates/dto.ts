import { z } from 'zod';

/** Step 1: user pastes a filled-in application form to mine for Q&A pairs. */
export const extractTemplatesSchema = z.object({
  rawText: z.string().min(1, 'Paste a filled application form first'),
});
export type ExtractTemplatesDto = z.infer<typeof extractTemplatesSchema>;

/**
 * AI output (also the review payload): one item per Q&A pair found.
 * `matchedId` = an existing template this answers the same topic as (→ update),
 * else null (→ new). Validated against the user's real ids before review.
 */
export const templateDraftSchema = z.object({
  matchedId: z.string().nullable().catch(null).default(null),
  topic: z.string().catch('Others').default('Others'),
  question: z.string(),
  answer: z.string(),
});
export const templateExtractionSchema = z.object({
  items: z.array(templateDraftSchema).default([]),
});
export type TemplateExtraction = z.infer<typeof templateExtractionSchema>;

/** Step 3: persist the reviewed drafts. id present → update; absent → create. */
export const applyTemplatesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        topic: z.string().trim().min(1).default('Others'),
        question: z.string().min(1, 'Question is required'),
        answer: z.string().min(1, 'Answer is required'),
      }),
    )
    .min(1, 'Nothing to save'),
});
export type ApplyTemplatesDto = z.infer<typeof applyTemplatesSchema>;

/** Manual single create. */
export const createTemplateSchema = z.object({
  topic: z.string().trim().min(1).default('Others'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});
export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;

/** Manual single edit. */
export const updateTemplateSchema = z
  .object({
    topic: z.string().trim().min(1).optional(),
    question: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
