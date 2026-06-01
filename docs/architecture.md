# Spaceful — Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router, TypeScript strict |
| Database | Supabase (Postgres + Auth + RLS) |
| Styling | CSS custom properties (design tokens) + Tailwind layout utilities |
| AI | Claude Haiku 4.5 (generation, prompts, moderation pre-screen) |
| Billing | Stripe + Supabase RPCs (`deduct_credits` / `grant_credits`) |
| Email | Resend |
| Icons | lucide-react (1.5px stroke) |

---

## Route tree

```
/                          (marketing)/page.tsx        — landing, gallery-as-hero + Space of the Week
/gallery                   (marketing)/gallery/page.tsx — public gallery, mood + tag filter in URL

/login                     (auth)/login/page.tsx
/signup                    (auth)/signup/page.tsx

/spaces                    (app)/spaces/page.tsx        — auth required
/spaces/new                (app)/spaces/new/page.tsx    — credit-gated
/onboard                   (app)/onboard/page.tsx       — no app nav, immersive 5-step flow
/account/credits           (app)/account/credits/page.tsx

/admin                     (admin)/admin/page.tsx       — admin role check, Space of the Week button
/admin/templates           (admin)/admin/templates/page.tsx — spec editor + live preview
/admin/moderation          (admin)/admin/moderation/page.tsx

/:username                 [username]/page.tsx          — primary space (is_primary = true)
/:username?tab=journal     [username]/page.tsx          — Journal tab: pulse timeline, AI letters
/:username?tab=companion   [username]/page.tsx          — Companion tab (owner only)
/:username?tab=journal&view=timeline  — Space evolution timeline (owner only)
/:username/:slug           [username]/[slug]/page.tsx   — secondary spaces
```

**API routes:**

```
POST /api/reactions          — visitor knock submission (message / energy / goal_cheer)
GET  /api/pulse              — pulse entries + streak for Journal tab
GET  /api/companion/daily    — today's cached companion message (lazy-generate if missing)
POST /api/companion/chat     — on-demand companion chat (SSE stream, 0.1 credits)
POST /api/cron/weekly-digest — weekly email digest (Vercel Cron, Sunday 18:00 UTC)
POST /api/cron/monthly-snapshot — monthly content_json snapshot (1st of month, 00:01 UTC)
POST /api/cron/monthly-letter   — monthly AI letter generation (2nd of month)
GET  /api/unsubscribe        — one-click email opt-out via signed HMAC token
```

---

## Template Engine

The core architectural decision: templates are **JSON specs stored in the DB**, rendered by a single trusted React component (`SpecRenderer`). No template is a `.tsx` file; adding a new visual is a DB row + a registered component, not a deployment.

### TemplateSpec shape

```typescript
interface TemplateSpec {
  version: 1;
  layout: {
    header_style: 'botanical' | 'cosmic' | 'minimal' | 'editorial' | 'wave' | 'nature' | 'geometric' | 'aurora';
    sections: SectionId[];   // ordered, rendered top-to-bottom
    max_width: 860 | 980 | 1100;
    density: 'spacious' | 'balanced' | 'rich';
  };
  decoration: {
    type: DecorationId;
    density: 'minimal' | 'medium' | 'lush';
    animated: boolean;
    fixed_background: boolean;
  };
  scene?: {
    image: string;           // path to preview image, e.g. /templates/garden-anime.jpg
    position: 'center' | 'left' | 'right';
    overlay: 'light' | 'medium' | 'dark';
  };
  cards: {
    style: 'glass' | 'solid' | 'outlined' | 'paper';
    radius: 8 | 12 | 16 | 20 | 24;
    shadow: 'none' | 'soft' | 'medium' | 'dramatic';
  };
  typography: {
    title_scale: 'lg' | 'xl' | '2xl' | 'display';
    weight: 700 | 800;
    header_uppercase: boolean;
  };
}
```

### Spec resolution

A space's `design_tokens` stores `template_id` (the base template slug) and an optional `spec_override` (partial spec fields that deep-merge over the base at render time). This means:

- Fixing a bug in a base template propagates to all spaces built on it.
- AI-generated personalisation lives in `spec_override`, not a forked template.
- New users start with a complete base template and receive a spec_override tailored to their inputs.

```
Base template spec (from space_templates table)
  + spec_override (from spaces.design_tokens)
  = resolved TemplateSpec (via mergeSpec() in engine/utils.ts)
```

### Component registries

```
src/components/space/engine/
  SpecRenderer.tsx        — single trusted renderer
  types.ts                — TemplateSpec, SectionId, DecorationId, SectionProps, DecorationProps
  utils.ts                — hexA(), isDarkMood(), mergeSpec(), resolveSpec(), paletteFor()
  cards.ts                — cardStyle() — produces CSSProperties from spec + palette
  typography.ts           — titleFontSize() — maps title_scale to px value
  templateCatalog.ts      — TEMPLATES list, pickTemplate(mood, vibes) scoring function
  decorations/
    index.tsx             — DECORATIONS registry: Record<DecorationId, ComponentType>
                            Implementations: Botanicals, Starfield, Waves, Dunes,
                            Aurora, Geometric, Rain, Clouds, Minimal
  sections/
    index.tsx             — SECTIONS registry: Record<SectionId, ComponentType>
                            Implementations: Goals, Currently, FocusHero, Notepad,
                            Kanban, HabitTracker, ReadingList, Quote, Photo, Streak
```

**Safety boundary:** Spec fields are validated enums and numbers. No spec field accepts arbitrary HTML or JS. Claude outputs enum values; the renderer maps them to registered React components. XSS surface is zero.

---

## AI Generation Pipeline

### Endpoint: `POST /api/generate`

Streaming SSE endpoint. Returns `data: {...}` events with `stage` (progress label), optional `progress` (0–1), and a final `tokens` payload on `stage: 'done'`.

**Flow:**

```
Client POSTs { name, vibes, goal, mood, layout, template_id? }
  │
  ├─ Validates with InputSchema (Zod)
  │
  ├─ Builds prompt with user inputs + base palette hint + template hint
  │
  ├─ Streams Claude Haiku 4.5 response
  │    └─ Emits fake stage progress events as tokens arrive (~180 chars each)
  │
  ├─ Parses raw JSON from response
  │
  ├─ Validates with TokenSchema (Zod)
  │    ├─ Valid → emit { stage: 'done', tokens }
  │    └─ Invalid → retry once with validation errors in conversation
  │              ├─ Valid → emit { stage: 'done', tokens }
  │              └─ Still invalid → emit fallback tokens (mood-based defaults)
  │
  └─ Always close stream in finally block
```

**Output tokens shape:**
```typescript
{
  mood: SpaceMood;
  layout_variant: 'spacious' | 'rich';
  animation_level: 'none' | 'subtle' | 'full';
  template_id: string;          // user choice or pickTemplate(mood, vibes)
  spec_override: TemplateSpecOverride;  // layout + decoration + cards + typography
  palette: SpacePalette;        // AI-generated hex values
  tagline: string;
  hero_title_placeholder: string;
  notepad_starter: string;
  currently_placeholder: string;
}
```

**Template selection logic:**
- If user chose a template in onboarding → `template_id = input.template_id`, prompt tells Claude to honour its spirit
- If user chose "Let AI surprise me" → `template_id = pickTemplate(mood, vibes)` (scoring function: +3 for mood affinity match, +2 per vibe keyword match)

---

## Onboarding Flow

Five-step wizard at `/onboard`, immersive full-screen, no app nav.

```
Step 0 — Name          → state.name
Step 1 — Vibes         → state.vibes (max 3 from VIBES list)
Step 2 — Goal          → state.goal (optional, max 80 chars)
Step 3 — Colour mood   → state.mood (6 palettes, live MiniSpace preview)
Step 4 — Template      → state.templateId + state.layout (density toggle)
                          6 thumbnail cards + "Let AI surprise me"
                          → triggers startGeneration()
```

`startGeneration()` opens an SSE connection to `/api/generate`, reads stage events, shows animated progress UI, then transitions to a publish screen with a `MiniSpace` preview. Publish calls `publishSpace` server action which deducts 3 credits atomically and creates the space row.

---

## Credit Flow

```
User triggers credit action (e.g. publish space)
  │
  ├─ Server action verifies auth + profile exists
  ├─ Calls deduct_credits RPC (service role key)
  │    ├─ SELECT profile FOR UPDATE (row lock)
  │    ├─ balance < delta → raise insufficient_credits
  │    ├─ UPDATE profiles SET credit_balance = balance - delta
  │    └─ INSERT credit_transactions row
  └─ Action proceeds (space created, theme regenerated, etc.)
```

Rule: **any action costing ≥ 1 credit shows a confirmation modal** before deducting. The modal is rendered client-side; the actual deduction only happens in the server action.

---

## Space Rendering

```
/:username page.tsx (Server Component)
  │
  ├─ Fetch profile by username
  ├─ Fetch primary space (is_primary = true)
  ├─ Fetch template spec from space_templates WHERE slug = design_tokens.template_id
  ├─ Fetch reactions (owner: all; visitor: is_visible = true only)
  └─ Render <SpaceView> with space, reactions, templateSpec, isOwner, creditBalance

SpaceView (Client Component)
  ├─ Manages edit mode, modals, template switching
  └─ Renders <SpecRenderer>
       ├─ Resolves final spec: templateSpec ?? resolveSpec(template_id, spec_override)
       ├─ Applies CSS custom properties (--sp-bg, --sp-accent, etc.) as inline vars
       ├─ Renders <Decoration> component from DECORATIONS registry
       ├─ Renders header with scene image / botanical / wave elements
       └─ Maps spec.layout.sections → <Section> components from SECTIONS registry
            └─ Each section: receives content, tokens, spec, editing, onUpdate, styles
               └─ onUpdate → commit() → onSave() → saveSpaceContent server action
```

**Animation rule:** Animate `transform` only for entrance. Never gate `opacity: 1` on an animation that starts at `opacity: 0` — it breaks in backgrounded tabs.

---

## CSS Token System

Two token namespaces:

- `--app-*` — app chrome (nav, modals, buttons, backgrounds outside the space)
- `--sp-*` — per-space theme (injected as inline vars by SpecRenderer from the resolved palette)

Space tokens: `--sp-bg`, `--sp-bg2`, `--sp-surface`, `--sp-accent`, `--sp-accent2`, `--sp-text`, `--sp-text2`, `--sp-muted`, `--sp-border`, `--sp-glow`, `--sp-chip-bg`, `--sp-done-bg`, `--sp-anim-speed`

`--sp-anim-speed` — injected by SpecRenderer as `1.0` daytime, `0.65` evenings (19:00+) and late night (before 05:00). All header animation durations reference `calc(Ns / var(--sp-anim-speed, 1))`. Decorations slow down at night without any component changes.

---

## Engagement & Retention System

The engagement layer is built on four behavioral mechanics: **trigger** (time-aware state, weekly email), **simplest action** (2-sentence morning intention), **variable reward** (companion message, AI letter), and **investment** (content that compounds into a private life record).

### Tab Navigation

`/:username` renders three tabs via URL search param (`?tab=`):

```
[  Space  ]  [  Journal  ]  [  Companion  ]
 Default       Pulse timeline  AI advisor
               AI letters      Chat history
               Snapshots
```

`useSearchParams()` requires a `<Suspense>` boundary in Next.js 15 App Router. `TabNav` is wrapped in `<Suspense fallback={<TabNavSkeleton />}>` in SpaceView.

### Daily Pulse

New section type (`daily_pulse`) in the section registry. Two render modes:
- **Quick entry** (Space tab): shows today's morning/evening prompts only
- **Full timeline** (Journal tab): all entries chronologically, newest first, with AI letters pinned

Streak scans `daily_pulse_entries` backwards from **yesterday**, max 365 rows. Today is always "in progress" — prevents morning-anxiety bug (streak showing 0 before user has logged).

### Space Companion

Five archetypes (stoic / coach / poet / sage / challenger) inferred from mood + vibes at onboarding. Stored in `design_tokens.companion_archetype`.

Context assembly (server-side, ~600 tokens):
- Archetype tone instructions
- Current goals + completion status
- Habit completion rate this week
- Focus hero title
- Last 7 pulse entries (truncated to 100 chars each)
- Reading list titles
- Mood + vibes

**Daily message**: lazy-generated on first visit of the day. `GET /api/companion/daily` checks `companion_daily` table for `(space_id, today)`. Cache hit = instant. Cache miss = Claude Haiku generation (~2s) + cache. Free. Loading skeleton shown during generation.

**Chat**: `POST /api/companion/chat` streams SSE response (same pattern as `/api/generate`). Costs 0.1 credits via `deduct_credits(action='companion_chat')`.

**Semantic quote**: pgvector similarity search against `quotes` table. Goal text embedded at request time, `ORDER BY embedding <-> $goal_embedding LIMIT 1`. Prevents keyword-matching errors (e.g. "movement" matching political-movement quotes instead of physical-recovery quotes).

### Visitor Knocks

Three types: `message` (text), `energy` (one-tap, no text), `goal_cheer` (targets a specific goal). Rate limiting is DB-based via `SELECT COUNT(*)` on the `reactions` table — in-memory maps don't survive Vercel serverless instances.

Weekly digest email (Resend, Sunday 18:00 UTC) summarises new knocks and space stats. Opt-out stored in `profiles.email_digest_opted_out`; unsubscribe link uses HMAC-signed token, no login required.

### Monthly AI Letter

On the 2nd of each month, Claude reads the diff between last month's `space_snapshots` row and this month's, then writes a warm 5-sentence letter referencing actual data (goals completed, habit rate change, notepad themes). Stored as a `daily_pulse_entries` row with `period = 'ai_letter'` and delivered via Resend. Snapshot cron (1st of month) batches 100 spaces per iteration using `WHERE NOT EXISTS` cursor — idempotent, timeout-safe.

### Remix Gallery

Gallery replaced from mock data to real DB queries. Mood + vibe filter. One-click Remix copies `template_id + spec_override` to viewer's space (content_json untouched). `remix_count` incremented on source space. Space of the Week featured on landing page with Claude-generated spotlight text.

## Admin

`/admin` is a role-checked server component (checks `profiles.role = 'admin'`).

- **`/admin/templates`** — `TemplateEditor`: sidebar list of templates, JSON spec textarea, live `SpecRenderer` preview. CRUD via `/api/admin/templates` (GET / POST / PUT / DELETE), each endpoint calls `requireAdmin()` which re-checks role server-side.
- **`/admin/moderation`** — gallery submission queue.
- **`/admin`** — platform settings and stats.

---

## Component Registry (additions)

```
src/components/space/
  TabNav.tsx              — tab bar (Space / Journal / Companion), URL-driven
  JournalTab.tsx          — full pulse timeline + AI letters + snapshot timeline
  CompanionTab.tsx        — daily message, semantic quote, chat input, interaction history
  TimelineView.tsx        — horizontal scroll of monthly snapshot cards

src/app/api/
  reactions/route.ts      — POST: knock submission with DB rate limiting
  pulse/route.ts          — GET: pulse entries + streak calculation
  companion/
    daily/route.ts        — GET: lazy companion daily message (cache hit/miss)
    chat/route.ts         — POST: SSE companion chat (0.1 credits)
  cron/
    weekly-digest/route.ts   — weekly email digest
    monthly-snapshot/route.ts — monthly content_json snapshot (batched)
    monthly-letter/route.ts  — monthly AI letter generation
  unsubscribe/route.ts    — one-click email opt-out via HMAC token

emails/
  WeeklyDigest.tsx        — React Email template: knocks + space stats
  MonthlyLetter.tsx       — React Email template: AI letter delivery

src/data/
  quotes.json             — ~300 curated quotes seeded into quotes table
```

## Key Conventions

- `numeric(6,2)` for all credit values — never int. Fractional costs (0.25, 0.5) exist.
- `deduct_credits` / `grant_credits` RPCs for all balance changes — never direct `UPDATE`.
- Rate-limit reactions (3/space/IP/hour) in the server action — not in RLS.
- `/:username` always resolves `is_primary = true`; username is permanent.
- Supabase client: `createClient()` for user-context requests, `createServiceClient()` for RPC calls requiring elevated privileges.
- `(supabase as any)` casts appear throughout because `pnpm db:types` regenerates `types.ts` from the live schema — the cast avoids blocking dev on a local Supabase instance not being up.
