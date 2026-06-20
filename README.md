# ApplyWise

An AI-assisted tracker for job applications scattered across WhatsApp, email, Glints, and LinkedIn. Paste the raw message; AI pulls out the structure, the status, the deadlines, and the answers you keep re-typing.

## What it is & how to run it

A Turborepo monorepo: **Next.js 16** web app (`apps/web`), **NestJS 11** API (`apps/api`), **Prisma 7 + Postgres** (`packages/database`), shared Zod contracts (`packages/api`). Auth is Supabase; AI extraction is Groq (Llama 3.3).

```bash
npm install

# Copy the ready-to-run env files (see note) — no DB setup, no migrations:
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example          apps/api/.env
cp apps/web/.env.local.example    apps/web/.env.local

npm run dev   # web → http://localhost:3000, api → :3001 (turbo)
```

> **About the `.env.example` files** — normally you'd bring your own database and
> API keys. To keep this assessment **zero-setup**, the examples ship a working,
> already-provisioned Supabase database and a Groq key, so `cp` + `npm run dev`
> is all it takes — nothing to install, no migrations to run. This is purely an
> evaluation convenience; in a real project these would be your own secrets and
> wouldn't be committed.

Deploying it for real (Vercel + Railway/Render + Supabase): see [DEPLOYMENT.md](DEPLOYMENT.md).

## Who it's for & the one job

A single active job-seeker juggling 15+ applications at once. The one job: **never lose track of where an application stands or what's due next** — capturing that should take a paste, not a form.

## Why this problem

A real one from my own search: ~3 active applications, 20 "viewed", 10 asking me to fill a form, 5 with assessment due dates, 3 with interview dates. Every time I needed the only answer that matters — *which company, and do I prep an interview or finish an assessment first?* — I'd scroll back through emails and job boards just to dig out one fact. ApplyWise puts that one fact in one place.

## What's already out there

Spreadsheets, Notion templates, Trello, and paid trackers like Teal/Huntr. They all make *you* do the data entry and the status updates. ApplyWise leans on the LLM to read the messy pasted text — recruiter chats, ATS emails — so the tracking is a side effect of forwarding, not a second job.

## In scope / out of scope

**In:** AI extraction of new applications, AI status updates (mapped to a custom Kanban stage + auto-captured interview/deadline events), an Upcoming agenda, CV-driven profile + skill matching (matched skills show your strengths, gap skills your weaknesses against each posting — so you know your fit at a glance), and a reusable Q&A template library. **Out:** automated inbox/WhatsApp scraping, team sharing, OCR for scanned CVs, push notifications, analytics. Left out to keep the core loop (paste → review → save) sharp and shippable in the time box.

## Assumptions

Where the brief was silent I assumed: the user is a **technical** job-seeker — the CV and job-posting extraction (and the skill matching) are built and tested on developer CVs and tech job posts, and aren't validated for non-technical roles; manual paste beats fragile scraping; users want to **review** every AI draft before it saves (never silent writes); stages are per-user and fully editable, not a fixed enum; dates on CVs stay strings ("Mar 2021"–"Present") because coercion loses data.

## Three questions I'd ask a real user

1. When you paste a recruiter message, do you trust the AI draft enough to one-click save, or do you always want to review?
2. What actually makes you lose an application today — forgetting a deadline, or not remembering which stage it's in?
3. Would you paste a whole filled-in form to build your answer library, or only ever add answers one at a time?

## How I'd know it's working & what's next

**Working** = applications get added in seconds, the Upcoming list catches a deadline you'd have missed, and extraction rarely needs correcting. I'd watch time-to-add, edit-rate on AI drafts, and overdue events surfaced before their date. **Next:** drag-and-drop board + stage management UI, a duplicate-application check, and tightening extraction accuracy on Indonesian recruiter messages.
