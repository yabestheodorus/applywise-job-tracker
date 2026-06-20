import { z } from 'zod';

/**
 * Shared profile contracts (@repo/api). One source of truth consumed by:
 *  - apps/api  — `ZodValidationPipe` on `PATCH /profile`, and Groq output
 *    validation for `POST /profile/cv`.
 *  - apps/web  — TanStack Form validators (Zod is a Standard Schema) + the
 *    server-action payload type.
 *
 * The schema is deliberately tolerant: optional strings are `nullish` and array
 * fields coerce null/undefined → []. That lets the SAME schema validate both a
 * user-submitted form and a messy AI draft without a second, looser copy.
 */

/** string | null | undefined — for free-text fields a CV may omit. */
const optionalString = z.string().nullish();

/** Tolerates null/undefined/missing → []. */
const stringArray = z
  .array(z.string())
  .nullish()
  .transform((v) => v ?? []);

export const profileLinksSchema = z.object({
  linkedin: optionalString,
  github: optionalString,
  portfolio: optionalString,
  website: optionalString,
});
export type ProfileLinks = z.infer<typeof profileLinksSchema>;

export const workExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Title is required'),
  location: optionalString,
  startDate: optionalString, // free-text — CVs format dates inconsistently
  endDate: optionalString,
  isCurrent: z.boolean().nullish().transform((v) => v ?? false),
  description: optionalString,
  skillsUsed: stringArray,
});
export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: optionalString,
  fieldOfStudy: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  description: optionalString,
});
export type EducationInput = z.infer<typeof educationSchema>;

export const updateProfileSchema = z.object({
  fullName: optionalString,
  headline: optionalString,
  email: optionalString, // intentionally not z.string().email() — CVs vary
  phone: optionalString,
  location: optionalString,
  summary: optionalString,
  links: profileLinksSchema.nullish().transform((v) => v ?? null),
  skills: stringArray,
  yearsExperience: z.number().int().nonnegative().nullish(),
  certifications: stringArray,
  languages: stringArray,
  experiences: z
    .array(workExperienceSchema)
    .nullish()
    .transform((v) => v ?? []),
  education: z
    .array(educationSchema)
    .nullish()
    .transform((v) => v ?? []),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Shape Groq must return for CV extraction. Identical to the update body — the
 * extracted draft IS a profile draft the user reviews, edits, then submits.
 */
export const cvExtractedDraftSchema = updateProfileSchema;
export type CvExtractedDraft = UpdateProfileInput;
