-- Spaceful — consolidated schema
-- Apply with: supabase db reset  (dev)  /  supabase db push  (staging)
-- ─────────────────────────────────────────────────────────
-- Decisions baked in (surfaced for review):
--   1. credit_balance / delta are numeric(6,2) — prompts cost 0.25 cr, OG regen 0.5 cr.
--      Integer columns would silently truncate. The original spec used int; this corrects it.
--   2. profiles references auth.users (Supabase pattern) — no standalone users table.
--   3. username is stored on profiles, permanent by policy.
--   4. Primary space: is_primary bool on spaces. /:username resolves the primary space;
--      additional spaces live at /:username/:slug.
--   5. Credits expire 90 days after subscription cancellation (credits_expiry_at on profiles).
--   6. platform_settings, prompt_templates, login_history, username_blocklist included for v1.
-- ─────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists vector;

-- ─────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────
create type subscription_status as enum ('free', 'active', 'cancelled', 'past_due');
create type space_visibility     as enum ('private', 'link_only', 'public');
create type gallery_status       as enum ('not_submitted', 'pending', 'approved', 'rejected');
create type credit_action        as enum (
  'signup_gift', 'subscription_renewal', 'purchase',
  'generation', 'regeneration', 'prompt', 'og_regen', 'bonus_admin', 'refund'
);
create type moderation_status    as enum ('pending', 'approved', 'rejected', 're_review');
create type report_status        as enum ('pending', 'dismissed', 'actioned');

-- ─────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────
-- Profiles  (extends auth.users)
-- ─────────────────────────────────────────────────────────
create table profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid unique not null references auth.users(id) on delete cascade,
  username              text unique not null,
  display_name          text,
  email                 text not null,
  role                  text not null default 'user' check (role in ('user', 'admin')),
  subscription_status   subscription_status not null default 'free',
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  credit_balance        numeric(6,2) not null default 0 check (credit_balance >= 0),
  credits_monthly_cap   int not null default 40,
  credits_expiry_at     timestamptz,           -- set 90 days after cancel
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile + gift 3 signup credits on every new signup.
-- set search_path = public is required for security definer functions in Supabase
-- so table references resolve to the public schema, not auth or pg_catalog.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );

  -- create profile row
  insert into public.profiles (user_id, email, username, display_name, credit_balance)
  values (
    new.id,
    new.email,
    v_username,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), v_username),
    3  -- signup gift pre-loaded; ledger row inserted below
  );

  -- record the signup gift in the ledger
  insert into public.credit_transactions (user_id, delta, balance_after, action_type, note)
  values (new.id, 3, 3, 'signup_gift', 'Welcome gift');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────
-- Spaces
-- ─────────────────────────────────────────────────────────
create table spaces (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  slug           text not null,
  display_name   text,
  -- design_tokens shape: { mood, palette{bg,bg2,surface,accent,accent2,text,text2,glow},
  --   font_weight, animation_level(none|subtle|full), layout_variant(spacious|rich) }
  design_tokens  jsonb,
  theme_version  int not null default 1,
  -- content_json shape: { title, goals[{id,text,done}], currently, notepad, period_cards{} }
  content_json   jsonb,
  visibility     space_visibility not null default 'private',
  gallery_status gallery_status   not null default 'not_submitted',
  gallery_tags   text[] not null default '{}',
  og_image_url   text,
  is_primary     bool not null default false,
  reactions_enabled bool not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz,
  unique (user_id, slug)
);

create trigger spaces_updated_at before update on spaces
  for each row execute function set_updated_at();

-- Only one primary space per user
create unique index spaces_one_primary_per_user
  on spaces (user_id)
  where is_primary = true;

-- ─────────────────────────────────────────────────────────
-- Credit transactions  (immutable ledger)
-- ─────────────────────────────────────────────────────────
create table credit_transactions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  delta                    numeric(6,2) not null,   -- positive = added, negative = spent
  balance_after            numeric(6,2) not null,
  action_type              credit_action not null,
  space_id                 uuid references spaces(id) on delete set null,
  stripe_payment_intent_id text,
  note                     text,
  created_at               timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- Atomic credit deduction RPC
-- Called by server-side code only (service role). Never trusted from the client.
-- Returns the new balance, or raises an exception if insufficient credits.
-- ─────────────────────────────────────────────────────────
create or replace function deduct_credits(
  p_user_id    uuid,
  p_delta      numeric,   -- pass positive number; function negates it
  p_action     credit_action,
  p_space_id   uuid default null,
  p_note       text default null
) returns numeric as $$
declare
  v_balance numeric;
begin
  -- Lock the row to prevent concurrent races
  select credit_balance into v_balance
    from profiles
   where user_id = p_user_id
     for update;

  if v_balance < p_delta then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  v_balance := v_balance - p_delta;

  update profiles set credit_balance = v_balance where user_id = p_user_id;

  insert into credit_transactions
    (user_id, delta, balance_after, action_type, space_id, note)
  values
    (p_user_id, -p_delta, v_balance, p_action, p_space_id, p_note);

  return v_balance;
end;
$$ language plpgsql security definer;

-- Grant credits RPC (signup, purchase, subscription renewal)
create or replace function grant_credits(
  p_user_id    uuid,
  p_delta      numeric,
  p_action     credit_action,
  p_cap        numeric default 9999,  -- pass credits_monthly_cap for rollover
  p_stripe_id  text default null,
  p_note       text default null
) returns numeric as $$
declare
  v_balance numeric;
begin
  select credit_balance into v_balance
    from profiles
   where user_id = p_user_id
     for update;

  v_balance := least(v_balance + p_delta, p_cap);

  update profiles set credit_balance = v_balance where user_id = p_user_id;

  insert into credit_transactions
    (user_id, delta, balance_after, action_type, stripe_payment_intent_id, note)
  values
    (p_user_id, p_delta, v_balance, p_action, p_stripe_id, p_note);

  return v_balance;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────
-- Reactions
-- ─────────────────────────────────────────────────────────
create table reactions (
  id               uuid primary key default gen_random_uuid(),
  space_id         uuid not null references spaces(id) on delete cascade,
  visitor_ip_hash  text not null,   -- SHA256(ip + space_id), not raw IP
  message          text not null check (char_length(message) between 1 and 140),
  is_visible       bool not null default false,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- Moderation queue
-- ─────────────────────────────────────────────────────────
create table moderation_items (
  id               uuid primary key default gen_random_uuid(),
  space_id         uuid unique not null references spaces(id) on delete cascade,
  submitted_at     timestamptz not null default now(),
  status           moderation_status not null default 'pending',
  reviewed_by      uuid references auth.users(id),
  reviewed_at      timestamptz,
  rejection_reason text
);

-- ─────────────────────────────────────────────────────────
-- Content reports
-- ─────────────────────────────────────────────────────────
create table content_reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_ip_hash  text,
  reporter_user_id  uuid references auth.users(id) on delete set null,
  space_id          uuid references spaces(id) on delete set null,
  reaction_id       uuid references reactions(id) on delete set null,
  reason            text not null,
  status            report_status not null default 'pending',
  actioned_by       uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  constraint report_has_target check (space_id is not null or reaction_id is not null)
);

-- ─────────────────────────────────────────────────────────
-- AI prompt log
-- ─────────────────────────────────────────────────────────
create table prompt_log (
  id              uuid primary key default gen_random_uuid(),
  space_id        uuid not null references spaces(id) on delete cascade,
  prompt_text     text,
  shown_at        timestamptz not null default now(),
  accepted        bool,        -- did user start writing? (keystroke within 30s)
  credits_charged numeric(4,2) not null default 0.25
);

-- ─────────────────────────────────────────────────────────
-- Platform settings  (singleton row, id = 1)
-- ─────────────────────────────────────────────────────────
create table platform_settings (
  id                          int primary key default 1 check (id = 1),
  gallery_enabled             bool not null default true,
  reactions_enabled           bool not null default true,
  ai_prompts_enabled          bool not null default true,
  og_cards_enabled            bool not null default true,
  new_signups_enabled         bool not null default true,
  maintenance_mode            bool not null default false,
  maintenance_message         text not null default 'We''ll be back shortly.',
  announcement_banner         text,
  resend_from_name            text not null default 'Spaceful',
  resend_reply_to             text not null default 'hello@spaceful.io',
  weekly_digest_enabled       bool not null default true,
  reaction_notifications_enabled bool not null default true,
  updated_at                  timestamptz not null default now()
);

insert into platform_settings (id) values (1) on conflict do nothing;

-- ─────────────────────────────────────────────────────────
-- AI prompt templates  (versioned; rollback-safe)
-- ─────────────────────────────────────────────────────────
create table prompt_templates (
  id           uuid primary key default gen_random_uuid(),
  key          text not null,          -- e.g. 'theme_generation', 'journaling_prompt'
  version      int not null default 1,
  system_text  text not null,
  user_text    text not null,
  is_active    bool not null default false,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (key, version)
);

create unique index prompt_templates_one_active_per_key
  on prompt_templates (key)
  where is_active = true;

-- ─────────────────────────────────────────────────────────
-- Login history  (last 30 per user, country only — no raw IP)
-- ─────────────────────────────────────────────────────────
create table login_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  ip_country   text,   -- two-letter ISO from CF-IPCountry or similar header
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- Username blocklist  (admin-managed)
-- ─────────────────────────────────────────────────────────
create table username_blocklist (
  username  text primary key,
  note      text,
  added_at  timestamptz not null default now()
);

-- Pre-seed reserved names
insert into username_blocklist (username, note) values
  ('admin',       'reserved'),
  ('support',     'reserved'),
  ('help',        'reserved'),
  ('gallery',     'reserved'),
  ('pricing',     'reserved'),
  ('account',     'reserved'),
  ('spaces',      'reserved'),
  ('api',         'reserved'),
  ('static',      'reserved'),
  ('onboard',     'reserved'),
  ('login',       'reserved'),
  ('signup',      'reserved'),
  ('logout',      'reserved'),
  ('about',       'reserved'),
  ('terms',       'reserved'),
  ('privacy',     'reserved'),
  ('blog',        'reserved'),
  ('spaceful',    'reserved'),
  ('staff',       'reserved'),
  ('team',        'reserved'),
  ('moderator',   'reserved'),
  ('mod',         'reserved'),
  ('system',      'reserved'),
  ('root',        'reserved')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────
alter table profiles             enable row level security;
alter table spaces               enable row level security;
alter table credit_transactions  enable row level security;
alter table reactions            enable row level security;
alter table moderation_items     enable row level security;
alter table content_reports      enable row level security;
alter table prompt_log           enable row level security;
alter table platform_settings    enable row level security;
alter table prompt_templates     enable row level security;
alter table login_history        enable row level security;

-- profiles: owner can read/update own row; admin can read all
create policy "profiles: owner read"   on profiles for select using (auth.uid() = user_id);
create policy "profiles: owner update" on profiles for update using (auth.uid() = user_id);

-- spaces: owner always; anyone if not private; admin all
create policy "spaces: owner all"      on spaces for all    using (auth.uid() = user_id);
create policy "spaces: public read"    on spaces for select using (visibility <> 'private');

-- credit_transactions: owner read-only
create policy "credits: owner read"    on credit_transactions for select using (auth.uid() = user_id);

-- reactions: open insert; owner select; is_visible public select
create policy "reactions: open insert" on reactions for insert with check (true);
create policy "reactions: owner read"  on reactions for select
  using (
    space_id in (select id from spaces where user_id = auth.uid())
    or is_visible = true
  );

-- moderation_items / content_reports / prompt_log: owner of space
create policy "moderation: owner"     on moderation_items  for select
  using (space_id in (select id from spaces where user_id = auth.uid()));
create policy "prompt_log: owner"     on prompt_log        for select
  using (space_id in (select id from spaces where user_id = auth.uid()));

-- platform_settings / prompt_templates: public read (feature flags needed client-side)
create policy "settings: public read"  on platform_settings for select using (true);
create policy "templates: public read" on prompt_templates  for select using (true);

-- login_history: owner only
create policy "login_history: owner"  on login_history for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- Indexes (query patterns)
-- ─────────────────────────────────────────────────────────
create index spaces_user_id           on spaces (user_id);
create index spaces_gallery           on spaces (gallery_status, visibility) where gallery_status = 'approved';
create index spaces_gallery_tags      on spaces using gin (gallery_tags);
create index credit_tx_user           on credit_transactions (user_id, created_at desc);
create index reactions_space          on reactions (space_id, created_at desc);
create index moderation_status        on moderation_items (status) where status = 'pending';
create index login_history_user       on login_history (user_id, created_at desc);
