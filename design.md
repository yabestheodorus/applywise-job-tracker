# Design System

The visual language for ApplyWise. **Warm & friendly, light-first (ships dark too), emerald accent on a warm stone neutral base.** Color on the board is *restrained* — neutral surfaces with thin colored accents, never full tints.

> Status: **Installed** in `apps/web` — Tailwind v4 + shadcn/ui (`radix-nova` style, `stone` base) with this emerald/stone theme and the Plus Jakarta Sans + Cal Sans fonts wired in `globals.css` / `layout.tsx` (plus the 2026-06-24 identity layer — brand gradient, layered shadows, ambient glow; see §5). Remaining UI wiring (themes toggle, dnd-kit, etc.) is tracked in the Setup checklist at the bottom.

## 1. Principles
1. **Calm by default, color with intent.** Neutral canvas; color earns attention (brand action, urgency, stage). A board of 15+ cards must stay scannable.
2. **Density where it counts.** Comfortable card interiors, compact board chrome — you should see 3–4 columns at once.
3. **Never rely on color alone.** Stages and urgency always pair color with an icon or label (user-picked stage colors can't be trusted for contrast or meaning).
4. **Draft → review → confirm.** AI output is always shown as an editable draft, visually marked as "suggested," never silently applied.
5. **One accent.** Emerald is for interactive/brand only. It does not double as a status color.

## 2. Foundations & tooling
- **Tailwind CSS v4** (CSS-first config, `@theme`) + **shadcn/ui** (style: `new-york`, base color: `stone`).
- **Theming:** CSS variables on `:root` / `.dark`, toggled with a small in-house theme provider (`components/theme/` — `ThemeProvider`/`useTheme` + a `ThemeScript` that injects the no-flash script via `useServerInsertedHTML`; replaced `next-themes`). Default to **system**, but light is the primary design target. shadcn token names (`--background`, `--foreground`, `--primary`, …) so components inherit automatically.
- **Icons:** `lucide-react` for UI/system icons (chevrons, status, actions). **`react-icons`** for brand/source logos (WhatsApp, LinkedIn, Glints, JobStreet, GitHub, etc. — use its Simple Icons `si*` set) and anywhere a real logo is needed. **Don't hand-author SVG files** — pull from these libraries.
- **Forms:** `react-hook-form` + `zod` (shared schemas from the types/API package).
- **Drag & drop (Kanban):** `@dnd-kit/core` + `@dnd-kit/sortable` (keyboard-accessible).
- **Toasts:** `sonner`.

## 3. Color

### Neutrals — warm **stone**
`stone-50 #fafaf9 · 100 #f5f5f4 · 200 #e7e5e4 · 300 #d6d3d1 · 400 #a8a29e · 500 #78716c · 600 #57534e · 700 #44403c · 800 #292524 · 900 #1c1917 · 950 #0c0a09`

### Brand — **emerald** (interactive only)
`emerald-50 #ecfdf5 · 400 #34d399 · 500 #10b981 · 600 #059669 · 700 #047857`

### Semantic tokens (shadcn variables)

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#fafaf9` stone-50 | `#0c0a09` stone-950 | app canvas |
| `foreground` | `#1c1917` stone-900 | `#f5f5f4` stone-100 | primary text |
| `card` | `#ffffff` | `#1c1917` stone-900 | cards, panels |
| `muted` | `#f5f5f4` stone-100 | `#292524` stone-800 | subtle surfaces |
| `muted-foreground` | `#78716c` stone-500 | `#a8a29e` stone-400 | meta text |
| `border` / `input` | `#e7e5e4` stone-200 | `#292524` stone-800 | borders, inputs |
| `primary` | `#059669` emerald-600 | `#10b981` emerald-500 | primary buttons, links, active |
| `primary-foreground` | `#ffffff` | `#0c0a09` | text on primary |
| `secondary` | `#f5f5f4` stone-100 | `#292524` stone-800 | secondary buttons |
| `accent` | `#f5f5f4` stone-100 | `#292524` stone-800 | hover surfaces (neutral) |
| `ring` | `#10b981` emerald-500 | `#10b981` emerald-500 | focus ring |
| `destructive` | `#dc2626` red-600 | `#ef4444` red-500 | destructive actions |

### Status & urgency palette (separate from brand)
Applied as **tinted badge/chip** (`{bg-50} {text-700} {border-200}`; dark: `{bg-950} {text-300}`), never as a primary fill.

| Meaning | Color | Where |
|---|---|---|
| Success — Offer, matched skills | emerald (`emerald-50` / `emerald-700`) | skill-match chips, Offer badge |
| Warning — follow-up upcoming / due soon | amber (`amber-50` / `amber-700`, `#f59e0b`) | date chip |
| Danger — overdue, rejected, gap skills | red (`red-50` / `red-700`, `#dc2626`) | date chip, gap-skill chips |
| Info — neutral notices | sky (`sky-50` / `sky-700`, `#0ea5e9`) | banners, hints |

> **Avoiding the green-on-green collision:** brand emerald only appears as *solid fills* (buttons/links). Success (Offer, matched skills) only appears as *tinted chips* + a check icon. Same hue family, different treatment → reads as intentional, not confusing.

### Urgency rule (follow-up / deadline dates)
Driven by date math, **independent of stage color**, shown on the date chip only:
- **Overdue** → red chip + `AlertCircle` icon
- **Upcoming** (within the follow-up threshold) → amber chip + `Clock` icon
- Otherwise → muted chip
An overdue card reads red in *any* column.

### User-customizable `StatusStage.color`
Every stage carries a user-picked hex (default `#94a3b8`). To stay restrained **and** legible:
- **Card:** 3px left border (`border-l-[3px]`) in the stage color.
- **Column header:** a colored dot + label + count; a 2px underline in the stage color.
- **Status badge:** colored dot + label on a `muted` background — **text is always `foreground`/`muted-foreground`, never on the raw hex** (user hexes fail contrast unpredictably).
- **Terminal stages** add an icon, since color alone can't convey user-defined meaning: Offer → `CheckCircle2`, Rejected → `XCircle`, Ghosted → `Ghost`.
- Stage color is **never** used as a full card/column background (that's the "color-forward" look we rejected).

## 4. Typography
- **Headings / display:** **Cal Sans** (weight 600). Friendly, characterful. Use for page titles, section headers, card-detail titles, empty-state headlines.
- **Body / UI:** **Plus Jakarta Sans** (geometric humanist — warmer and more distinctive than the default Inter it replaced as of 2026-06-24). All body copy, labels, buttons, inputs, table cells.
- **Numbers:** no mono font — use the body font with `tabular-nums` (`font-variant-numeric: tabular-nums`) for salaries, counts, dates, timestamps so columns align.

| Role | Font | Size / line | Weight |
|---|---|---|---|
| Display / H1 | Cal Sans | 30/36 px (1.875rem) | 600 |
| H2 | Cal Sans | 24/32 px | 600 |
| H3 | Cal Sans | 20/28 px | 600 |
| Section label | Inter | 13 px, uppercase, tracking-wide | 600 |
| Body (UI default) | Inter | 14/20 px | 400 |
| Body (long-form) | Inter | 16/24 px | 400 |
| Small / meta | Inter | 12/16 px, `muted-foreground` | 400–500 |

Load via `next/font`: Inter (`next/font/google`), Cal Sans (`next/font/google` — now available — or `next/font/local`). Expose as `--font-sans` (Inter) and `--font-display` (Cal Sans); map Tailwind `font-sans` / `font-display`.

## 5. Spacing, radius, elevation
- **Spacing:** 4px base. Common steps: 4, 8, 12, 16, 24, 32, 48. Card padding `16px` (`p-4`). Card-to-card gap `12px`. Page gutter `24px`.
- **Radius:** `--radius: 0.85rem` (~14px, on the rounder side for warmth — bumped from 0.75rem on 2026-06-24 for a softer, more modern feel). Cards/badges `rounded-2xl`, controls/inputs `rounded-lg`, chips/pills `rounded-full`.
- **Elevation (light):** soft, stone-tinted, **layered**. Custom utilities in `globals.css`: `shadow-card` (resting) → `shadow-card-hover` (hover/drag, paired with a `-translate-y-0.5` lift) → `shadow-brand` (emerald-tinted glow under the gradient icon badges + primary CTA hover). **Dark mode** uses deeper black-tinted versions of the same tokens.
- **Borders:** 1px `border` for separation; the 3px stage accent is the only "heavy" border. Cards carry a hairline `ring-1 ring-foreground/10`.

### Identity layer (added 2026-06-24)
The base palette stays warm-stone + emerald, but the product now has a distinct visual signature beyond flat surfaces:
- **Brand gradient:** `--brand-from` (emerald-600) → `--brand-to` (teal-600), exposed as `bg-gradient-brand` / `text-gradient-brand` utilities + the `brand-from`/`brand-to` Tailwind colors. Drives the **primary button** (gradient + `shadow-brand` glow on hover), every **page-header icon badge** (`PageHeader` component), and the templates hero badge.
- **Ambient page glow:** `--app-glow` — three faint fixed radial gradients (emerald top-left, teal top-right, amber bottom) painted on `body`, so the canvas reads as crafted rather than a flat fill.
- **Sidebar identity:** grouped nav (Workspace / Library) with section labels, each item an icon-in-a-rounded-container + an emerald active accent bar; a footer "AI-powered" gradient tip card. Sidebar surface is a hair warmer than the canvas.
- **Polish:** themed slim scrollbars, emerald text-selection, tightened heading tracking (`-0.02em`), `bg-dots` texture utility for hero/empty surfaces.

## 6. Layout & key screens
- **App shell:** top bar (logo wordmark in Cal Sans, global "+ Add application", theme toggle, profile avatar) + content. Max width `max-w-screen-2xl`, gutter `px-6`.
- **Kanban board** (home): horizontally scrollable columns, each `w-80` (320px), sticky header (dot + label + count + "+"). Columns reorder via dnd-kit; cards drag between columns. Empty column = dashed placeholder.
- **Application card:** company (Inter semibold) · role (muted) · stage badge · source icon · date chip (urgency-colored) · 3px stage left-border · `⋯` menu on hover.
- **Application detail** (route page; `Sheet` side panel on mobile): header (company/role/stage) → **Tabs**: *Overview* (salary, dates, notes, requirements), *Timeline* (StatusEvent vertical timeline w/ mono-aligned timestamps), *Skill match* (matched = emerald chips, gap = red chips, rationale). Detail also hosts the **status-update textarea** (paste → extract → review suggested stage → confirm).
- **Add application:** `Dialog` → paste `Textarea` → "Extract" → editable draft form (fields marked "AI suggested") → Confirm.
- **Profile:** Tabs (*Profile* · *Experience* · *Education* · *Templates*). CV upload = dropzone + `Progress` reflecting `cvParseStatus` (PROCESSING→COMPLETED/FAILED); extracted data opens in a review-draft dialog before save.
- **Stage manager:** dialog listing stages (drag to reorder) with inline rename + color swatch `Popover`.

## 7. Components (shadcn inventory)
Button · Card · Badge · Input · Textarea · Label · Select · Form · Dialog · Sheet · Tabs · Tooltip · DropdownMenu · Popover · Command (quick add/search) · Avatar · Separator · Skeleton (loading) · Progress (CV parse) · Sonner (toasts). Custom: `StatusBadge`, `UrgencyDateChip`, `KanbanColumn`/`KanbanCard`, `Timeline`, `SkillMatch`, `StageColorPicker`, `AiDraftForm`.

## 8. Motion
- Hover/press: 150ms ease-out. Dialogs/sheets: 200ms. Drag: dnd-kit transform, lifted card gets `shadow-md` + slight scale.
- Always honor `prefers-reduced-motion` (disable transforms/scale, keep instant state changes).

## 9. Accessibility
- Text contrast ≥ **WCAG AA** (4.5:1 body, 3:1 large). Tinted chips use `*-700` text on `*-50` to stay safe.
- **Never color-only:** stages + urgency always carry an icon/label.
- `focus-visible` → 2px emerald ring, 2px offset. Dialogs trap focus; Kanban drag has keyboard alternative (dnd-kit).
- Hit targets ≥ 40px for primary actions, ≥ 24px minimum.

## 10. Setup checklist (when wiring the UI)
- [x] Tailwind v4 + `shadcn@latest init` (style `radix-nova`, base `stone`); `--primary` = emerald, `--radius` = `0.75rem` in `globals.css` (light + dark).
- [x] Fonts wired in `app/layout.tsx` — Inter → `--font-sans`, Cal Sans → `--font-heading`.
- [x] In-house theme provider (`components/theme/`, default `system`) — `ThemeProvider`/`useTheme` + `ThemeScript` (no-flash via `useServerInsertedHTML`).
- [ ] Add `@dnd-kit/*`, `sonner`, `react-icons`, `react-hook-form`, `zod` (lucide-react already in via shadcn).
- [ ] Replace the example home page / remove leftover CSS modules.
