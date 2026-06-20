// Shared, framework-agnostic API contracts consumed by both apps/api and
// apps/web. Keep this free of NestJS imports so the web bundle stays clean.
export {
  profileLinksSchema,
  workExperienceSchema,
  educationSchema,
  updateProfileSchema,
  cvExtractedDraftSchema,
  type ProfileLinks,
  type WorkExperienceInput,
  type EducationInput,
  type UpdateProfileInput,
  type CvExtractedDraft,
} from './profile/profile.schema';
