# ApplyWise — Product

## Project Overview
A personal job application tracker built for the Pixel8Labs take-home assessment. Solves a real problem: tracking 15+ concurrent job applications scattered across WhatsApp, email, Glints, and LinkedIn, with AI-assisted extraction, skill matching, and follow-up tracking.

## Core User Flow

These are **two distinct flows** with separate UIs — creating an application and updating its status are never the same form.

**A. Add a new application** (top-level "Add application" form)
1. User pastes raw text (WhatsApp message, email, job posting) into a textarea
2. Frontend calls `POST /applications/extract` → Groq extracts a NEW-application draft: company, role, requirements, salary range if mentioned, deadline if mentioned
3. User reviews the editable draft, confirms → `POST /applications`

**B. Update an existing application's status** (textarea lives *inside the job detail view*, not the add form)
1. User opens an application's detail page and pastes a status-update message (e.g. a JobStreet email: "Lamaranmu direview lebih lanjut") into the detail view's status-update textarea
2. Frontend calls `POST /applications/:id/status/extract` → Groq reads the message *in the context of that one application* and suggests which existing `StatusStage` it maps to, or proposes creating a new custom stage if nothing fits, plus an optional note
3. User reviews the suggestion (can pick a different stage / edit the note), confirms → `PATCH /applications/:id/status`, which appends a `StatusEvent` to the timeline

**C. Manage profile** (profile page)
- **Upload a CV (PDF/DOCX)** → backend extracts text and calls Groq to auto-populate identity, summary, skills, work experience, education, certifications, and languages. User reviews the extracted draft, edits anything, and confirms before it's saved (same "AI-draft → review → confirm" pattern as application extraction).
- Manually manage skills, work experience, and education rows (add/edit/delete) without a CV
- Manage custom stages and **reusable template answers**: paste a filled-in application form → AI extracts each question→answer pair into a `Template` (and *updates* the matching existing answer instead of creating a near-duplicate when a similar question recurs); copy any answer to clipboard when filling out the next application. Manual add/edit/delete too.
- A richer profile → better skill matching: extracted skills + per-role `skillsUsed` feed the application skill-match step

**Shared views**
- Main view: Kanban board with columns = `StatusStage` ordered by `order`, fully drag-and-drop reorderable, user can add/rename/delete columns anytime
- Clicking a card opens the detail view: timeline (StatusEvent history, mirroring the "Tracking Status Lamaran" UI pattern from JobStreet) + AI skill match + the status-update textarea from flow B + the application's scheduled events
- **Upcoming agenda**: a dedicated view listing every time-flagged `ScheduledEvent` (interview slot, assessment deadline, follow-up) across all applications, sorted soonest-first with overdue/upcoming grouping. Events are captured automatically when a status update mentions a date/time (AI extracts `{title, type, datetime}`, user confirms), or added manually; each links back to its application.

## Scope Boundaries (explicitly OUT of scope for this MVP — mention in README)
- Multi-tenant via Supabase Auth (email/password + OAuth as Supabase provides). No custom roles/permissions or team/organization sharing — each user sees only their own data.
- No automated email/WhatsApp scraping (manual paste only — user copies the relevant text in)
- New-vs-update is decided by the user choosing a flow (Add application vs. the status-update textarea in a job's detail view) — there is no automatic detection across applications
- No push notifications (visual badges only: overdue = red, upcoming = yellow, on the follow-up date)
- No analytics/reporting dashboard
- No automatic duplicate-detection — the user always confirms an extracted draft before it's saved
- CV upload supports text-based PDF/DOCX only — no OCR for scanned/image PDFs (fail gracefully with a clear message)

---

## Feature: Interview Training Session (built — Text MVP + live mock)

> Status: **built** on the `feature/interview-training-session` branch (`turbo run build` green). Scope shipped: **Text MVP + live conversational mock**. One caveat — the Prisma **migration is not yet applied** (`prisma migrate dev --name add_interview_sessions`), so it won't run against the DB until that's done. See the Decision Log in CLAUDE.md and the per-area docs (db-schema / agents / code-structure).

### The one job
Tie a focused prep session to **one Application** so that, by the end, the jobseeker walks in with *loaded answers in their mind* — not a document they read once, but a small set of memorized, rehearsed talking points they can deliver under pressure.

### Why it fits the app
Every input already exists, so questions are genuinely tailored rather than generic:
- `Application.requirements` / `skills` → technical and role-fit questions
- `Application.gapSkills` → turn weaknesses into *prepared* answers ("how would you ramp up on Kafka?")
- `UserProfile.workExperiences` → raw material for authentic STAR stories (answers grounded in the user's real history, not invented)
- `Template` library → pre-fill logistics answers (salary expectation, notice period) and **save polished answers back into it** (reuses the existing model — no duplicate storage)
- A `ScheduledEvent` of type `INTERVIEW` on the Upcoming agenda → a natural "Prep now" entry point

### Pedagogy (how it actually "loads" answers)
The session is built around **active recall**, not passive reading:
1. **Attempt first.** The user answers in their own words *before* seeing any model answer.
2. **Coach, don't replace.** The AI grades the attempt and gives targeted feedback + an improved version + 3–5 **key points** (memorable bullets, not paragraphs).
3. **Compress, then drill.** A flashcard loop shows the question, the user recalls out loud / from memory, then reveals the key points and self-rates. Weak ones repeat. This drill is the step that makes answers stick.

### User flow
**1. Start a session** (button on the Application detail page; also surfaced on Upcoming `INTERVIEW` events)
- AI generates a balanced question set tailored to this job + this candidate, across categories: **Behavioral** (STAR, tied to required competencies), **Technical** (the named skills), **Role-fit**, **Company** ("why us / why this role"), **Gap** (probing the `gapSkills`), **Logistics** (salary, notice — pre-filled from existing templates where available). Each question carries a short *rationale* (why it'll likely be asked) and AI-seeded talking points drawn from the user's real experience.
- User reviews the set, can remove or regenerate questions, then begins.

**2. Practice mode** (one question at a time)
- User types an answer → "Get coaching" → AI returns a **score (1–5)**, **feedback** (what's strong / what to fix), an **improved answer**, and **key points[]**, graded on a category-appropriate rubric (STAR completeness for behavioral, specificity + correctness for technical, etc.).
- User can edit/accept the improved answer, **save it to their Template library** (one click), mark the question reviewed, and move on. A progress bar tracks coverage.

**3. Live mock interview** (conversational)
- An optional chat-style mode where the AI plays interviewer for this specific role: it asks a question, the user answers, and the AI asks **dynamic follow-ups** ("how did the other person react?") the way a real interviewer probes — with running, lightweight feedback. Pulls from the same generated question set but lets the conversation breathe.

**4. Recap "cheat sheet"** (the payoff)
- A single-screen brief: every question → its 3–5 key points, drillable as flashcards (show question → recall → reveal → self-rate; weak ones repeat). A session **readiness score** reflects how many questions were practiced and how they were rated.

### Same guardrails as the rest of the app
- **AI-draft → review → confirm**: generated questions and improved answers are always editable before anything is saved; nothing is invented about the user's history.
- Everything is **per-user** and scoped to a single Application.
- Polished answers flow into the **existing Templates library** rather than a parallel store.

### In scope (first build)
Tailored question generation; typed attempt → AI coaching (score / feedback / improved answer / key points); save-to-Templates; a live conversational mock with dynamic follow-ups; recap cheat sheet + flashcard drill with a readiness score.

### Out of scope (later)
- **Voice practice** — speech-to-text answers and delivery feedback (pace, filler words). Text only for now.
- **Cross-session spaced repetition** — retention drilling lives within a single session, not scheduled across days.
- **Readiness trend over time** / analytics across multiple sessions or applications.
- No scraping of real interview questions from external sites — questions are generated from the stored job + profile.
