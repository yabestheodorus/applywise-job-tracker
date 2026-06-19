# AI / Agents

## AI Extraction Prompt Strategy (apps/api — groq.service.ts)
- Use Groq's OpenAI-compatible chat completions endpoint (`https://api.groq.com/openai/v1/chat/completions`), model e.g. `llama-3.3-70b-versatile`
- **Two separate prompts** (matching the two flows above), each instructed to return ONLY valid JSON:
  - **New-application extraction** (`POST /applications/extract`): schema `{ company, role, requirements[], salaryMin, salaryMax, deadline }`. No new-vs-update detection — the user already chose "Add application".
  - **Status-update extraction** (`POST /applications/:id/status/extract`): the application is already known from the URL, so pass that application's current status + the user's full list of `StatusStage` labels (for this user) into the prompt context. Schema `{ suggestedStatusId, suggestedNewStageLabel, note, confidence }` — the model maps the message to an existing stage by id, or proposes a new stage label if nothing fits.
- All Groq context (existing stages, application data) is scoped to the authenticated user — never pass another tenant's data into the prompt.
- Validate every JSON response with a Zod schema before saving to DB
- If parsing fails, surface a clear error to the user rather than silently failing
- Groq is free tier but rate-limited — add basic retry/backoff handling, and a clear error message if rate limited

## CV Upload & Extraction (apps/api — cv.service.ts + groq.service.ts)
- **Upload**: accept `pdf` and `docx` only, enforce a max size (e.g. 5 MB), validate MIME type. Store the raw file in a **private** Supabase Storage bucket under a per-user path (`cv/{userId}/{filename}`); persist `cvFileUrl` (or just the path — serve via short-lived signed URLs), `cvFileName`, `cvUploadedAt`.
- **Text extraction**: parse the file to plain text server-side — `pdf-parse` (or `pdfjs-dist`) for PDF, `mammoth` for DOCX. Save the result to `cvRawText`. If the file has no extractable text (e.g. a scanned/image-only PDF), set `cvParseStatus=FAILED` with a clear message ("Couldn't read text from this CV — try a text-based PDF").
- **AI structuring**: send `cvRawText` to Groq with a system prompt that returns ONLY valid JSON matching a defined schema:
  `{ fullName, headline, email, phone, location, summary, links{linkedin,github,portfolio}, skills[], yearsExperience, certifications[], languages[], experiences[{company,title,location,startDate,endDate,isCurrent,description,skillsUsed[]}], education[{institution,degree,fieldOfStudy,startDate,endDate}] }`
- Validate the JSON with a **Zod schema** before returning. On parse failure, set `cvParseStatus=FAILED` and surface the error — never silently drop data.
- **Review-before-save**: extraction returns a DRAFT (not auto-persisted). The user reviews/edits in the profile form, then confirms — only then is the structured data written (merged into `UserProfile` + `WorkExperience`/`Education` rows). On confirm, set `cvParseStatus=COMPLETED`.
- **Merge strategy**: don't blindly overwrite existing manual edits. On the review screen, show extracted values as suggestions; let the user choose to replace or keep current data (skills are merged + de-duplicated case-insensitively).
- Long CVs may exceed the model context — truncate `cvRawText` to a sane char limit before the call, and reuse the same Groq retry/backoff + rate-limit handling as the application extraction path.

## Skill Matching Logic
- Simple version (good enough for MVP): Groq compares `requirements[]` array against `UserProfile.skills[]`, returns matchedSkills, gapSkills, and a short rationale string
- With a CV uploaded, enrich the prompt context with `yearsExperience` and the per-role `skillsUsed` so the rationale can reference actual experience ("3 yrs Next.js at Acme") instead of just a flat skill list
- This is a single Groq API call per application, not a complex ML pipeline — keep it simple and explainable
