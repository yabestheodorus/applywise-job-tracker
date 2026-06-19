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
  salaryExpected  Int?
  salaryOffered   Int?
  requirements    String[] // AI-extracted requirement tags
  matchedSkills   String[] // computed against UserProfile.skills
  gapSkills       String[] // computed
  appliedDate     DateTime @default(now())
  followUpDate    DateTime?
  deadlineDate    DateTime?
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
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
  application   Application @relation(fields: [applicationId], references: [id])
  statusId      String
  status        StatusStage @relation(fields: [statusId], references: [id])
  note          String?     // optional context, e.g. "via email from JobStreet"
  occurredAt    DateTime    @default(now())
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

  // --- Reusable application answers ---
  templateAnswers Json     // key-value: { "why_interested": "...", "salary_expectation": "..." }

  updatedAt       DateTime @updatedAt
}

enum CvParseStatus {
  NONE        // no CV uploaded yet
  PROCESSING  // upload received, extraction in progress
  COMPLETED   // structured data extracted and merged into profile
  FAILED      // extraction failed (corrupt file, unreadable, AI/parse error)
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
}
```

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
