# CLAUDE.md — Project Guide for the Claude Code Agent

This file is the **entry point**. Don't read docs from scratch — use the map below to open only the file you need for the task at hand.

## Documentation Map — read the right file, not everything

| If you need… | Read |
|---|---|
| What the product is, user flows, what's in/out of scope | [Product.md](Product.md) |
| Database models, Prisma schema, enums, multi-tenancy rules, seeded stages | [db-schema.md](db-schema.md) |
| AI/Groq behavior: extraction prompts, CV parsing, skill matching | [agents.md](agents.md) |
| Monorepo layout, tech stack, API endpoints, auth, env vars, deployment | [code-structure.md](code-structure.md) |
| Design system: colors, type, components, screens | [design.md](design.md) |
| User-facing project readme | [readme.md](readme.md) *(placeholder)* |

Rule of thumb: pick the single most relevant doc first. Only open others if that doc references them or the task genuinely spans areas.

## Keeping docs as the source of truth

These markdown files — not chat history or prior memories — are the **single source of truth**. When something changes:

1. **Make the change in the relevant doc** (schema → `db-schema.md`, AI behavior → `agents.md`, endpoints/stack → `code-structure.md`, product/scope → `Product.md`).
2. **Add a one-line entry to the Decision Log below** so the rationale is preserved.
3. Do **not** rely on remembered conversations or superseded versions — if a doc and your memory disagree, the doc wins. If the docs are silent on something, ask or decide and then record it here.

When a past decision is reversed, update the doc *and* add a new dated log entry noting what changed and why (don't silently delete the old reasoning).

## Decision Log

> Newest first. Format: `YYYY-MM-DD — <what changed> — <why> (docs touched)`

- **2026-06-19** — Installed Tailwind v4 + shadcn/ui (latest, `radix-nova`/`stone`, lucide) in `apps/web`; applied the emerald/stone theme + `0.75rem` radius in `globals.css` and wired Inter (`--font-sans`) + Cal Sans (`--font-heading`) in `layout.tsx`. Added `@/*` path alias + PostCSS config. `apps/web` builds green. — Implement the design system foundation. (design.md, code-structure.md)
- **2026-06-19** — Defined the design system: warm & friendly, light-first (both themes), **emerald** brand on **warm stone** neutrals, restrained color on the Kanban board. Type: **Cal Sans** headings + **Inter** body (Inter `tabular-nums` for numbers, no mono). Icons: **lucide-react** for UI + **react-icons** for brand/source logos (no hand-authored SVGs). Tooling: Tailwind v4 + shadcn/ui (`new-york`/`stone`) — not yet installed. — Lock the visual language before building UI. (design.md)
- **2026-06-19** — Scaffolded the monorepo from `create-turbo@latest --example with-nestjs` (npm workspaces). Example ships `packages/{api,ui,eslint-config,jest-config,typescript-config}` — kept as-is for now; `packages/database` (Prisma) is a planned addition and the example `links` demo will be replaced. `npm run build` is green. — Get a working Next.js + NestJS Turborepo baseline. (code-structure.md)
- **2026-06-19** — Set `strictPropertyInitialization: false` in `packages/typescript-config/nestjs.json`. — Idiomatic NestJS: decorator-based entities/DTOs declare properties without initializers; the rest of `strict` stays on. Without it the example failed to build (TS2564). (code-structure.md)
- **2026-06-19** — Split the monolithic `trackjob_ai_context.md` into per-topic docs (Product / db-schema / agents / code-structure) + blank readme/design, and added this CLAUDE.md router. — Keep context focused; agent reads only what a task needs. (all docs)
- **2026-06-19** — Status updates are a separate flow from creating an application: the status-update textarea lives inside the job **detail view** (`POST /applications/:id/status/extract`), not the add form; `/applications/extract` no longer does new-vs-update detection. — Clearer UX; the app is already known from the URL so the AI prompt is simpler and more accurate. (Product.md, code-structure.md, agents.md)
- **2026-06-19** — App is **multi-tenant** via Supabase Auth; every top-level model carries `userId`, the API uses a `SupabaseAuthGuard`, cross-tenant access returns `404`. No Prisma `User` model — `userId` is the Supabase UUID string. — Move from single-user MVP to real multi-user. (db-schema.md, code-structure.md, Product.md)
- **2026-06-19** — Richer `UserProfile` with **CV upload + AI extraction** (`WorkExperience`, `Education`, identity/summary/links/certifications/languages, `cvParseStatus`); CV files stored in a private Supabase Storage bucket; extraction returns a review-before-save draft. — A complete profile drives better skill matching. (db-schema.md, agents.md, code-structure.md, Product.md)
- **2026-06-19** — Work/education dates stored as **strings**, not `DateTime`. — CVs format dates inconsistently ("Mar 2021", "Present"); coercion would lose data. (db-schema.md)
