# Database Schema (Prisma — packages/database)

> **Multi-tenancy:** every top-level model carries `userId` (the Supabase Auth user UUID from `auth.users`). The API's auth guard resolves `userId` from the verified JWT and every query is filtered by it — a user can only ever read/write their own rows. `userId` is a plain `String` (Supabase UUID); we don't mirror `auth.users` into a Prisma `User` model. Child rows (`StatusEvent`, `WorkExperience`, `Education`) inherit tenancy through their parent relation and are guarded by checking the parent's `userId`.

```prisma
model Application {
  id              String   @id @default(cuid())
  userId          String   // Supabase auth user UUID — owner of this row
  company         String
  role            String
  source          Source   @default(OTHER)
  rawText         String   @db.Text
  statusId        String
  status          StatusStage @relation(fields: [statusId], references: [id])
  statusHistory   StatusEvent[]
  scheduledEvents ScheduledEvent[]
  // Job facts (AI-extracted from rawText, then user-editable)
  location        String?           // e.g. "South Jakarta, Indonesia"
  workArrangement WorkArrangement?
  employmentType  EmploymentType?
  seniority       String?           // e.g. "Mid-Senior" — free-text, postings vary
  industry        String?
  jobUrl          String?           // link back to the posting / company site
  summary         String?  @db.Text // AI 1–2 sentence role/company summary
  salaryExpected  Int?
  salaryOffered   Int?
  requirements    String[] // requirement/qualification bullets (full phrases)
  skills          String[] // explicit required skills/tech, e.g. ["React", "Node.js"]
  matchedSkills   String[] // AI job-match: job skills the candidate meets (empty until scored)
  gapSkills       String[] // AI job-match: job skills the candidate lacks
  matchScore      Int?     // AI job-match score 0–100 (Groq) — set on creation if a profile exists, or recalculated
  matchRationale  String?  // short AI explanation behind matchScore/matchedSkills/gapSkills
  appliedDate     DateTime @default(now())
  followUpDate    DateTime?
  deadlineDate    DateTime?
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([statusId])
}

// User-defined, fully dynamic — not a fixed enum.
// Seeded with sensible defaults but fully editable/addable by the user.
model StatusStage {
  id           String   @id @default(cuid())
  userId       String   // stages are per-user (default set is seeded on signup, then editable)
  label        String   // e.g. "Applied", "Lamaran dilihat", "HRD ingin mewawancarai", "Assessment", "Offer"
  order        Int      // controls column position on the Kanban board
  color        String   @default("#94a3b8") // hex, for badge/column color
  isTerminal   Boolean  @default(false) // true for Offer/Rejected/Ghosted-type end states
  applications Application[]
  createdAt    DateTime @default(now())

  @@index([userId])
}

// Tracks every status change over time — this is what lets the
// timeline show "03 Jun 13:35 HRD ingin mewawancaraimu" etc.
model StatusEvent {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  statusId      String
  status        StatusStage @relation(fields: [statusId], references: [id])
  note          String?     // short one-line summary for the timeline row
  rawText       String?     // the pasted update message, cleaned + Markdown-formatted by the LLM
  occurredAt    DateTime    @default(now())

  @@index([applicationId])
}

// A time-flagged item captured from a status update (or added manually):
// an interview slot, an assessment deadline, a follow-up reminder. Powers the
// "Upcoming" agenda — queried per-user across applications, sorted by scheduledAt.
// Carries userId (not just applicationId) so the agenda is one indexed query.
model ScheduledEvent {
  id            String             @id @default(cuid())
  userId        String             // owner (Supabase auth UUID)
  applicationId String
  application   Application        @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  title         String             // e.g. "Technical interview", "Take-home assessment due"
  type          ScheduledEventType @default(OTHER)
  scheduledAt   DateTime           // exact moment (date + time) the event is due/happens
  note          String?
  completed     Boolean            @default(false) // done items drop off the Upcoming list
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@index([userId, scheduledAt]) // the Upcoming query: a user's events, soonest first
  @@index([applicationId])
}

enum ScheduledEventType {
  INTERVIEW   // interviews, calls
  ASSESSMENT  // tests, take-homes, coding challenges
  DEADLINE    // submission / response cut-offs
  FOLLOWUP    // "we'll get back to you by" / reminders
  OTHER
}

enum Source {
  WHATSAPP
  EMAIL
  LINKEDIN
  GLINTS
  JOBSTREET
  DIRECT
  OTHER
}

enum WorkArrangement {
  REMOTE
  HYBRID
  ONSITE
}

enum EmploymentType {
  FULLTIME
  PARTTIME
  CONTRACT
  INTERNSHIP
}

model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique // one profile per Supabase auth user

  // --- Identity / contact ---
  fullName        String?
  headline        String?  // e.g. "Senior Full-Stack Engineer"
  email           String?
  phone           String?
  location        String?  // e.g. "Jakarta, Indonesia"
  summary         String?  @db.Text // professional summary / bio
  links           Json?    // { linkedin, github, portfolio, website }

  // --- Skills & matching ---
  skills          String[] // e.g. ["Next.js", "NestJS", "PostgreSQL", "Redis", "TypeScript"]
  yearsExperience Int?     // total years, AI-estimated from CV, user-editable

  // --- Structured CV content (extracted, then user-editable) ---
  experiences     WorkExperience[]
  education        Education[]
  certifications  String[] // free-form, e.g. ["AWS SA Associate (2023)"]
  languages       String[] // spoken languages, e.g. ["English (fluent)", "Bahasa Indonesia (native)"]

  // --- CV source artifacts ---
  cvFileUrl       String?  // Supabase Storage URL of the uploaded CV (pdf/docx)
  cvFileName      String?  // original filename, for display
  cvRawText       String?  @db.Text // extracted plain text, kept for re-extraction/debug
  cvUploadedAt    DateTime?
  cvParseStatus   CvParseStatus @default(NONE) // tracks the async extraction lifecycle

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum CvParseStatus {
  NONE        // no CV uploaded yet
  PROCESSING  // upload received, extraction in progress
  COMPLETED   // structured data extracted and merged into profile
  FAILED      // extraction failed (corrupt file, unreadable, AI/parse error)
}

// Reusable answers to common application questions. The user pastes a filled-in
// application form; AI extracts question→answer pairs and either creates a new
// Template or updates the existing one on the same topic (no duplicates).
// Copy-to-clipboard when filling out the next application.
// (Superseded the earlier UserProfile.templateAnswers Json blob.)
model Template {
  id        String   @id @default(cuid())
  userId    String   // owner (Supabase auth UUID)
  topic     String   @default("Others") // short 1–2 word group label (AI-chosen), e.g. "Salary" — drives the filter pills
  question  String   // normalised, reusable phrasing, e.g. "Why do you want to work at this company?"
  answer    String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// One row per job/role on the CV. AI-extracted, fully user-editable afterward.
model WorkExperience {
  id            String   @id @default(cuid())
  profileId     String
  profile       UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  company       String
  title         String
  location      String?
  startDate     String?  // kept as string ("2021-03", "Mar 2021") — CVs are inconsistent
  endDate       String?  // null/"Present" when current
  isCurrent     Boolean  @default(false)
  description   String?  @db.Text // responsibilities/achievements
  skillsUsed    String[] // skills the AI associated with this role
  order         Int      @default(0) // display order (most recent first)

  @@index([profileId])
}

// One row per degree/program. AI-extracted, user-editable.
model Education {
  id            String   @id @default(cuid())
  profileId     String
  profile       UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  institution   String
  degree        String?  // e.g. "B.Sc. Computer Science"
  fieldOfStudy  String?
  startDate     String?
  endDate       String?
  description   String?  @db.Text
  order         Int      @default(0)

  @@index([profileId])
}

// Interview Training Session — AI-driven prep tied to ONE Application. See
// Product.md → "Interview Training Session" and agents.md.
model InterviewSession {
  id             String                 @id @default(cuid())
  userId         String
  applicationId  String
  application    Application            @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  status         InterviewSessionStatus @default(IN_PROGRESS)
  readinessScore Int?                   // 0–100, recomputed as questions are practiced/drilled
  questions      InterviewQuestion[]
  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt

  @@index([userId])
  @@index([applicationId])
}

model InterviewQuestion {
  id              String                    @id @default(cuid())
  userId          String
  sessionId       String
  session         InterviewSession          @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  order           Int
  category        InterviewQuestionCategory @default(BEHAVIORAL)
  question        String
  rationale       String?                   // why this is likely to be asked
  talkingPoints   String[]                  // AI-seeded hints from the user's real experience
  userAnswer      String?                   // the user's attempt
  feedback        String?                   // AI coaching on the attempt
  improvedAnswer  String?                   // AI's polished version
  keyPoints       String[]                  // 3–5 memorable bullets to drill
  score           Int?                      // 1–5 rubric score from coaching
  selfRating      Int?                      // 1–5 self-rating from the flashcard drill
  practiceStatus  InterviewPracticeStatus   @default(NOT_STARTED)
  savedTemplateId String?                   // set when the polished answer was saved to the Template library
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt

  @@index([sessionId])
  @@index([userId])
}

enum InterviewSessionStatus {
  GENERATING
  IN_PROGRESS
  COMPLETED
}

enum InterviewQuestionCategory {
  BEHAVIORAL
  TECHNICAL
  ROLE_FIT
  COMPANY
  GAP
  LOGISTICS
}

enum InterviewPracticeStatus {
  NOT_STARTED
  ANSWERED
  REVIEWED
}

// --- Skills Assessment (self-test of one profile skill; not tied to an Application) ---

model SkillAssessment {
  id            String               @id @default(cuid())
  userId        String // owner (Supabase auth UUID)
  skill         String // the profile skill under test, e.g. "PostgreSQL"
  status        AssessmentStatus     @default(GENERATING)
  questionCount Int                  @default(0)
  correctCount  Int? // filled on submit
  scorePct      Int? // raw percent correct, 0–100
  level         ProficiencyLevel? // difficulty-weighted, derived on submit
  summary       String? // AI debrief overview
  strengths     String[] // AI debrief: solid sub-topics
  focusAreas    String[] // AI debrief: sub-topics to study next
  questions     AssessmentQuestion[]
  createdAt     DateTime             @default(now())
  completedAt   DateTime?
  updatedAt     DateTime             @updatedAt

  @@index([userId])
  @@index([userId, skill])
}

model AssessmentQuestion {
  id            String             @id @default(cuid())
  assessmentId  String
  assessment    SkillAssessment    @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  userId        String
  order         Int
  difficulty    QuestionDifficulty @default(MID)
  subtopic      String? // area tested, e.g. "Indexing"
  scenario      String // real-world situation set-up
  prompt        String // the question asked
  options       String[] // exactly 4 answer choices
  correctIndex  Int // 0-based index of the correct option — withheld from client until COMPLETED
  explanation   String // why the correct option is right — also withheld until COMPLETED
  selectedIndex Int? // the user's choice (filled on submit)
  isCorrect     Boolean? // filled on submit
  createdAt     DateTime           @default(now())

  @@index([assessmentId])
  @@index([userId])
}

enum AssessmentStatus {
  GENERATING
  IN_PROGRESS
  COMPLETED
}

enum QuestionDifficulty {
  JUNIOR
  MID
  SENIOR
}

enum ProficiencyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

> **Migration status:** `InterviewSession` / `InterviewQuestion` and `SkillAssessment` / `AssessmentQuestion` are in the schema and `prisma generate` is done, but their migrations are **not yet applied** — run `prisma migrate dev --name add_interview_sessions` and `prisma migrate dev --name add_skill_assessments` (needs real `DATABASE_URL` + `DIRECT_URL`).

## Package & client (`@repo/database`)

- **Generator:** Prisma 7's `prisma-client` generator emits TypeScript into `src/generated/prisma/` (gitignored — regenerated via `prisma generate`). `moduleFormat = "cjs"`, `runtime = "nodejs"`.
- **Entry point:** `src/index.ts` exports a `prisma` singleton (reused across dev hot-reloads) plus a `export *` of all generated models, enums (`Source`, `WorkArrangement`, `EmploymentType`, `CvParseStatus`), and the `Prisma` namespace. Import everything from `@repo/database`.
- **Driver adapter:** the runtime `PrismaClient` connects through `@prisma/adapter-pg` (`pg`) using the **pooled** `DATABASE_URL` (Supabase PgBouncer). Prisma Migrate / CLI uses the **direct** `DIRECT_URL` (port 5432) via `prisma.config.ts`.
- **Build:** `prisma generate && tsc -b -v` → `dist/` (CJS + `.d.ts`), so the `tsc`-built NestJS API consumes it as an ordinary compiled dependency. Scripts: `generate`, `build`, `dev`, `db:push`, `db:migrate`, `db:studio`.

**Default seeded stages** — seeded per user on first sign-up/profile creation (user can rename, reorder, add, or delete any of these):
1. Applied
2. Viewed/Reviewed (matches JobStreet's "Lamaran sudah dilihat" / "direview lebih lanjut")
3. Screening
4. Interview Invited
5. Interview Done
6. Assessment
7. Offer (terminal)
8. Rejected (terminal)
9. Ghosted (terminal — manually marked after no response past a threshold)

This mirrors real platform behavior (e.g. JobStreet's own tracking UI: "Lamaranmu direview lebih lanjut", "HRD ingin mewawancaraimu") so the user isn't forced into a generic pipeline that doesn't match how recruiters actually communicate status.
