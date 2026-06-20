# Deploying ApplyWise

Two deployable apps in one Turborepo. The split that fits the stack:

| Piece | Where | Why |
|---|---|---|
| `apps/web` (Next.js) | **Vercel** | First-class Next.js + Turborepo support |
| `apps/api` (NestJS) | **Railway** or **Render** | A long-lived Node server wants a persistent host, not serverless |
| Postgres + Auth | **Supabase** | Already hosted; nothing to deploy |

Config files included: [`apps/web/vercel.json`](apps/web/vercel.json), [`railway.json`](railway.json), [`render.yaml`](render.yaml).

Deploy the **API first** — you need its public URL for the web app's `API_URL`.

---

## 1. API → Railway (or Render)

Turbo builds `@repo/database` (runs `prisma generate`) and `@repo/api` before `api`, so a plain source build works — no Dockerfile needed.

**Railway:** New Project → Deploy from repo. `railway.json` already sets:
- build: `npx turbo run build --filter=api`
- start: `node apps/api/dist/main.js`
- healthcheck: `/health`

**Render:** New → Blueprint → pick the repo; it reads `render.yaml`.

**Env vars** (set in the dashboard):

| Var | Value |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (port 6543, `?pgbouncer=true`) |
| `SUPABASE_JWKS_URL` | `https://<project>.supabase.co/auth/v1/.well-known/jwks.json` |
| `GROQ_API_KEY` | your Groq key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

Don't set `PORT` — the platform injects it and `main.ts` reads `process.env.PORT`.

## 2. Web → Vercel

New Project → import the repo → **Root Directory = `apps/web`** (enable "include files outside the root directory" so the workspace packages are available). Vercel installs at the repo root and builds via Turbo automatically. `vercel.json` adds `turbo-ignore` so a push that doesn't touch the web app (or its deps) skips the build.

**Env vars:**

| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `API_URL` | the deployed API URL, e.g. `https://applywise-api.up.railway.app` |

No CORS setup needed: the web app calls the API **server-side** (`apiFetch`), so the browser never hits it cross-origin.

## 3. Supabase (one-time)

- **Auth → URL Configuration:** set **Site URL** to the Vercel domain and add `https://<domain>/auth/callback` to **Redirect URLs** (the Google/OAuth callback is on `localhost:3000` for dev only).
- **Migrations:** the schema is already applied to the shared DB. For a fresh database, run `cd packages/database && npx prisma migrate deploy` (uses `DIRECT_URL`, port 5432) once.

## 4. After first deploy

- Rotate the `GROQ_API_KEY` and DB password that ship in `*.env.example` before the repo is public.
- Tighten `app.enableCors()` in `apps/api/src/main.ts` to the web origin if you ever add client-side API calls.
