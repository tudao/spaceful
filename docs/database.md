# Spaceful — Database Design

Postgres via Supabase. All tables have RLS enabled. Credit mutations go through RPCs only — never direct `UPDATE` from the client or server actions.

---

## Schema overview

```
auth.users (Supabase managed)
  └── profiles          — one row per user, holds balance + subscription state
  └── spaces            — one or more spaces per user
        └── reactions         — visitor messages on a space
        └── moderation_items  — gallery submission queue entry (unique per space)
        └── content_reports   — flagged content
        └── prompt_log        — AI journaling prompts shown + accepted flag
  └── credit_transactions — immutable ledger (append-only)
  └── login_history       — last 30 logins per user (country only)

space_templates           — spec-driven templates, admin-managed
platform_settings         — singleton feature-flag row (id = 1)
prompt_templates          — versioned AI prompt strings
username_blocklist        — reserved/banned usernames
```

---

## Tables

### `profiles`

Extends `auth.users`. One row per user created by the `handle_new_user` trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | unique, cascade delete |
| `username` | text unique | permanent after set, 3–20 chars alphanumeric/hyphen |
| `display_name` | text | |
| `email` | text | |
| `role` | text | `'user'` or `'admin'` |
| `subscription_status` | enum | `free / active / cancelled / past_due` |
| `stripe_customer_id` | text unique | |
| `stripe_subscription_id` | text unique | |
| `credit_balance` | numeric(6,2) | `>= 0`, never go negative |
| `credits_monthly_cap` | int | default 40 — subscription rollover ceiling |
| `credits_expiry_at` | timestamptz | set 90 days after subscription cancel |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger |

**On signup:** `handle_new_user` trigger inserts a profile row with `credit_balance = 3` and writes a `signup_gift` ledger entry.

---

### `spaces`

One or more spaces per user. The primary space (`is_primary = true`) is served at `/:username`; additional spaces at `/:username/:slug`. Enforced by a partial unique index.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | cascade delete |
| `slug` | text | unique per user |
| `display_name` | text | |
| `design_tokens` | jsonb | see shape below |
| `content_json` | jsonb | see shape below |
| `visibility` | enum | `private / link_only / public` |
| `gallery_status` | enum | `not_submitted / pending / approved / rejected` |
| `gallery_tags` | text[] | GIN indexed for tag filtering |
| `og_image_url` | text | |
| `is_primary` | bool | partial unique index — one primary per user |
| `reactions_enabled` | bool | default true |
| `published_at` | timestamptz | |

**`design_tokens` shape:**
```jsonb
{
  "mood": "lavender",
  "layout_variant": "spacious" | "rich",
  "animation_level": "none" | "subtle" | "full",
  "template_id": "garden",
  "spec_override": { ...TemplateSpecOverride... },
  "palette": { "bg", "bg2", "surface", "accent", "accent2", "text", "text2", "glow" },
  "tagline": "...",
  "hero_title_placeholder": "...",
  "notepad_starter": "...",
  "currently_placeholder": "..."
}
```

**`content_json` shape:**
```jsonb
{
  "title": "Laki's World",
  "subtitle": "...",
  "currently": "...",
  "hero_title": "...",
  "hero_notes": "...",
  "notepad": "...",
  "goals": [{ "id": "uuid", "text": "...", "done": false }],
  "periods": [{ "week": "W1", "title": "...", "notes": "...", "status": "plan|prog|done|blocked" }],
  "habits": [{ "id": "uuid", "label": "...", "days": [true, false, ...] }],
  "reading_list": [{ "id": "uuid", "title": "...", "meta": "...", "status": "reading|queued|done" }],
  "quote": { "text": "...", "attribution": "..." },
  "photo": { "url": "...", "caption": "..." }
}
```

---

### `credit_transactions`

Immutable append-only ledger. Never update or delete rows. `balance_after` is the snapshot at transaction time, making auditing self-contained.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | cascade delete |
| `delta` | numeric(6,2) | positive = credit added, negative = spent |
| `balance_after` | numeric(6,2) | snapshot after this transaction |
| `action_type` | enum | `signup_gift / subscription_renewal / purchase / generation / regeneration / prompt / og_regen / bonus_admin / refund` |
| `space_id` | uuid FK → spaces | nullable, set null on space delete |
| `stripe_payment_intent_id` | text | for purchase reconciliation |
| `note` | text | human-readable description |
| `created_at` | timestamptz | |

---

### `space_templates`

Spec-driven templates stored in the DB. Admins create and edit these via `/admin/templates`. The `spec` column is a validated `TemplateSpec` JSON object.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | e.g. `'garden'`, `'cosmos'` — used as `template_id` in `design_tokens` |
| `name` | text | display name |
| `description` | text | |
| `spec` | jsonb | full `TemplateSpec` — see architecture doc |
| `preview_mood` | text | mood to use for admin preview |
| `tags` | text[] | e.g. `['botanical', 'featured']` |
| `mood_affinity` | text[] | moods this template suits |
| `vibe_keywords` | text[] | vibe words this template matches |
| `is_active` | bool | inactive templates not returned to users |
| `is_featured` | bool | shown in onboarding template picker |
| `created_by` | uuid FK → auth.users | null = system seed |
| `created_at` | timestamptz | |

**Seed:** All 6 base templates (garden, laki-world, cosmos, sky, ocean, journal) are upserted in `supabase/seed.sql` using `ON CONFLICT (slug) DO UPDATE`.

---

### `reactions`

Visitor messages left on a space. Rate-limited server-side (3 per space per IP per hour — not in RLS). IP is never stored raw; `visitor_ip_hash` is `SHA256(ip + space_id)`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `space_id` | uuid FK → spaces | cascade delete |
| `visitor_ip_hash` | text | SHA256(ip + space_id) |
| `message` | text | 1–140 chars |
| `is_visible` | bool | default false — owner approves visibility |
| `created_at` | timestamptz | |

---

### `moderation_items`

One row per space, unique. Created when owner submits space for gallery. Admin reviews and sets `status`.

| Column | Type | Notes |
|---|---|---|
| `space_id` | uuid unique FK | cascade delete |
| `status` | enum | `pending / approved / rejected / re_review` |
| `reviewed_by` | uuid FK → auth.users | |
| `reviewed_at` | timestamptz | |
| `rejection_reason` | text | |

---

### `platform_settings`

Singleton row (`id = 1`). Feature flags and email config. Public read via RLS so flags are accessible client-side.

Key flags: `gallery_enabled`, `reactions_enabled`, `ai_prompts_enabled`, `new_signups_enabled`, `maintenance_mode`.

---

### `prompt_templates`

Versioned AI prompt strings. One active prompt per `key` enforced by partial unique index. Allows prompt rollback without a deployment.

---

### `login_history`

Last 30 logins per user, country code only (`ip_country`). No raw IP stored.

---

### `username_blocklist`

Reserved and banned usernames. Public read so client-side validation can block them before form submission. Pre-seeded with ~24 reserved names (admin, api, gallery, etc.).

---

## RPCs

All credit mutations go through these RPCs using the **service role** key. They are `SECURITY DEFINER` functions — client code must never bypass them with direct `UPDATE`.

### `deduct_credits(p_user_id, p_delta, p_action, p_space_id?, p_note?)`

Locks the profile row (`SELECT FOR UPDATE`), checks balance ≥ delta, subtracts, writes ledger row. Raises `insufficient_credits` (SQLSTATE `P0001`) if balance is too low.

### `grant_credits(p_user_id, p_delta, p_action, p_cap?, p_stripe_id?, p_note?)`

Adds credits up to `p_cap` (pass `credits_monthly_cap` for subscription renewals to enforce the ceiling). Writes ledger row.

---

## Indexes

| Index | Table | Purpose |
|---|---|---|
| `spaces_user_id` | spaces | user's space list |
| `spaces_gallery` | spaces | gallery page (partial: approved only) |
| `spaces_gallery_tags` | spaces | GIN — tag filter |
| `spaces_one_primary_per_user` | spaces | partial unique — one primary per user |
| `credit_tx_user` | credit_transactions | user ledger sorted by date |
| `reactions_space` | reactions | reactions per space sorted by date |
| `moderation_status` | moderation_items | partial — pending queue |
| `login_history_user` | login_history | logins per user sorted by date |
| `prompt_templates_one_active_per_key` | prompt_templates | partial unique — one active per key |

---

## RLS summary

| Table | Read | Write |
|---|---|---|
| `profiles` | own row; admin: all | own row |
| `spaces` | own; or if not private | own |
| `credit_transactions` | own row | RPC only |
| `reactions` | own space's reactions or `is_visible = true` | open insert |
| `space_templates` | `is_active = true` | admin only |
| `platform_settings` | public | admin only |
| `prompt_templates` | public | admin only |
| `username_blocklist` | public | admin only |
| `login_history` | own rows | server only |
| `moderation_items` | own space | admin only |

---

## Migrations

| File | Contents |
|---|---|
| `001_schema.sql` | Full schema: enums, tables, triggers, RPCs, RLS, indexes |
| `002_templates.sql` | `space_templates` table + RLS policies |

Apply locally with `pnpm db:reset`. Push to staging with `supabase db push`.
