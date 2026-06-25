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

---

## Feature: Skills Assessment (built — scenario-MCQ MVP)

> Status: **built** (`turbo run build` green). Shipped per the approved decisions: **MCQ-only** (no open-ended/Phase 2), **12 questions** per test (4 Junior / 5 Mid / 3 Senior), **exam mode**, **one skill per assessment**, **purely profile-skill-focused** (no Application/job involvement). Caveat: the Prisma **migration is not yet applied** (`prisma migrate dev --name add_skill_assessments`) — `prisma generate` is done so the code compiles, but it won't run against the DB until the migration is applied. See the Decision Log in CLAUDE.md.

### The one job
The skills on a profile are **self-claimed**. This feature lets a jobseeker **prove** a skill to themselves by taking a short, real-world technical test for it — scenarios like the ones they'd actually hit at a real company — and walk away with an honest **proficiency score** per skill, plus a list of the exact sub-topics to shore up before interviews.

### Why it fits the app
Every input already exists, so tests are calibrated to the person, not generic:
- `UserProfile.skills[]` → the menu of skills you can be tested on (you test what you claim).
- `UserProfile.yearsExperience` + `WorkExperience.skillsUsed` / `seniority` cues → **calibrate difficulty** (a senior backend dev gets harder Postgres scenarios than a junior).
- It closes the loop with the rest of the app: a proven skill is a stronger signal for the **Job-Match score**, and weak sub-topics are exactly what the **Interview Training Session** should drill (future wiring, see Payoff).

### The core design call — question format
**Recommendation: scenario-based multiple-choice (MCQ), deterministically scored.** Each question sets up a realistic situation at a company and asks for the single best action/answer, with 4 options where the wrong ones are *common real misconceptions* (not obviously silly).

> Example (React): *"A search input re-renders the whole results list on every keystroke and the page janks. The list rarely changes. What's the most effective first fix?"* → options include `useMemo` the list, `React.memo` the row + stable props (correct), `useCallback` everything, debounce state in a `useRef`. Explanation reveals *why*.
>
> Example (SQL): *"A reporting query that joins orders→customers times out as the table crosses 10M rows. `EXPLAIN` shows a sequential scan on `orders.customer_id`. Best first move?"*

Why MCQ for the MVP:
- **Objective, instant, free to grade** — no per-answer LLM call, no subjectivity, a real numeric score.
- Groq is strong at *generating* plausible scenario stems + distractors + explanations.
- "Real-world" lives in the **stem**, not the answer format — production incidents, trade-offs, debugging, design choices.

Open-ended "explain your approach" answers (AI-graded, like the interview coach) are richer but slower, costlier, and fuzzier — **Phase 2**, not the MVP.

### What makes it "real world" (the generation contract)
The generator is told to **only** produce questions framed as concrete situations a working engineer faces: a production bug, a performance cliff, a code-review call, a design trade-off, a "this broke in prod at 2am" scenario. Explicitly **banned**: definition/trivia recall ("what does `useEffect` do?"), syntax memorization, and ambiguous questions with more than one defensible answer. Difficulty is mixed across **Junior / Mid / Senior**, calibrated to the candidate's experience.

### User flow
**1. Pick a skill to test** (new **Skills** page; also a "Test" affordance on each skill pill in Profile)
- The Skills page lists the profile's skills as cards, each showing its **latest proficiency** (or "Not tested yet") and a **Start test / Retake** button.

**2. Take the test** (exam mode — answer all, then submit)
- AI generates ~**8 scenario questions** (e.g. 3 Junior / 3 Mid / 2 Senior) for that one skill.
- One question per screen: scenario + prompt + 4 radio options, a progress bar, prev/next. No answers are revealed mid-test (the API never sends the correct index until you submit — see Guardrails).
- **Submit** → graded instantly.

**3. Results + debrief** (the payoff)
- A **score ring** (% correct) and a **proficiency level** badge: Beginner / Intermediate / Advanced / Expert (derived from score *weighted by question difficulty* — nailing Senior questions counts more).
- **Per-question review**: your answer vs. the correct one, with the explanation — this is where the learning happens.
- A short AI **debrief**: 1–2 sentence summary, what you're clearly solid on, and 2–3 **focus areas** (the sub-topics you missed) to study next.

**4. Retake** anytime — generates a fresh set; history is kept so you can see improvement.

### Proposed data model (new `assessments` module)
- **`SkillAssessment`** — `id`, `userId`, `skill` (string, must be one of the profile's skills at start time), `status` (`AssessmentStatus`), `questionCount`, `correctCount Int?`, `scorePct Int?`, `level ProficiencyLevel?`, `summary String?`, `strengths String[]`, `focusAreas String[]`, `questions[]`, `createdAt`, `completedAt DateTime?`.
- **`AssessmentQuestion`** — `id`, `assessmentId` (cascade), `userId`, `order`, `difficulty` (`QuestionDifficulty`), `subtopic String?`, `scenario`, `prompt`, `options String[]` (4), `correctIndex Int`, `explanation`, `selectedIndex Int?`, `isCorrect Boolean?`.
- Enums: `AssessmentStatus { GENERATING, IN_PROGRESS, COMPLETED }`, `QuestionDifficulty { JUNIOR, MID, SENIOR }`, `ProficiencyLevel { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT }`.
- Additive migration only; nothing on existing models changes (mirrors how `InterviewSession` was added).

### AI prompts (Groq, same `GroqService` patterns)
- **`SKILL_TEST_GENERATION_SYSTEM_PROMPT`** (JSON via `extractJson` + a Zod schema) — in: `{ skill, candidate: { yearsExperience, seniorityHints, relevantExperience[] }, counts: { junior, mid, senior } }`; out: `{ questions: [{ difficulty, subtopic, scenario, prompt, options[4], correctIndex, explanation }] }`. Enforces: real-world stems only, exactly one best answer, distractors = common misconceptions, no trivia/syntax/ambiguity.
- **`SKILL_TEST_DEBRIEF_SYSTEM_PROMPT`** (JSON) — in: `{ skill, results: [{ subtopic, difficulty, correct }] }`; out: `{ summary, strengths[], focusAreas[] }`. The LLM only narrates and names focus areas; **the score and level are computed deterministically in the service**, never by the model.

### API endpoints (all `@CurrentUser`-scoped, 404 cross-tenant)
- `POST /assessments` `{ skill }` → validate the skill is on the profile, create + generate, return the assessment **with answers stripped**.
- `GET /assessments` → history (grouped by skill, latest first).
- `GET /assessments/:id` → fetch; `correctIndex`/`explanation` **omitted while `IN_PROGRESS`**, included once `COMPLETED`.
- `POST /assessments/:id/submit` `{ answers: [{ questionId, selectedIndex }] }` → grade deterministically, persist, run the debrief, return full results.

### Web
- New route **`app/(app)/skills`** — skill cards with proficiency + history; the `AssessmentRunner` client component (one-question-at-a-time exam → results view with score ring, level badge, per-question review, debrief, retake).
- A **"Test"** entry point on each skill pill in the Profile page.
- New **Skills** sidebar nav item; new web types + server actions, consistent with the interview feature.

### Same guardrails as the rest of the app
- **Per-user**, and you can only be tested on skills actually on your profile.
- **Anti-peek**: correct answers + explanations are never sent to the client until you submit — answers live server-side only.
- Deterministic, explainable scoring (the LLM writes questions and narrates; it does **not** assign your grade).
- Read-only payoff for now — a test result doesn't silently rewrite your profile.

### Payoff / future wiring (noted, not in first build)
Proven skills become a signal: a **"verified" badge** on profile skills, an input to the **Job-Match score**, and a way to **prioritise Interview-prep** on the sub-topics you flunked. A **proficiency trend** over retakes.

### In scope (first build)
One-skill scenario-MCQ test generation calibrated to the profile; exam-mode runner; deterministic scoring + difficulty-weighted proficiency level; per-question review with explanations; AI debrief with focus areas; history + retake; a Skills page + Profile entry point.

### Out of scope (later)
- **Open-ended / code-reasoning answers** graded by AI (Phase 2) and any **live code execution / sandbox** (no runner, ever in MVP — scenarios + reasoning only).
- **Timed/proctored** exams or anti-cheat beyond hiding answers.
- **Multi-skill combined** tests — one skill per assessment for a clean per-skill score.
- Testing skills **not** on the profile, or auto-adding skills from results.
- Non-English tests.

### Decisions (resolved at build time)
1. **Format** — **scenario-MCQ only**. No open-ended/AI-graded questions; "Phase 2" was dropped from scope.
2. **Mode** — **exam** (answer all → one grade), not per-question reveal.
3. **Length & calibration** — **12 questions** per test (4 Junior / 5 Mid / 3 Senior), calibrated to the candidate's experience.
4. **Entry point** — a dedicated **Skills** page (`/skills`) is the entry; sidebar nav added under *Library*. (A per-pill "Test" button on the Profile page was deferred to keep the editable TagInput untouched.)
