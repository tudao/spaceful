# Spaceful

Personal AI Space Builder. Answer 5 questions → Claude generates a unique personal page at `spaceful.io/:username`.

## Stack

- **Next.js 15** App Router, TypeScript strict
- **Supabase** — Postgres, Auth (PKCE), Storage, Row-Level Security
- **Anthropic** — Claude Sonnet 4.6 (theme generation), Claude Haiku 4.5 (journaling prompts)
- **Stripe** — credit top-ups + subscription billing
- **Resend** — transactional email
- **Tailwind CSS** + CSS custom property design system (Nunito font, `--app-*` tokens)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Stripe CLI | latest | `brew install stripe/stripe-cli/stripe` |

---

## 1. Clone & install

```bash
git clone https://github.com/your-org/spaceful.git
cd spaceful
pnpm install
```

---

## 2. Environment variables

Copy the example file and fill in each value:

```bash
cp .env.local.example .env.local
```

Open `.env.local`:

```env
# Supabase — find these at supabase.com/dashboard → project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # never expose client-side

# Stripe — find at dashboard.stripe.com → Developers → API keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    # filled after step 5

# Stripe Price IDs — create products in Stripe dashboard first (see step 4)
STRIPE_PRICE_CREDITS_5=price_...   # $3 → 5 credits
STRIPE_PRICE_CREDITS_10=price_...  # $5 → 10 credits
STRIPE_PRICE_CREDITS_20=price_...  # $9 → 20 credits
STRIPE_PRICE_SUBSCRIPTION=price_... # $15/mo → 20 credits/month

# Anthropic — platform.anthropic.com → API keys
ANTHROPIC_API_KEY=sk-ant-...

# Resend — resend.com → API keys
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@spaceful.io

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Set up local Supabase

### Start the local stack

```bash
supabase start
```

This boots Postgres, Auth, Storage, and the Studio UI. On first run it pulls Docker images (~1 min).

Once running, the CLI prints your local credentials — copy them into `.env.local`:

```
API URL:       http://localhost:54321
anon key:      eyJ...
service_role:  eyJ...
Studio:        http://localhost:54323
```

### Apply the schema

```bash
pnpm db:reset
```

This runs `supabase db reset`, applying `supabase/migrations/001_schema.sql` to the local database. It:

- Creates all enums, tables, triggers, RLS policies, and indexes
- Seeds the `platform_settings` singleton row
- Seeds the `username_blocklist` with reserved names
- Creates the `deduct_credits` and `grant_credits` RPCs

### Generate TypeScript types

```bash
pnpm db:types
```

This writes `src/lib/supabase/types.ts` from the live schema. Re-run any time you change migrations.

### Inspect the database (optional)

Open Supabase Studio at **http://localhost:54323** to browse tables, run SQL, and inspect RLS policies.

---

## 4. Set up Stripe products (one-time)

In the [Stripe Dashboard](https://dashboard.stripe.com/test/products) (use **Test mode**), create four products:

| Product | Price | Type | Copy the Price ID into |
|---------|-------|------|------------------------|
| 5 Credits | $3.00 | One-time | `STRIPE_PRICE_CREDITS_5` |
| 10 Credits | $5.00 | One-time | `STRIPE_PRICE_CREDITS_10` |
| 20 Credits | $9.00 | One-time | `STRIPE_PRICE_CREDITS_20` |
| Spaceful Subscription | $15.00 / month | Recurring | `STRIPE_PRICE_SUBSCRIPTION` |

---

## 5. Forward Stripe webhooks

In a separate terminal, start the Stripe CLI listener:

```bash
pnpm stripe:listen
```

This forwards webhook events to `localhost:3000/api/stripe/webhook`. Copy the `whsec_...` signing secret it prints into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

Relevant events the app handles:
- `checkout.session.completed` → grant top-up credits
- `invoice.paid` → grant subscription renewal credits
- `customer.subscription.deleted` → mark subscription cancelled

---

## 6. Start the dev server

```bash
pnpm dev
```

Open **http://localhost:3000**.

The app uses Turbopack for fast refresh. The full screen inventory:

| URL | Screen |
|-----|--------|
| `/` | Landing — gallery-as-hero |
| `/signup` | Sign up (creates profile + gifts 3 credits) |
| `/login` | Sign in + Google OAuth |
| `/onboard` | 5-step AI space builder |
| `/spaces` | My Spaces |
| `/spaces/new` | Credit-gated new space |
| `/gallery` | Public gallery with tag filters |
| `/account/credits` | Credits & billing |
| `/:username` | Space page (owner edit mode or visitor view) |
| `/admin` | Admin dashboard |
| `/admin/moderation` | Gallery moderation queue |

---

## 7. Create your first account

1. Go to **http://localhost:3000/signup**
2. Pick a username — it's permanent and becomes your space URL
3. After signup, 3 credits are gifted automatically (via the `handle_new_user` trigger + a `signup_gift` transaction)
4. You'll be redirected to `/onboard` to create your first space

> **Note:** With a fresh local DB you'll be redirected to `/onboard` immediately. The first space costs 3 credits, which exactly matches the signup gift — this is intentional.

---

## Common commands

```bash
pnpm dev            # start dev server (Turbopack)
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm lint:fix       # eslint --fix
pnpm format         # prettier --write .

pnpm db:reset       # drop + re-apply all migrations (local)
pnpm db:push        # push migrations to a linked remote project
pnpm db:types       # regenerate src/lib/supabase/types.ts
pnpm stripe:listen  # forward webhooks to localhost:3000
```

---

## Key architecture notes

**Credits are `numeric(6,2)`, not integer.** Prompts cost 0.25 cr, OG regen costs 0.5 cr. All balance changes go through the `deduct_credits` or `grant_credits` Postgres RPCs (service role only) — never a direct `UPDATE` from the client.

**Space routing.** `/:username` resolves the space where `is_primary = true`. Additional spaces live at `/:username/:slug`. Only one primary space per user (enforced via a partial unique index).

**Design system.** CSS custom properties live in `src/app/globals.css`. App chrome uses `--app-*` tokens; each space page applies `--sp-*` tokens driven by the `design_tokens` JSONB column. Six moods: lavender, sand, forest, ocean, rose, midnight.

**Auth.** Supabase PKCE flow. The `handle_new_user` trigger auto-creates a `profiles` row on signup. The middleware in `src/middleware.ts` guards `/spaces`, `/onboard`, `/account`, and `/admin` routes.

**Rate limiting.** Reaction submissions (3 per space per IP per hour) are enforced in the API route — not RLS — since RLS can't count by IP.

---

## Deploying to production

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project. Once created, find your credentials at **Settings → API**.

### 2. Push the schema

```bash
# Link your local repo to the remote project (get ref from the dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to the remote database
pnpm db:push
```

### 3. Initialize platform settings

In the Supabase **SQL Editor**, run once:

```sql
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
```

### 4. Configure Supabase Auth

In **Authentication → URL Configuration**:
- **Site URL**: `https://your-domain.vercel.app`
- **Redirect URLs**: `https://your-domain.vercel.app/**`

### 5. Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for automatic deploys on push.

### 6. Add environment variables in Vercel

Go to **Vercel Dashboard → your project → Settings → Environment Variables** and add:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `ANTHROPIC_API_KEY` | platform.anthropic.com |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | After step 7 below |
| `STRIPE_PRICE_CREDITS_5` | Stripe price ID for 5-credit pack |
| `STRIPE_PRICE_CREDITS_10` | Stripe price ID for 10-credit pack |
| `STRIPE_PRICE_CREDITS_20` | Stripe price ID for 20-credit pack |
| `STRIPE_PRICE_SUBSCRIPTION` | Stripe price ID for monthly subscription |
| `RESEND_API_KEY` | resend.com → API keys |
| `RESEND_FROM_EMAIL` | Your verified sender address |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |

### 7. Set up Stripe webhook (production)

In the [Stripe Dashboard](https://dashboard.stripe.com) → **Webhooks → Add endpoint**:
- **URL**: `https://your-domain.vercel.app/api/stripe/webhook`
- **Events**: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`

Copy the `whsec_...` signing secret → add it as `STRIPE_WEBHOOK_SECRET` in Vercel.

### 8. Redeploy

After adding all environment variables, trigger a redeploy in Vercel so they take effect.

---

## Stopping local services

```bash
supabase stop        # stop Postgres + Auth + Storage
# Stripe listener: Ctrl+C in its terminal
```

To wipe the local database completely:

```bash
supabase db reset    # re-applies migrations from scratch
```
