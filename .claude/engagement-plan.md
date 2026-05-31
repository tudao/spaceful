# Spaceful — Engagement & Retention Plan
_Authored 2026-05-31_

---

## Why the current space isn't enough

The space is beautiful, but static. It looks identical at 8am Monday and 11pm Friday. There is no external pull (no email, no notification), no changing reward, no compounding return on the content users add. Without these, even a user who loves their space will stop opening it within two weeks.

The four mechanics every sticky daily product needs:

| Mechanic | Current state | Target |
|---|---|---|
| **Trigger** | None | Time-aware reminders, weekly digest email |
| **Simplest action** | Edit content | 2-sentence morning intention |
| **Variable reward** | Always the same space | Companion advice, weekly synthesis, knock surprises |
| **Investment** | Content sits idle | Content feeds AI letters, companion context, streak |

---

## Design principles (incorporating MyCove)

After analysing the MyCove bootstrap concept alongside Spaceful, three of their decisions are worth adopting:

1. **Tabbed navigation within the space** — a single scroll breaks down once we add Daily Pulse entries, companion conversations, and more sections. Tabs let the visual space stay clean while deeper content lives one click away. Structure: `Space | Journal | Companion`.

2. **"AI-assisted, not AI-dependent"** — the core daily features (morning intention, evening reflection, habit logging) must be free or near-free. AI should assist personalisation and synthesis; the daily ritual must not cost credits. Keeps daily engagement cost-neutral.

3. **Remix as community moat** — MyCove identified community/remix as the stickiness layer. Rather than social graphs (which Spaceful deliberately avoids), one-click template remixing from the gallery creates a creative culture without feeds or follower counts.

---

## Feature list (priority order)

| # | Feature | Hook type | Effort | Retention driver |
|---|---------|-----------|--------|-----------------|
| 1 | Living Space — time-aware dynamic state | Internal trigger | Low | Immediate |
| 2 | Visitor Knocks + Weekly Digest email | External trigger | Medium | Acquisition pull |
| 3 | Daily Pulse — morning intention + evening reflection | Internal ritual | Medium | Strongest daily habit |
| 4 | Tabbed navigation (Space / Journal / Companion) | UX structure | Medium | Depth without scroll bloat |
| 5 | Space Companion — archetype AI advisor | Variable reward | Medium-High | Emotional attachment |
| 6 | Semantic Quote section | Variable reward (passive) | Low | Ambient delight |
| 7 | Remix Gallery + Space of the Week | Community flywheel | Medium | Growth + daily browse |
| 8 | Monthly AI Letter + Space Snapshots | Investment compounding | High | Long-term lock-in |

---

## Phase 1 — Living Space (time-aware dynamic state)
_Goal: Make the space feel alive on every visit. No new DB tables. Pure client-side._

### What changes

**Greeting header** — shows time-of-day greeting replacing static name display:
- 05:00–11:59 → "Good morning, {name}"
- 12:00–17:59 → "Good afternoon, {name}"
- 18:00–22:59 → "Good evening, {name}"
- 23:00–04:59 → "Late night, {name}"

**Day-of-week nudges** (owner-only, soft visual — not blocking):
- Monday: FocusHero section shows a soft ring + "Set your week" if `hero_title` is empty
- Friday: FocusHero shows "How did the week go?" badge if `hero_notes` is empty
- Sunday 20:00+: small "Week wrapping up" state indicator in header

**Habit tracker — today glow**: Current day's column in HabitSection gets `--sp-accent` glow ring animation. Makes unchecked cells feel like a gentle tap on the shoulder.

**Kanban — current week auto-surfaces**: KanbanSection reads the current ISO week number and renders the matching card first (already visible in viewport, no arrow needed). Shows "Week {N} of 52" badge.

**Decoration speed shift**: Add a `--sp-anim-speed` CSS variable injected by SpecRenderer. Value is `1.0` daytime, `0.65` evening (after 19:00). Decorations multiply their animation durations against it. Botanicals, waves, aurora all slow down at night.

**Ambient player enhancement**: In evening mode (after 19:00), AmbientPlayer auto-starts at 30% volume if user has previously started it in the same session. Opt-in pref stored in localStorage.

### Files to change

```
src/app/[username]/SpaceView.tsx
  — add useEffect for time-of-day state (greeting, nudge flags, animSpeed)
  — pass animSpeed into SpecRenderer as prop

src/components/space/engine/SpecRenderer.tsx
  — accept animSpeed prop, inject --sp-anim-speed CSS var

src/components/space/engine/sections/index.tsx (HabitSection, KanbanSection, FocusHeroSection)
  — HabitSection: highlight today's column
  — KanbanSection: auto-scroll to current week on mount
  — FocusHeroSection: accept nudgeEmpty prop, show ring when empty + Monday

src/components/space/AmbientPlayer.tsx
  — add evening auto-start logic with localStorage pref
```

### Success criteria
- [ ] Header greeting changes with time of day
- [ ] Habit tracker today's column visually distinct
- [ ] Kanban opens to current week, not W1
- [ ] Decorations visibly slower in evening mode
- [ ] No new DB tables, no new API routes

---

## Phase 2 — Visitor Knocks + Weekly Digest Email
_Goal: Build external pull that brings lapsed users back without being a social network._

### Knock types

Three knock types, each with zero friction for visitors:

```typescript
type KnockType = 'message' | 'energy' | 'goal_cheer';

interface Knock {
  id: string;
  space_id: string;
  type: KnockType;
  message?: string;       // message type only (1–140 chars)
  goal_id?: string;       // goal_cheer type only — references a goal
  visitor_ip_hash: string; // SHA256(ip + space_id), never raw IP
  is_visible: boolean;    // default false, owner approves
  created_at: string;
}
```

- **message** — standard short text
- **energy** — one tap, no text, no account. Shows as a glowing count on the space ("✦ 12 energies")
- **goal_cheer** — visitor picks a specific goal from the owner's space and writes a short note to it specifically

### DB changes

Extend `reactions` table (or rename to `knocks`):
```sql
alter table reactions
  add column type text not null default 'message'
    check (type in ('message', 'energy', 'goal_cheer')),
  add column goal_id uuid references spaces(id) on delete set null;
```

New migration: `supabase/migrations/003_knocks.sql`

Also add to `profiles` table in migration 003:
```sql
alter table profiles
  add column email_digest_opted_out bool not null default false;
```

New route: `GET /api/unsubscribe?token=xxx` — validates a time-limited HMAC token (HMAC-SHA256 of `user_id + expiry` using `RESEND_SIGNING_SECRET`), sets `email_digest_opted_out = true`. Token embedded in each digest email. No login required.

### API — complete the 501 stub

`src/app/api/reactions/route.ts` — implement:
- Rate limit: 3 knocks/space/IP/hour — **DB-based, not in-memory** (serverless: in-memory maps don't survive across function instances). Implementation: `SELECT COUNT(*) FROM reactions WHERE visitor_ip_hash = $1 AND space_id = $2 AND created_at > now() - interval '1 hour'` — no new table needed.
- `energy` type requires no message field
- `goal_cheer` requires `goal_id` + message
- Always hash IP: `SHA256(ip + space_id)`
- Return 201 on success, 429 on rate limit

### Weekly digest email

**New Resend email template**: `emails/WeeklyDigest.tsx` (React Email component)

Content:
- "N people knocked on your space this week"
- Preview of each visible knock (truncated to 80 chars)
- "Your space this week": habit completion %, goals done vs total, reading list count
- One CTA: "Open your space →"
- Opt-out link (one-click, no login)

**Cron job** (Supabase pg_cron or Vercel Cron — Sunday 18:00 UTC):
- `POST /api/cron/weekly-digest` — service role key required
- Queries all active spaces with `reactions_enabled = true` and at least one new knock in the past 7 days OR owner has not visited in 5+ days
- Sends digest to space owner's email via Resend

New files:
```
src/app/api/cron/weekly-digest/route.ts
emails/WeeklyDigest.tsx
```

New `vercel.json` cron entry or Supabase pg_cron schedule.

### Space UI changes

`src/components/space/ReactionForm.tsx` — add three buttons (message / energy / goal_cheer), goal picker dropdown when goal_cheer selected.

`src/app/[username]/SpaceView.tsx` — show energy count in header (opt-in setting), show approved knocks below space content.

### Success criteria
- [ ] Visitors can leave all three knock types
- [ ] Rate limiting works (3/hour)
- [ ] Energy knocks show as count on space
- [ ] Goal cheer shows attached to specific goal
- [ ] Weekly digest email sends via Resend
- [ ] Owner can approve/hide knocks from OwnerChrome

---

## Phase 3 — Daily Pulse + Tab Navigation
_Goal: Spaceful becomes the first thing opened in the morning. Journal tab holds the full history._

### Tab navigation structure

The space gets three tabs, added as a horizontal nav below the header:

```
[  Space  ]  [  Journal  ]  [  Companion  ]
```

- **Space** — the existing SpecRenderer with sections (default tab)
- **Journal** — Daily Pulse full timeline
- **Companion** — AI companion (Phase 4)

Tab state lives in URL: `/:username?tab=journal` — so a shared link can point to a specific tab. Default is `space`. Non-owners only see tabs the owner has content in (no empty Journal tab for visitors until owner has entries).

**Next.js 15 requirement**: `useSearchParams()` in a Client Component requires a `<Suspense>` boundary. Wrap `<TabNav>` in `<Suspense fallback={<TabNavSkeleton />}>` inside SpaceView. `TabNavSkeleton` is 3 lines — three muted pill shapes matching the tab width. Without this, Next.js 15 throws a build error.

Files:
```
src/app/[username]/SpaceView.tsx
  — add useSearchParams() for tab state, wrap TabNav in Suspense
  — render tab nav bar below header, above content
  — conditionally render Space / Journal / Companion content

src/components/space/TabNav.tsx  (new)
  — styled tab bar, reads activeTab, calls setTab
```

### Daily Pulse section

**New section type**: `daily_pulse` added to `SectionId` union.

**Two modes**:

1. **Quick entry** (shown in Space tab when section is in spec.layout.sections):
   - Shows today's two prompts only
   - Morning prompt: "What's your intention for today?" (shown 05:00–13:00)
   - Evening prompt: "How did today go? One thing you're proud of." (shown 13:00–00:00)
   - Each is a max 2-sentence textarea, saves on blur
   - Small streak indicator: "🔥 18-day pulse streak"

2. **Full timeline** (shown in Journal tab):
   - All entries displayed chronologically, newest first
   - Each day shows morning + evening paired, with date header
   - Read-only for visitors (owner controls visibility in settings)
   - Weekly synthesis cards (from Phase 4 AI synthesis) interspersed

**DB changes**:
```sql
create table daily_pulse_entries (
  id           uuid primary key default gen_random_uuid(),
  space_id     uuid not null references spaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  entry_date   date not null,
  period       text not null check (period in ('morning', 'evening')),
  body         text not null check (char_length(body) <= 280),
  created_at   timestamptz not null default now(),
  unique (space_id, entry_date, period)
);

-- RLS: owner reads/writes own entries; public read if space is public and owner opts in
```

New migration: `supabase/migrations/004_daily_pulse.sql`

**Pulse streak calculation**: calculated server-side in `GET /api/pulse` response. Scan `daily_pulse_entries` backwards from **yesterday** (not today), counting consecutive dates with at least one entry. Max scan: 365 rows. Today is always "in progress" — it never resets the streak, even before the user logs. This is the standard approach used by Duolingo, GitHub, and Notion to prevent the morning-anxiety bug (streak showing 0 before you've had a chance to log). Return as `{ streak: N, today_logged: boolean }` alongside the entries array.

**Server action**: `src/app/[username]/actions.ts`
- `savePulseEntry(spaceId, date, period, body)` — upsert into `daily_pulse_entries`
- Free — no credit cost. Daily ritual must never cost credits.

**API** (for Journal tab fetch):
```
GET /api/pulse?space_id=xxx&limit=30
```
Returns entries for timeline display.

### Files to create/change
```
supabase/migrations/004_daily_pulse.sql

src/components/space/TabNav.tsx              (new)
src/components/space/JournalTab.tsx          (new — full timeline view)
src/components/space/engine/sections/index.tsx
  — add DailyPulseSection (quick entry, today only)

src/app/[username]/SpaceView.tsx
  — add tab routing logic
  — render JournalTab when tab=journal

src/app/[username]/actions.ts
  — add savePulseEntry server action

src/app/api/pulse/route.ts                   (new — GET entries for timeline)
```

### Success criteria
- [ ] Tab nav renders, URL reflects active tab
- [ ] Morning prompt visible 05:00–13:00, evening 13:00+
- [ ] Entries save on blur, free of credit cost
- [ ] Streak counter increments on consecutive days
- [ ] Journal tab shows full timeline, newest first
- [ ] Visitors see Journal tab only if owner has entries + space is public

---

## Phase 4 — Space Companion (archetype AI advisor)
_Goal: A context-aware AI friend who knows your goals, habits, and pulse entries. Shown in the Companion tab._

### Archetype system

Five archetypes, selected during onboarding (Step 1 after name) or from Space Settings:

| ID | Name | Tone | Best for |
|---|---|---|---|
| `stoic` | The Stoic | Calm, honest, direct about hard truths | midnight, forest |
| `coach` | The Coach | Action-oriented, specific, energetic | ocean, lavender |
| `poet` | The Poet | Reflective, metaphorical, gentle | lavender, rose |
| `sage` | The Sage | Philosophical, long view, patient | sand, forest |
| `challenger` | The Challenger | Cuts through excuses, high standards | midnight, ocean |

Default archetype: inferred from mood + vibes at onboarding time (e.g. midnight + focused → stoic, lavender + dreamy → poet).

Stored in `spaces.design_tokens.companion_archetype` (string, no migration needed).

### Context building

Every companion interaction sends Claude a system prompt that includes:
- The archetype's tone instructions (2–3 sentences defining voice)
- Current goals (text + done status)
- Habit completion rate this week (e.g. "5/7 days")
- Current focus hero title
- Last 7 daily pulse entries (morning + evening, truncated to 100 chars each)
- Reading list titles
- Current mood + vibes

This context is assembled server-side from a single DB fetch. It's ~600 tokens — fits in Haiku's context at low cost.

### Interaction modes

**Daily message** (passive — shown at top of Companion tab):
- Generated **lazily on first visit** of the day: `GET /api/companion/daily` checks for a row in `companion_daily` with `(space_id, today's date)`. Cache hit returns immediately. Cache miss triggers Claude generation (~2s), caches the result, returns it.
- Show a loading skeleton (3 animated lines) during the ~2s generation. This is the same SSE streaming pattern as `/api/generate`.
- 3–5 sentences
- Based on context — no user prompt needed
- Costs 0 credits (free daily — this is a retention feature, not a premium feature)
- Cached in `companion_daily` table (space_id, date, archetype, message)

**On-demand chat** (active — user types a question):
- User types a question in Companion tab: "What should I focus on this week?"
- SSE streaming response from Claude Haiku
- Costs 0.1 credits per exchange (very cheap)
- Shows confirmation if balance < 1 credit
- History stored in `companion_interactions` table (last 20 shown)

### Semantic quote

The daily companion message ends with a curated quote matched to the user's goal text:
- Maintained as a JSON file: `src/data/quotes.json` — ~300 quotes, each with `text`, `attribution`, and an `embedding float[]` column
- **pgvector similarity search** (Supabase has pgvector built in): at build time, pre-compute embeddings for all quotes and store in a `quotes` table. At request time, embed the user's goal text (one Supabase Edge Function call) and run `ORDER BY embedding <-> $goal_embedding LIMIT 1`.
- This is required for quality: keyword matching on "pain-free movement" would match political-movement quotes. Semantic search correctly returns recovery, patience, and physical healing quotes.
- Migration: add `quotes` table with `embedding vector(1536)` column and `ivfflat` index. Seed from quotes.json at migration time.
- Quote appears below companion message, styled distinctly

No external quote API — fully owned content, no latency, no third-party dependency.

### DB changes

```sql
create table companion_daily (
  space_id   uuid not null references spaces(id) on delete cascade,
  date       date not null,
  archetype  text not null,
  message    text not null,
  quote_text text,
  quote_attr text,
  primary key (space_id, date)
);

create table companion_interactions (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  body       text not null,
  created_at timestamptz not null default now()
);

-- RLS: owner reads/writes own rows only. Visitors never see companion content.
```

New migration: `supabase/migrations/005_companion.sql`

**Important**: Migration 005 must also add `companion_chat` to the `action_type` enum **before** creating the `companion_interactions` table (Postgres enum extension order matters):
```sql
alter type action_type add value 'companion_chat';
```

### API

```
GET  /api/companion/daily?space_id=xxx
  — returns today's cached daily message, or generates + caches if missing

POST /api/companion/chat
  — body: { space_id, message }
  — auth required
  — deducts 0.1 credits
  — streams SSE response (same pattern as /api/generate)
  — appends user + assistant rows to companion_interactions
```

### Files

```
supabase/migrations/005_companion.sql

src/data/quotes.json                          (new — ~300 curated quotes with themes)

src/app/api/companion/daily/route.ts          (new)
src/app/api/companion/chat/route.ts           (new)

src/components/space/CompanionTab.tsx         (new)
  — daily message display
  — quote display
  — chat input + streaming response
  — interaction history (last 20)

src/app/(app)/onboard/page.tsx
  — add archetype picker (Step 1.5 between name and vibes, or in Step 4 settings)

src/components/space/SettingsDrawer.tsx
  — add archetype selector (5 options with tone preview)
```

### Example output

The Stoic companion, reading a space where the user has missed 4 of 7 habits and their goal is "pain-free movement":

> *"You logged three days. Not seven — three. That's the truth, and it's worth sitting with before you explain it away. The goal isn't to have a perfect record. It's to still be here next week, logging again. Your body doesn't need a streak. It needs you to show up."*
>
> — *"We suffer more often in imagination than in reality."* — Seneca

### Success criteria
- [ ] Archetype selected during onboarding and from settings
- [ ] Daily message generated once per day, cached, costs 0 credits
- [ ] On-demand chat streams, costs 0.1 credits
- [ ] Context includes goals, habits, pulse entries, mood
- [ ] Quote matched to goal themes from local quotes.json
- [ ] Companion tab hidden from visitors
- [ ] Chat history shows last 20 messages

---

## Phase 5 — Remix Gallery + Space of the Week
_Goal: Gallery becomes a daily browse destination. Remix creates the growth flywheel._

### Gallery overhaul

Current gallery serves mock data. Replace with real DB queries:

```
GET /gallery?mood=ocean&vibes=calm
  — queries spaces WHERE gallery_status = 'approved' AND visibility = 'public'
  — filters by mood + gallery_tags
  — paginated (20 per page)
  — sorted by: featured first, then recently published
```

Add to `spaces` table:
```sql
alter table spaces
  add column gallery_featured_at timestamptz,   -- set by admin when featuring
  add column remix_count int not null default 0; -- incremented on remix
```

### Space of the Week

Admin selects one approved public space per week as featured.

- `gallery_featured_at` set by admin via `/admin` UI (simple button: "Feature this space")
- Landing page hero shows the featured space with a 2-sentence spotlight
- Spotlight text: Claude generates it from the space's content_json (admin triggers, result cached in a `platform_settings` JSON column: `featured_space_spotlight`)
- Space owner receives an email: *"Your space was featured this week."*

### One-click Remix

On any public space, a "Remix this layout" button (visible to logged-in users):

1. Reads source space's `design_tokens.template_id` + `design_tokens.spec_override`
2. Applies them to the viewer's primary space (their content_json is untouched)
3. Saves via `saveDesignTokens` server action
4. Increments source space `remix_count`
5. Stores remix lineage in `spaces.design_tokens.remixed_from_username` (optional, shown as credit on space)

No credit cost — remixing is free. It's an acquisition mechanic.

### Mood-matched browse

Gallery page gains a sidebar/filter:
- Filter by mood (lavender / sand / forest / ocean / rose / midnight)
- Filter by vibe tags
- "Spaces like yours" — auto-filter to your mood if logged in

### Files

```
src/app/(marketing)/gallery/page.tsx          — replace mock data with real query
src/app/[username]/SpaceView.tsx              — add Remix button (logged-in visitors)
src/app/[username]/actions.ts                 — add remixSpace server action
src/app/(admin)/admin/page.tsx                — add "Feature space" button
src/app/api/cron/feature-email/route.ts       — email to featured space owner
```

### Success criteria
- [ ] Gallery shows real approved public spaces
- [ ] Mood + vibe filter works
- [ ] Remix button applies template config without touching content
- [ ] remix_count increments
- [ ] Space of the Week shown on landing page with spotlight
- [ ] Featured space owner receives email

---

## Phase 6 — Monthly AI Letter + Space Snapshots
_Goal: The longer someone uses Spaceful, the more irreplaceable it becomes._

### Space snapshots

On the 1st of each month (Vercel Cron, 00:01 UTC):
- Copy each active space's `content_json` into `space_snapshots` table
- **Batch 100 spaces per iteration** using offset cursor to avoid Vercel's 300s timeout. Query: `SELECT ... FROM spaces WHERE NOT EXISTS (SELECT 1 FROM space_snapshots WHERE space_id = spaces.id AND snapshot_at = CURRENT_DATE) LIMIT 100`. Re-run cron handles remainder; idempotent by design.
- Lightweight — only stores the JSON blob + metadata

```sql
create table space_snapshots (
  space_id     uuid not null references spaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  snapshot_at  date not null,
  content_json jsonb not null,
  primary key (space_id, snapshot_at)  -- one per space per month
);
-- RLS: owner only
```

New migration: `supabase/migrations/006_snapshots.sql`

### Monthly AI Letter

On the 2nd of each month (gives snapshot time to land):
- Cron job fetches current month snapshot + previous month snapshot per space
- Builds a diff summary: goals added/completed/removed, habit completion rate change, reading list delta, notepad word count change
- Claude writes a warm 5-sentence personal letter in second person, based on the diff
- Letter is stored as a special `daily_pulse_entries` row with `period = 'ai_letter'`
- Delivered to owner via Resend email AND appears as a pinned card in the Journal tab

**Cost**: Free for subscribers. 0.5 credits for free tier users (with opt-in consent — never charged without confirmation).

**Letter tone**: warm, specific, personal. Not generic affirmations. Must reference actual data from the diff.

Example:
> *"You added the running goal in January and logged it quietly in your habits. By this month, you'd hit 18 of 28 days — your highest streak yet. You removed the journaling goal in week 3; your notepad entries suggest you folded it into your evening pulse instead, which is probably wiser. The word 'patience' appeared six more times than last month. Something is shifting. I'm paying attention."*

### Space evolution timeline

`/:username?tab=journal&view=timeline` — private owner-only view:
- Horizontal scroll of monthly snapshot cards (miniaturised space previews)
- Click a month → expands to show that month's letter + content summary
- Visual diff: "Goals completed this month: 2/4 | Habits: 67% | New reads: 3"

### Files

```
supabase/migrations/006_snapshots.sql

src/app/api/cron/monthly-snapshot/route.ts    (new)
src/app/api/cron/monthly-letter/route.ts      (new)
src/components/space/TimelineView.tsx          (new — snapshot cards)
src/app/[username]/SpaceView.tsx               — add timeline view routing
emails/MonthlyLetter.tsx                       (new — React Email template)
```

### Success criteria
- [ ] Snapshot taken on 1st of month for all active spaces
- [ ] Letter generated on 2nd, referencing real diff data
- [ ] Letter appears in Journal tab as pinned card
- [ ] Letter delivered via email
- [ ] Timeline view shows past months with mini-summaries
- [ ] Free tier shows opt-in confirm before charging 0.5 credits

---

## Credit cost summary

| Feature | Cost | Rationale |
|---|---|---|
| Daily Pulse entry (morning/evening) | **Free** | Core daily habit must never cost credits |
| Companion daily message | **Free** | Retention feature, generated once/day cached |
| Companion on-demand chat | **0.1 credits** | Very cheap — incentivises use |
| Weekly digest email | **Free** | External trigger, costs us nothing |
| Monthly AI Letter (subscriber) | **Free** | Included in subscription |
| Monthly AI Letter (free tier) | **0.5 credits** | With explicit opt-in |
| Space of the Week spotlight | **Free** | Admin-triggered, not user-consumed |
| Remix | **Free** | Acquisition mechanic |

---

## Schema migration order

```
001_schema.sql         (existing — core tables)
002_templates.sql      (existing — space_templates)
003_knocks.sql         (Phase 2 — extend reactions)
004_daily_pulse.sql    (Phase 3 — daily_pulse_entries)
005_companion.sql      (Phase 4 — companion_daily, companion_interactions)
006_snapshots.sql      (Phase 6 — space_snapshots)
```

---

## Success criteria (overall)

- [ ] User visits space every morning to log intention — Spaceful is a daily ritual
- [ ] User returns in evenings to close the loop
- [ ] At least one external trigger per week (digest email) pulls lapsed users back
- [ ] Companion tab has a fresh message every day with no user action required
- [ ] Gallery is browsable and remix-able — creates growth without social graphs
- [ ] After 3 months a user has: 90 pulse entries, 3 AI letters, a companion who knows their life
- [ ] Switching away from Spaceful means losing that irreplaceable record — not just a pretty page

---

## NOT in scope

| Item | Rationale |
|---|---|
| Push notifications (mobile/web) | Requires service workers + APNS/FCM infra. Weekly email achieves the external trigger at zero infrastructure cost. Revisit post-Phase 2. |
| Full social graph (follows, feeds) | Explicitly excluded per Spaceful vision. Remix gallery achieves community without it. |
| Real-time knock notifications | WebSocket or SSE for instant knock alerts. Not worth the infra cost at early scale — weekly digest is sufficient. |
| Companion voice (TTS) | Audio output for the companion archetype. Future differentiator, not v1. |
| pgvector cross-user recommendations | Using embeddings to recommend spaces with similar goals. Powerful but requires significant user base first. |
| A/B testing engagement features | No feature flag infrastructure in scope. Run phases sequentially, measure with analytics. |

---

## What already exists

| Sub-problem | Existing code | Plan reuses? |
|---|---|---|
| SSE streaming from Claude | `src/app/api/generate/route.ts` | Yes — companion/daily and companion/chat follow identical pattern |
| Section registry pattern | `src/components/space/engine/sections/index.tsx` | Yes — DailyPulseSection added to existing registry |
| Reactions API stub | `src/app/api/reactions/route.ts` (501) | Yes — Phase 2 implements the stubbed route |
| Ambient player (mood audio) | `src/components/space/AmbientPlayer.tsx` | Yes — Phase 1 adds evening auto-start |
| ReactionForm component | `src/components/space/ReactionForm.tsx` | Yes — Phase 2 extends it with 3 knock type buttons |
| deduct_credits RPC | `supabase/migrations/001_schema.sql` | Yes — companion chat uses it directly |
| Gallery page shell | `src/app/(marketing)/gallery/page.tsx` | Yes — Phase 5 replaces mock data, keeps layout |
| OwnerChrome | `src/components/space/OwnerChrome.tsx` | Yes — knock approval added to existing chrome |
| Resend email | Already in stack | Yes — WeeklyDigest.tsx and MonthlyLetter.tsx use existing Resend client |

---

## Failure modes

For each new codepath, one realistic production failure and whether it's covered:

| Codepath | Failure scenario | Test covers? | Error handled? | User sees? |
|---|---|---|---|---|
| DB rate limit check (Phase 2) | Supabase slow query under load, rate check times out | No | No — **critical gap**: wrap in try/catch, fail open (allow knock) not fail closed (reject) | Silent allow (acceptable) |
| Weekly digest cron (Phase 2) | Resend rate limit hit mid-batch, some emails not sent | No | No — **critical gap**: log failed sends, retry next Sunday | Silent miss |
| Daily Pulse upsert (Phase 3) | Clock skew: user saves at 23:59:59, hits server at 00:00:01 next day | No | Partial — unique constraint catches duplicate, 409 returned | Confusing error |
| Tab Suspense boundary (Phase 3) | Missing Suspense in a future refactor removes the boundary | No | Build will warn, not error in some Next.js versions | Broken tab nav |
| Companion daily generation (Phase 4) | Claude API 529 (overloaded) on first visit | No | No — **critical gap**: return fallback "archetype greeting" if Claude fails, don't 500 | 500 error page |
| Companion credit deduct (Phase 4) | `companion_chat` not in enum (fixed by D4), but if migration partially fails | Yes (D4) | deduct_credits RPC will throw, caught by server action | "Something went wrong" |
| pgvector embedding (Phase 4) | Embedding model returns null for very short goal text | No | No — **critical gap**: fall back to first quote in archetype-themed subset | 500 or empty quote |
| Monthly snapshot batch (Phase 6) | Batch cursor skips spaces between batch runs due to new spaces mid-cron | No | Partial — idempotent WHERE NOT EXISTS guard covers most cases | Some users miss snapshot |
| Monthly letter (Phase 6) | No previous snapshot exists (user's first month) | No | No — **critical gap**: skip letter generation if no prior snapshot, don't error | No letter (correct but undocumented) |

**Critical gaps summary**: 5 failure modes with no test AND no error handling: rate limit timeout, digest partial send, companion Claude failure, pgvector null embedding, first-month letter.

---

## Worktree parallelization strategy

```
DEPENDENCY TABLE
Phase   Modules touched                              Depends on
1       SpaceView, SpecRenderer, sections/, AmbientPlayer   —
2       api/reactions, emails/, api/cron/weekly-digest, migrations/003   —
3       api/pulse, TabNav, JournalTab, sections/, migrations/004   Phase 1 (SpaceView tab routing builds on Phase 1 SpaceView changes)
4       api/companion/*, CompanionTab, migrations/005, data/quotes   Phase 3 (Companion tab exists after Phase 3)
5       gallery/, actions.ts (remixSpace), admin/   —
6       api/cron/monthly-*, TimelineView, migrations/006, emails/   Phase 3 (uses daily_pulse_entries for letter storage)

PARALLEL LANES
Lane A: Phase 1 → Phase 3 → Phase 4 (sequential: SpaceView → tabs → companion)
Lane B: Phase 2 (fully independent — reactions API, email, cron)
Lane C: Phase 5 (fully independent — gallery, remix)
Lane D: Phase 6 (after Phase 3 lands — depends on daily_pulse_entries table)

EXECUTION ORDER
1. Launch Lane A (Phase 1) + Lane B + Lane C in parallel worktrees
2. After Lane A Phase 1 merges: start Lane A Phase 3
3. After Lane A Phase 3 merges: start Lane A Phase 4 + Lane D in parallel
4. Merge all remaining lanes

CONFLICT FLAGS
Lane A and Lane B both touch SpaceView.tsx — coordinate: Phase 1 adds time-of-day hooks,
Phase 2 adds knock display. Sequence them or use separate functions to avoid conflict.
```

---

## Implementation Tasks

Synthesized from this review's findings.

- [ ] **T1 (P1, human: ~30min / CC: ~5min)** — Phase 2 rate limiting — Replace in-memory map with DB-based SELECT COUNT from reactions table
  - Surfaced by: Architecture D1 — serverless in-memory maps don't persist across instances
  - Files: `src/app/api/reactions/route.ts`
  - Verify: 4th knock in 1h from same IP hash returns 429

- [ ] **T2 (P1, human: ~15min / CC: ~3min)** — Phase 2 email opt-out — Add email_digest_opted_out to profiles + unsubscribe route
  - Surfaced by: Architecture D6 — GDPR/CAN-SPAM violation if no opt-out storage
  - Files: `supabase/migrations/003_knocks.sql`, `src/app/api/unsubscribe/route.ts`
  - Verify: clicking unsubscribe link sets column; next cron skips that user

- [ ] **T3 (P1, human: ~15min / CC: ~3min)** — Phase 3 tab nav — Wrap TabNav in Suspense with TabNavSkeleton
  - Surfaced by: Architecture D3 — Next.js 15 build error without Suspense
  - Files: `src/app/[username]/SpaceView.tsx`, `src/components/space/TabNav.tsx`
  - Verify: `pnpm typecheck` and `pnpm build` pass with no Suspense warning

- [ ] **T4 (P1, human: ~15min / CC: ~3min)** — Phase 4 enum — Add companion_chat to action_type enum before companion tables in migration 005
  - Surfaced by: Architecture D4 — deduct_credits RPC throws on unknown enum value
  - Files: `supabase/migrations/005_companion.sql`
  - Verify: `pnpm db:reset` applies migration cleanly; companion chat deducts credits

- [ ] **T5 (P1, human: ~30min / CC: ~5min)** — Phase 4 companion daily — Add loading skeleton + lazy generation trigger
  - Surfaced by: Architecture D5 — no trigger defined; blank Companion tab on first visit
  - Files: `src/app/api/companion/daily/route.ts`, `src/components/space/CompanionTab.tsx`
  - Verify: second visit same day uses cached row (check query logs — no Claude API call)

- [ ] **T6 (P2, human: ~1h / CC: ~10min)** — Phase 3 streak — Implement server-side streak with yesterday-anchor logic
  - Surfaced by: Code Quality D7 + D9 — vague spec + morning-anxiety bug
  - Files: `src/app/api/pulse/route.ts`
  - Verify: opening space before logging shows yesterday's streak count, not 0

- [ ] **T7 (P2, human: ~2h / CC: ~20min)** — Phase 4 quotes — Replace keyword matching with pgvector similarity search
  - Surfaced by: Code Quality D8 — keyword matching produces wrong quote matches
  - Files: `supabase/migrations/005_companion.sql` (quotes table + embedding column), `src/app/api/companion/daily/route.ts`
  - Verify: eval — "pain-free movement" goal returns a recovery/patience quote

- [ ] **T8 (P2, human: ~30min / CC: ~5min)** — Phase 6 snapshots — Add batch cursor to snapshot cron
  - Surfaced by: Performance D10 — cron times out at scale without batching
  - Files: `src/app/api/cron/monthly-snapshot/route.ts`
  - Verify: running cron twice in same month produces no duplicate snapshots

- [ ] **T9 (P2, human: ~1h / CC: ~10min)** — Failure modes — Add fallback handling for 5 critical gaps
  - Surfaced by: Failure modes section — companion Claude failure, rate limit timeout, pgvector null, digest partial send, first-month letter
  - Files: `src/app/api/reactions/route.ts`, `src/app/api/companion/daily/route.ts`, `src/app/api/cron/weekly-digest/route.ts`
  - Verify: companion tab shows archetype greeting (not 500) when Claude API returns 529

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 10 issues, 0 critical gaps remaining, 5 failure modes flagged |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**UNRESOLVED:** 0 — all 10 decisions were resolved by user input.

**VERDICT:** ENG CLEARED — 10 issues found and resolved. 9 implementation tasks written. 5 failure mode gaps flagged for T9 to address during implementation.
