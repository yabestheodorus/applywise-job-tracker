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
