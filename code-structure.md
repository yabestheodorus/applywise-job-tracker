# Code Structure

## Monorepo Structure (Turborepo)

Scaffolded from `create-turbo@latest --example with-nestjs`. Actual current layout:

```
applywise-job-tracker/
├── apps/
│   ├── web/                 # Next.js 15 (App Router) frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── api/                 # shared NestJS DTOs/types library (@repo/api) — currently holds the
│   │                        #   example "links" module; will host our shared API contracts
│   ├── ui/                  # shared React component library (@repo/ui)
│   ├── eslint-config/       # shared ESLint config (@repo/eslint-config)
│   ├── jest-config/         # shared Jest config (@repo/jest-config)
│   └── typescript-config/   # shared tsconfig presets (@repo/typescript-config: base/nestjs/nextjs/react-library)
├── turbo.json
├── package.json             # npm workspaces: apps/*, packages/*
└── README.md
```

**Planned additions (not yet scaffolded):**
- `packages/database/` — Prisma schema + generated client, shared by `apps/api` (and any server code). See [db-schema.md](../db-schema.md).
- The example `links` demo (`packages/api/src/links`, `apps/api/src/links`, `apps/web` home page fetch) will be removed/replaced as we build real modules.

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: NestJS, TypeScript
- Auth: **Supabase Auth** (multi-tenant). Web uses `@supabase/ssr` for session/cookie handling; API verifies the Supabase JWT via a NestJS auth guard. Every row is scoped to the authenticated `userId`.
- Database: PostgreSQL (Supabase)
- ORM: Prisma (shared package between apps)
- AI: Groq API (free tier, fast inference) — for text extraction and skill matching, using a model like llama-3.3-70b-versatile or similar
- Deployment: Vercel (web), Railway or Render (api)

## API Endpoints (NestJS — apps/api)

**Auth:** every route below (except the health check) is protected by a `SupabaseAuthGuard` — it reads the `Authorization: Bearer <jwt>` header, verifies the token against Supabase's JWKS/secret, and attaches `req.user.id`. All handlers scope their Prisma queries to that `userId`; accessing another user's row returns `404` (not `403`, to avoid leaking existence). No login/logout routes live here — sign-in/up/session refresh are handled client-side by Supabase Auth; the web app just forwards the access token.

```
POST   /applications/extract     # body: { rawText, source } → Groq extracts a NEW-application draft
                                 #   (company, role, requirements, salary, deadline). Used only by the
                                 #   "Add application" form. Does NOT decide new-vs-update.
POST   /applications             # create application (from confirmed draft)
GET    /applications             # list current user's applications, ?statusId= filter
GET    /applications/:id         # get one, includes statusHistory
PATCH  /applications/:id         # update notes, dates, salary etc (not status — use dedicated endpoint below)
DELETE /applications/:id

POST   /applications/:id/status/extract  # body: { rawText } → Groq reads a status-update message in the
                                         #   context of THIS application and suggests a target StatusStage
                                         #   (existing) or a new custom stage, + an optional note. Returns a
                                         #   draft only — no DB write. Powers the textarea in the detail view.
PATCH  /applications/:id/status  # body: { statusId, note? } → updates current status AND appends a StatusEvent
GET    /applications/:id/timeline # returns full statusHistory ordered by occurredAt, for the "Tracking Status" UI

POST   /applications/:id/match-skills   # AI compares requirements vs UserProfile.skills

GET    /stages                   # list all StatusStage (for Kanban columns / dropdown)
POST   /stages                   # create custom stage (label, color, order)
PATCH  /stages/:id               # rename/reorder/recolor a stage
DELETE /stages/:id               # delete a stage (only if no applications reference it, or reassign first)

GET    /profile                  # get current user's profile — includes experiences + education
PATCH  /profile                  # update any profile field: identity, skills, summary, links, certifications, etc.

POST   /profile/cv               # multipart upload (pdf/docx). Stores file to Supabase Storage,
                                 #   extracts text, sets cvParseStatus=PROCESSING, kicks off AI extraction.
                                 #   Returns the profile with cvParseStatus so the UI can poll/show progress.
GET    /profile/cv/status        # poll extraction status (NONE|PROCESSING|COMPLETED|FAILED)
POST   /profile/cv/extract       # (re-)run AI extraction against the stored cvRawText →
                                 #   returns a DRAFT structured profile (not yet saved) for user review
DELETE /profile/cv               # remove the stored CV file + cvRawText (keeps extracted profile data)

# Experiences / education are managed as nested resources once extracted:
POST   /profile/experiences      # add a work experience row
PATCH  /profile/experiences/:id  # edit one
DELETE /profile/experiences/:id  # remove one
POST   /profile/education        # add an education row
PATCH  /profile/education/:id    # edit one
DELETE /profile/education/:id    # remove one

GET    /templates                # list template answers
POST   /templates                # add template answer
```

## Code Quality Expectations
- TypeScript strict mode on both frontend and backend
- Shared types package to avoid duplicating interfaces between web and api
- Environment variables for Groq API key, database URL, and Supabase config — never hardcoded, .env.example provided.
  - web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - api: `SUPABASE_URL`, `SUPABASE_JWT_SECRET` (or JWKS URL) for verifying tokens in the guard, `SUPABASE_SERVICE_ROLE_KEY` for Storage uploads, `DATABASE_URL`, `GROQ_API_KEY`
- Basic error handling on all API routes (try/catch, proper HTTP status codes, Groq rate-limit handling)
- `401` on missing/invalid token, `404` on cross-tenant access; the auth guard is applied globally and routes opt out only where intentionally public
- Zod validation PIPE on API inputs

## Deployment Notes
- apps/web → Vercel (connect repo, set root directory to apps/web)
- apps/api → Railway or Render (connect repo, set root directory to apps/api, add DATABASE_URL, GROQ_API_KEY, SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY env vars)
- Database → Supabase free tier PostgreSQL instance
- Auth → Supabase Auth (same project); enable providers (email + OAuth) in the Supabase dashboard; on first sign-in the app creates the user's `UserProfile` and seeds default `StatusStage`s
- Storage → Supabase Storage bucket for CV files (private; access via signed URLs)
- Groq API key → free at console.groq.com
