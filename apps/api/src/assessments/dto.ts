import { z } from 'zod';

export const difficultyEnum = z.enum(['JUNIOR', 'MID', 'SENIOR']);

/** Client starts a test for one of their profile skills. */
export const createAssessmentSchema = z.object({
  skill: z.string().min(1, 'Pick a skill to test'),
});
export type CreateAssessmentDto = z.infer<typeof createAssessmentSchema>;

/**
 * Shape Groq must return for generated questions. Tolerant where safe:
 * difficulty degrades to MID, but options/correctIndex are validated strictly
 * (a malformed question would corrupt grading, so the whole batch is rejected
 * and retried rather than silently patched).
 */
export const generatedQuestionSchema = z.object({
  difficulty: difficultyEnum.catch('MID').default('MID'),
  subtopic: z.string().nullable().default(null),
  scenario: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const questionGenerationSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});
export type QuestionGeneration = z.infer<typeof questionGenerationSchema>;

/** Shape Groq must return for the end-of-test debrief. */
export const debriefSchema = z.object({
  summary: z.string().nullable().catch(null).default(null),
  strengths: z.array(z.string()).catch([]).default([]),
  focusAreas: z.array(z.string()).catch([]).default([]),
});
export type Debrief = z.infer<typeof debriefSchema>;

/** Client submits all chosen answers at once (exam mode). */
export const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(1, 'Answer at least one question'),
});
export type SubmitAssessmentDto = z.infer<typeof submitAssessmentSchema>;
