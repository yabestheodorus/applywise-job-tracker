import { z } from 'zod';

export const interviewCategoryEnum = z.enum([
  'BEHAVIORAL',
  'TECHNICAL',
  'ROLE_FIT',
  'COMPANY',
  'GAP',
  'LOGISTICS',
]);

// --- AI output schemas (validated inside GroqService.extractJson) ---

/** Shape of the question-generation model output. */
export const questionGenerationSchema = z.object({
  questions: z
    .array(
      z.object({
        category: interviewCategoryEnum.catch('BEHAVIORAL'),
        question: z.string().min(1),
        rationale: z.string().nullish(),
        talkingPoints: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});

/** Shape of the per-answer coaching model output. */
export const coachSchema = z.object({
  score: z.number().int().min(1).max(5),
  feedback: z.string().min(1),
  improvedAnswer: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
});

// --- Request DTOs ---

/** Generate a session for an application. Optional question count. */
export const generateSessionSchema = z.object({
  count: z.number().int().min(4).max(16).optional(),
});
export type GenerateSessionDto = z.infer<typeof generateSessionSchema>;

/** Submit the user's attempt for AI coaching. */
export const coachQuestionSchema = z.object({
  userAnswer: z.string().min(1, 'Write an answer first'),
});
export type CoachQuestionDto = z.infer<typeof coachQuestionSchema>;

/** Edit a question's answer, self-rating, or practice status (drill loop). */
export const updateQuestionSchema = z
  .object({
    userAnswer: z.string().optional(),
    improvedAnswer: z.string().optional(),
    selfRating: z.number().int().min(1).max(5).optional(),
    practiceStatus: z.enum(['NOT_STARTED', 'ANSWERED', 'REVIEWED']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;

/** Save a question's polished answer into the Template library. */
export const saveTemplateSchema = z.object({
  answer: z.string().optional(), // override; defaults to the stored improvedAnswer
  topic: z.string().optional(), // defaults to the question's category
});
export type SaveTemplateDto = z.infer<typeof saveTemplateSchema>;

/** One turn of the live mock interview. Client holds the running transcript. */
export const mockTurnSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .max(40)
    .default([]),
});
export type MockTurnDto = z.infer<typeof mockTurnSchema>;
