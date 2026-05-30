# Spaceful — CLAUDE.md

Personal AI Space Builder. Users answer 5 questions → AI generates a unique personal page.

## Stack
- **Next.js 15** App Router, TypeScript strict, `src/` layout
- **Supabase**: Postgres, Auth (PKCE), Storage, RLS — no ORM, use typed client
- **Styling**: CSS custom properties (design tokens in `globals.css`), Tailwind for layout utilities only
- **AI**: Claude Sonnet 4.6 (theme generation), Claude Haiku 4.5 (journaling prompts, moderation pre-screen)
- **Billing**: Stripe — `deduct_credits` / `grant_credits` RPCs for all balance changes, never client-trusted
- **Email**: Resend
- **Icons**: lucide-react only, 1.5px stroke

## Commands
```bash
pnpm dev          # start dev server (Turbopack)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm db:reset     # reset local Supabase + apply migrations
pnpm db:types     # regenerate src/lib/supabase/types.ts
pnpm stripe:listen # forward webhooks to localhost
```

## Route tree
| Route | File | Notes |
|-------|------|-------|
| `/` | `(marketing)/page.tsx` | Landing, gallery-as-hero |
| `/gallery` | `(marketing)/gallery/page.tsx` | Public, tag filter in URL |
| `/login` `/signup` | `(auth)/` | No app nav |
| `/spaces` | `(app)/spaces/page.tsx` | Auth required |
| `/spaces/new` | `(app)/spaces/new/page.tsx` | Credit-gated |
| `/onboard` | `(app)/onboard/page.tsx` | No app nav, immersive |
| `/account/credits` | `(app)/account/credits/page.tsx` | Stripe entry points |
| `/admin` | `(admin)/admin/page.tsx` | Admin role check |
| `/[username]` | `[username]/page.tsx` | Owner OR visitor view |
| `/[username]/[slug]` | `[username]/[slug]/page.tsx` | Non-primary spaces |

## Key rules
- Credits are `numeric(6,2)` — fractional costs exist (0.25, 0.5). Never use int.
- All credit changes go through `deduct_credits` or `grant_credits` RPCs (service role), never direct UPDATE.
- Any action costing ≥1 credit shows a confirmation modal before deducting.
- Rate-limit reactions (3/space/IP/hour) in the server action — not in RLS.
- `/:username` resolves the space where `is_primary = true`.
- Username is permanent; never reassign after account deletion.
- Design tokens: `--app-*` variables for app chrome; `--sp-*` variables for per-space themes.
- Animations: animate `transform` only for entrance — never gate `opacity:1` on an animation that starts at `opacity:0` (breaks in backgrounded tabs).
- Space palettes: 6 moods defined in `src/lib/utils.ts → SPACE_PALETTES`.

## Schema decisions (open for review)
See `supabase/migrations/001_schema.sql` header for the full list. Key ones:
- `credit_balance` / `delta` are `numeric(6,2)` (not `int` as in the original spec)
- `profiles` references `auth.users` (Supabase pattern)
- Credits expire 90 days after subscription cancel (`credits_expiry_at`)
- v1 includes: `platform_settings`, `prompt_templates`, `login_history`, `username_blocklist`
