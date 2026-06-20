# Code Structure

## Monorepo Structure (Turborepo)

Scaffolded from `create-turbo@latest --example with-nestjs`. Actual current layout:

```
applywise-job-tracker/
├── apps/
│   ├── web/                 # Next.js 15 (App Router) frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── api/                 # shared, framework-agnostic API contracts (@repo/api) — Zod schemas +
│   │                        #   inferred types (e.g. profile/profile.schema.ts) used by BOTH apps
│   ├── ui/                  # shared React component library (@repo/ui)
│   ├── eslint-config/       # shared ESLint config (@repo/eslint-config)
│   ├── jest-config/         # shared Jest config (@repo/jest-config)
│   └── typescript-config/   # shared tsconfig presets (@repo/typescript-config: base/nestjs/nextjs/react-library)
├── turbo.json
├── package.json             # npm workspaces: apps/*, packages/*
└── README.md
```

- `packages/database/` — Prisma schema + generated client (`@repo/database`), shared by `apps/api` (and any server code). Implemented. See [db-schema.md](../db-schema.md).

- `packages/api/` (`@repo/api`) now hosts shared **Zod contracts** consumed by both apps: the API validates requests with them (`ZodValidationPipe`) and the web uses them as TanStack Form validators (Zod implements Standard Schema) + payload types. Built to `dist/` via `tsc`; `entry.ts` exports only framework-agnostic schemas (no NestJS imports, so the web bundle stays clean).

**Planned cleanup:**
- The example `links` demo source remains in `packages/api/src/links` but is **no longer exported** from `entry.ts`; delete it when convenient.

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: NestJS, TypeScript
- Auth: **Supabase Auth** (multi-tenant). Web uses `@supabase/ssr` for session/cookie handling; API verifies the Supabase JWT via a NestJS auth guard. Every row is scoped to the authenticated `userId`.
- Database: PostgreSQL (Supabase)
- ORM: Prisma (shared package between apps)
- AI: Groq API (free tier, fast inference) — for text extraction and skill matching, using a model like llama-3.3-70b-versatile or similar
- Deployment: Vercel (web), Railway or Render (api)

## API Endpoints (NestJS — apps/api)

**Dev ports:** web → `http://localhost:3000`, API → `http://localhost:3001` (API reads `PORT` via `ConfigService`, default `3001`). Web keeps 3000 because the OAuth redirect is pinned to `localhost:3000/auth/callback`.

**Implemented so far:** `applications` module — `POST /applications/extract` (Groq draft), `POST /applications` (create + initial `StatusEvent`), `GET /applications`, `GET /applications/:id` (includes current `status` + `statusHistory` w/ each event's `status`), `POST /applications/:id/status/extract` (Groq stage suggestion), `PATCH /applications/:id/status` (move stage — existing or created from `newStageLabel` — + append `StatusEvent`, atomic); `stages` module — `GET /stages` (seeds the 9 defaults on first use), `POST/PATCH/DELETE /stages/:id`; `profile` module — `GET /profile` (get-or-create, includes experiences + education), `PATCH /profile` (upsert + replace child rows in a transaction), `POST /profile/cv` (multipart pdf/docx upload → parse text → Groq → review draft; parse-only, file not stored); `templates` module — `GET /templates`, `POST /templates/extract` (Groq mines a pasted filled-in form for Q&A pairs, deduped against existing → review draft), `POST /templates/apply` (persist reviewed drafts: create new + update matched, one tx), `POST/PATCH/DELETE /templates(/:id)` (manual CRUD); `events` module — `GET /events` (the Upcoming agenda — a user's `ScheduledEvent`s across all applications, soonest first, `?completed=true` to include done), `POST /events` (manual add), `PATCH /events/:id` (edit / mark done), `DELETE /events/:id`. Inputs validated with `ZodValidationPipe` (`common/zod-validation.pipe.ts`, profile uses the shared `@repo/api` schemas); AI via shared `GroqService` (`common/groq.service.ts`). The skill-match route is not built yet (matched/gap skills are AI-extracted inline during application extraction for now).

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

POST   /applications/:id/status/extract  # body: { message } → Groq reads a status-update message in the
                                         #   context of THIS application + the user's stages + current date,
                                         #   and suggests a target StatusStage (existing) or a new custom stage,
                                         #   a note, a confidence, AND an optional time-flagged `event`
                                         #   { title, type, scheduledAt } if the message states a date/time.
                                         #   Returns a draft only — no DB write. Powers the detail-view panel.
PATCH  /applications/:id/status  # body: { statusId | newStageLabel, note?, event? } → moves stage (creating one
                                 #   from newStageLabel if given) AND appends a StatusEvent; if `event` is present,
                                 #   also creates a ScheduledEvent (atomic). Exactly one of statusId/newStageLabel.
                                 #   (No separate /timeline route — GET /applications/:id already includes
                                 #    statusHistory + scheduledEvents.)

GET    /events                   # the Upcoming agenda — the user's ScheduledEvents across all applications,
                                 #   soonest first (each row includes its application + stage). ?completed=true incl. done
POST   /events                   # manually add an event: { applicationId, title, type, scheduledAt, note? }
PATCH  /events/:id               # edit an event or mark it done: { title?, type?, scheduledAt?, note?, completed? }
DELETE /events/:id               # remove an event

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

GET    /templates                # list the user's Q&A templates (most-recently-updated first)
POST   /templates/extract        # body: { rawText } → AI mines a pasted filled-in form for Q&A pairs,
                                 #   each tagged matchedId (an existing template on the same topic → update)
                                 #   or null (new). Draft only — no DB write. Returns { items: [...] }.
POST   /templates/apply          # body: { items: [{ id?, question, answer }] } → persists the reviewed
                                 #   drafts: items with an owned id update, the rest are created (one tx).
POST   /templates                # manual single create { question, answer }
PATCH  /templates/:id            # manual edit { question?, answer? }
DELETE /templates/:id            # delete a template
```

### API infrastructure (implemented in `apps/api/src`)

- **Config:** `ConfigModule.forRoot({ isGlobal: true })` in `AppModule` loads `.env`. Read env via the injected `ConfigService` (`config.getOrThrow('KEY')`) — **not** `process.env` — in providers/guards.
- **`CommonModule` / `PrismaService`** (`common/`): `@Global()` module holding cross-cutting providers (DB access, and more as added). `PrismaService extends PrismaClient` (from `@repo/database`), built with the `@prisma/adapter-pg` driver adapter on `DATABASE_URL` (via `ConfigService`), and `$connect`/`$disconnect` on the module lifecycle (`main.ts` calls `app.enableShutdownHooks()`). Inject `PrismaService` anywhere.
- **`SupabaseAuthGuard`** (`auth/supabase-auth.guard.ts`): registered globally via `APP_GUARD`, so **every route is protected by default**. Reads `Authorization: Bearer <jwt>` and verifies it against the project's public JWKS (`SUPABASE_JWKS_URL`, asymmetric ES256/RS256 keys) using `jose`'s `createRemoteJWKSet` — the key set is fetched once and auto-refreshed on an unknown `kid`. On success attaches `req.user = { id: sub, email }`. Missing/invalid/expired token → `401`.
- **`@Public()`** (`auth/public.decorator.ts`): opts a route/controller out of the guard. Used by `GET /health` (`app.controller.ts`).
- **`@CurrentUser()`** (`auth/current-user.decorator.ts`): param decorator returning the `AuthUser` (`auth/auth-user.ts`); `@CurrentUser('id')` returns just the Supabase user UUID that handlers scope Prisma queries to.

### Web auth (implemented in `apps/web`)

Sign-in/up runs entirely client-side via Supabase Auth (`@supabase/ssr`); the API only verifies the forwarded JWT.

- **Supabase clients** (`lib/supabase/`): `client.ts` (`createBrowserClient` for Client Components), `server.ts` (`createServerClient` bound to Next's async `cookies()`, for Server Components/Actions/Route Handlers), and `middleware.ts` (`updateSession` helper).
- **`proxy.ts`** (Next 16 "proxy" convention, formerly `middleware.ts`): on every request, refreshes the session and **gates access** — unauthenticated users → `/login`, signed-in users are bounced off `/login` and `/signup`. Public prefixes: `/login`, `/signup`, `/auth`.
- **Auth pages** (`app/(auth)/`): `login` and `signup` render a shared `components/auth/auth-form.tsx` (email/password + "Continue with Google"). Email/password go through Server Actions in `app/(auth)/actions.ts` (`signInWithPassword` / `signUp`); Google uses client-side `signInWithOAuth`. Signup with email confirmation shows a "check your email" message.
- **`app/auth/callback/route.ts`**: exchanges the OAuth/confirmation `code` for a session, then redirects to `next` (default `/`). **`app/auth/signout/route.ts`**: `POST` → `signOut()` → `/login`.
- **`components/auth/user-menu.tsx`**: avatar dropdown in the header showing the signed-in email + sign-out (POSTs to `/auth/signout`); the home page passes the verified user's email down.
- **Google provider** must be enabled in the Supabase dashboard, with `${SITE_URL}/auth/callback` allowed as a redirect URL.

### Web app shell & data (implemented in `apps/web`)

- **Authenticated shell** (`app/(app)/`): a route-group `layout.tsx` renders a left **sidebar** (`components/app-sidebar.tsx`: Board / Upcoming / Profile / Stages / Templates, active-link aware) + the top `AppHeader` (Add-application dialog, theme toggle, user menu) + `Toaster`. The board is `app/(app)/page.tsx`; Stages is a placeholder page for now. (The old top-bar-only `app/page.tsx` and `lib/mock.ts` were removed.)
- **Templates** (`app/(app)/templates/page.tsx`, server → `TemplatesManager` client): an explainer brief + paste-a-filled-form textarea → `extractTemplates` → review drafts (each tagged **New** or **Updates: \<existing question\>**, editable, includable) → `applyTemplates`. Below, saved answers render as `TemplateCard`s with a colored **topic** pill, copy-to-clipboard (`navigator.clipboard`), inline edit, and delete; plus a manual add form. A row of **topic filter pills** (colors from `lib/topic-color.ts`, deterministic per topic) filters the list. Server actions in `app/(app)/templates/actions.ts`.
- **API access**: `lib/api/server.ts` `apiFetch()` calls the NestJS API server-side, forwarding the Supabase access token as a Bearer JWT (env `API_URL`, default `http://localhost:3001`). The board (Server Component) fetches `GET /stages` + `GET /applications` + `GET /events`; `lib/types.ts` holds the view types + urgency/format helpers.
- **Board layout** (`components/board/`): stages render as stacked horizontal **lanes** (`KanbanLane`) — vertical axis is the pipeline, each lane's application cards run left-to-right with per-lane horizontal scroll. The board page is a two-column pane: lanes on the left, a compact read-only **Upcoming** rail (`UpcomingPanel`, next 8 events, `xl:`-only) on the right.
- **Add application** (`components/board/add-application-dialog.tsx`): paste → "Extract with AI" → editable AI-suggested draft → confirm. Email/extract/create go through Server Actions in `app/(app)/applications/actions.ts`; success toasts via `sonner`, board refreshed via `revalidatePath` + `router.refresh()`.
- **Application detail (Flow B)** (`app/(app)/applications/[id]/page.tsx`, server): board cards link here (`components/board/application-card.tsx`). Renders the header (source/location/arrangement/salary/deadline/jobUrl), Summary, Skill match (matched/gap/required chips from `components/application/`), Requirements, the `StatusTimeline` (server — each entry's pasted message shows as a 2-line `MessagePreview` clamp that opens a right-side `Sheet` drawer with the full `FormattedText` + stage/timestamp header), a `ScheduledEvents` card (`ApplicationEvents`, client), and an aside `StatusUpdatePanel` (client). The panel does paste → `extractStatusUpdate` → review the AI's suggested stage (Select incl. "+ Create new stage…") + editable note + an optional **scheduled event** (title/type/datetime, auto-filled when the AI finds one) → `updateApplicationStatus` → `router.refresh()`. Both actions live in `app/(app)/applications/actions.ts`; 404s from the API map to `notFound()`.
- **Upcoming agenda** (`app/(app)/upcoming/page.tsx`, server): fetches `GET /events` and renders every flagged `ScheduledEvent` across applications, split into **Overdue** / **Upcoming**, soonest first, each linking back to its application with type badge + relative/absolute time. `EventActions` (client) marks done/reopen + deletes; `ApplicationEvents` also adds events manually. Event server actions (`createEvent`/`setEventCompleted`/`deleteEvent`) live in `app/(app)/events/actions.ts` and revalidate `/upcoming`, `/`, and the detail page. Sidebar has an "Upcoming" nav item.

## Code Quality Expectations
- TypeScript strict mode on both frontend and backend
- Shared types package to avoid duplicating interfaces between web and api
- Environment variables for Groq API key, database URL, and Supabase config — never hardcoded, .env.example provided.
  - web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser-safe; in `apps/web/.env.local`)
  - api: `SUPABASE_URL`, `SUPABASE_JWKS_URL` (project `/auth/v1/.well-known/jwks.json` — the guard verifies tokens against it), `SUPABASE_SECRET_KEY` for Storage uploads (new-style key, formerly the service-role key), `DATABASE_URL`, `DIRECT_URL` (migrations), `GROQ_API_KEY`
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
