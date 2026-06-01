-- Spaceful — consolidated schema (all migrations merged)
-- Apply with: supabase db reset  (dev)  /  supabase db push  (staging)
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
  'generation', 'regeneration', 'prompt', 'og_regen', 'bonus_admin', 'refund',
  'companion_chat', 'daily_login'
);
create type moderation_status    as enum ('pending', 'approved', 'rejected', 're_review');
create type report_status        as enum ('pending', 'dismissed', 'actioned');

-- ─────────────────────────────────────────────────────────
-- Shared trigger
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
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid unique not null references auth.users(id) on delete cascade,
  username                 text unique not null,
  display_name             text,
  email                    text not null,
  role                     text not null default 'user' check (role in ('user', 'admin')),
  subscription_status      subscription_status not null default 'free',
  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  credit_balance           numeric(6,2) not null default 0 check (credit_balance >= 0),
  credits_monthly_cap      int not null default 40,
  credits_expiry_at        timestamptz,
  -- daily login credit grant tracking
  last_daily_credit_at     date,
  -- morning email
  morning_email_enabled    bool not null default false,
  morning_email_hour       int  not null default 7 check (morning_email_hour between 0 and 23),
  morning_email_timezone   text not null default 'UTC',
  morning_email_sent_date  date,
  -- digest opt-out
  email_digest_opted_out   bool not null default false,
  -- language preference for AI content
  preferred_language       text not null default 'en',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create unique index profiles_username_unique on profiles (username);

-- Auto-create profile + gift credits on every new signup.
-- Reads signup_gift_credits from platform_settings singleton (id=1).
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
declare
  v_username text;
  v_gift     numeric(6,2);
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );

  select coalesce(signup_gift_credits, 30)
    into v_gift
    from platform_settings
    where id = 1;

  v_gift := coalesce(v_gift, 30);

  insert into public.profiles (user_id, email, username, display_name, credit_balance)
  values (
    new.id, new.email, v_username,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), v_username),
    v_gift
  );

  insert into public.credit_transactions (user_id, delta, balance_after, action_type, note)
  values (new.id, v_gift, v_gift, 'signup_gift', 'Welcome gift');

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
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  slug                     text not null,
  display_name             text,
  design_tokens            jsonb,
  theme_version            int not null default 1,
  content_json             jsonb,
  visibility               space_visibility not null default 'private',
  gallery_status           gallery_status   not null default 'not_submitted',
  gallery_tags             text[] not null default '{}',
  gallery_featured_at      timestamptz,
  og_image_url             text,
  is_primary               bool not null default false,
  reactions_enabled        bool not null default true,
  remix_count              int  not null default 0,
  published_at             timestamptz,
  -- companion
  companion_archetype      text not null default 'sage'
    check (companion_archetype in ('stoic', 'coach', 'poet', 'sage', 'challenger')),
  companion_context        jsonb not null default '{"facts":[]}',
  -- onboarding
  onboarding_emails_sent   int[] not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, slug)
);

create trigger spaces_updated_at before update on spaces
  for each row execute function set_updated_at();

create unique index spaces_one_primary_per_user on spaces (user_id) where is_primary = true;
create index spaces_user_id  on spaces (user_id);
create index spaces_gallery  on spaces (gallery_status, visibility) where gallery_status = 'approved';
create index spaces_gallery_tags on spaces using gin (gallery_tags);

-- ─────────────────────────────────────────────────────────
-- Credit transactions  (immutable ledger)
-- ─────────────────────────────────────────────────────────
create table credit_transactions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  delta                    numeric(6,2) not null,
  balance_after            numeric(6,2) not null,
  action_type              credit_action not null,
  space_id                 uuid references spaces(id) on delete set null,
  stripe_payment_intent_id text,
  note                     text,
  created_at               timestamptz not null default now()
);

create index credit_tx_user on credit_transactions (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────
-- Credit RPCs (service-role only — never client-trusted)
-- ─────────────────────────────────────────────────────────
create or replace function deduct_credits(
  p_user_id  uuid,
  p_delta    numeric,
  p_action   credit_action,
  p_space_id uuid default null,
  p_note     text default null
) returns numeric as $$
declare
  v_balance numeric;
begin
  select credit_balance into v_balance
    from profiles where user_id = p_user_id for update;

  if v_balance < p_delta then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  v_balance := v_balance - p_delta;
  update profiles set credit_balance = v_balance where user_id = p_user_id;

  insert into credit_transactions (user_id, delta, balance_after, action_type, space_id, note)
  values (p_user_id, -p_delta, v_balance, p_action, p_space_id, p_note);

  return v_balance;
end;
$$ language plpgsql security definer;

create or replace function grant_credits(
  p_user_id   uuid,
  p_delta     numeric,
  p_action    credit_action,
  p_cap       numeric default 9999,
  p_stripe_id text default null,
  p_note      text default null
) returns numeric as $$
declare
  v_balance numeric;
begin
  select credit_balance into v_balance
    from profiles where user_id = p_user_id for update;

  v_balance := least(v_balance + p_delta, p_cap);
  update profiles set credit_balance = v_balance where user_id = p_user_id;

  insert into credit_transactions (user_id, delta, balance_after, action_type, stripe_payment_intent_id, note)
  values (p_user_id, p_delta, v_balance, p_action, p_stripe_id, p_note);

  return v_balance;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────
-- Reactions
-- ─────────────────────────────────────────────────────────
create table reactions (
  id              uuid primary key default gen_random_uuid(),
  space_id        uuid not null references spaces(id) on delete cascade,
  visitor_ip_hash text not null,
  message         text not null check (char_length(message) between 1 and 140),
  type            text not null default 'message'
    check (type in ('message', 'energy', 'goal_cheer')),
  goal_id         uuid references spaces(id) on delete set null,
  is_visible      bool not null default false,
  created_at      timestamptz not null default now()
);

create index reactions_space on reactions (space_id, created_at desc);

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

create index moderation_status on moderation_items (status) where status = 'pending';

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
  accepted        bool,
  credits_charged numeric(4,2) not null default 0.25
);

-- ─────────────────────────────────────────────────────────
-- Platform settings  (singleton row, id = 1)
-- ─────────────────────────────────────────────────────────
create table platform_settings (
  id                             int primary key default 1 check (id = 1),
  gallery_enabled                bool        not null default true,
  reactions_enabled              bool        not null default true,
  ai_prompts_enabled             bool        not null default true,
  og_cards_enabled               bool        not null default true,
  new_signups_enabled            bool        not null default true,
  maintenance_mode               bool        not null default false,
  maintenance_message            text        not null default 'We''ll be back shortly.',
  announcement_banner            text,
  resend_from_name               text        not null default 'Spaceful',
  resend_reply_to                text        not null default 'hello@spaceful.io',
  weekly_digest_enabled          bool        not null default true,
  reaction_notifications_enabled bool        not null default true,
  -- credit amounts (10x scale: 1 credit = 1 unit)
  companion_credit_cost          numeric(6,2) not null default 1,
  daily_login_credits            numeric(6,2) not null default 10,
  generation_credit_cost         numeric(6,2) not null default 30,
  regeneration_credit_cost       numeric(6,2) not null default 20,
  signup_gift_credits            numeric(6,2) not null default 30,
  updated_at                     timestamptz not null default now()
);

insert into platform_settings (id) values (1) on conflict do nothing;

-- ─────────────────────────────────────────────────────────
-- AI prompt templates
-- ─────────────────────────────────────────────────────────
create table prompt_templates (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  version     int  not null default 1,
  system_text text not null,
  user_text   text not null,
  is_active   bool not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (key, version)
);

create unique index prompt_templates_one_active_per_key
  on prompt_templates (key) where is_active = true;

-- ─────────────────────────────────────────────────────────
-- Login history
-- ─────────────────────────────────────────────────────────
create table login_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  ip_country text,
  created_at timestamptz not null default now()
);

create index login_history_user on login_history (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────
-- Username blocklist
-- ─────────────────────────────────────────────────────────
create table username_blocklist (
  username text primary key,
  note     text,
  added_at timestamptz not null default now()
);

insert into username_blocklist (username, note) values
  ('admin', 'reserved'), ('support', 'reserved'), ('help', 'reserved'),
  ('gallery', 'reserved'), ('pricing', 'reserved'), ('account', 'reserved'),
  ('spaces', 'reserved'), ('api', 'reserved'), ('static', 'reserved'),
  ('onboard', 'reserved'), ('login', 'reserved'), ('signup', 'reserved'),
  ('logout', 'reserved'), ('about', 'reserved'), ('terms', 'reserved'),
  ('privacy', 'reserved'), ('blog', 'reserved'), ('spaceful', 'reserved'),
  ('staff', 'reserved'), ('team', 'reserved'), ('moderator', 'reserved'),
  ('mod', 'reserved'), ('system', 'reserved'), ('root', 'reserved')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────
-- Space templates
-- ─────────────────────────────────────────────────────────
create table space_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  spec          jsonb not null,
  preview_mood  text not null default 'lavender',
  tags          text[] not null default '{}',
  mood_affinity text[] not null default '{}',
  vibe_keywords text[] not null default '{}',
  is_active     bool not null default true,
  is_featured   bool not null default false,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- Daily pulse entries
-- ─────────────────────────────────────────────────────────
create table daily_pulse_entries (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  period     text not null check (period in ('morning', 'evening', 'ai_letter', 'weekly_synthesis')),
  body       text not null,
  created_at timestamptz not null default now(),
  unique (space_id, entry_date, period)
);

create index daily_pulse_space_date on daily_pulse_entries (space_id, entry_date desc);

-- ─────────────────────────────────────────────────────────
-- Companion
-- ─────────────────────────────────────────────────────────
create table companion_daily (
  space_id   uuid not null references spaces(id) on delete cascade,
  date       date not null,
  archetype  text not null,
  message    text not null,
  quote_id   uuid,
  created_at timestamptz not null default now(),
  primary key (space_id, date)
);

create table companion_interactions (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index companion_interactions_space_time on companion_interactions (space_id, created_at desc);

create table quotes (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  author     text,
  themes     text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- Space snapshots  (monthly letter source)
-- ─────────────────────────────────────────────────────────
create table space_snapshots (
  space_id     uuid not null references spaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  snapshot_at  date not null,
  content_json jsonb not null,
  primary key (space_id, snapshot_at)
);

create index space_snapshots_user on space_snapshots (user_id, snapshot_at desc);

-- ─────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────
alter table profiles             enable row level security;
alter table username_blocklist   enable row level security;
alter table spaces               enable row level security;
alter table credit_transactions  enable row level security;
alter table reactions            enable row level security;
alter table moderation_items     enable row level security;
alter table content_reports      enable row level security;
alter table prompt_log           enable row level security;
alter table platform_settings    enable row level security;
alter table prompt_templates     enable row level security;
alter table login_history        enable row level security;
alter table space_templates      enable row level security;
alter table daily_pulse_entries  enable row level security;
alter table companion_daily      enable row level security;
alter table companion_interactions enable row level security;
alter table quotes               enable row level security;
alter table space_snapshots      enable row level security;

-- profiles
create policy "profiles: owner read"   on profiles for select using (auth.uid() = user_id);
create policy "profiles: owner update" on profiles for update using (auth.uid() = user_id);

-- spaces
create policy "spaces: owner all"   on spaces for all    using (auth.uid() = user_id);
create policy "spaces: public read" on spaces for select using (visibility <> 'private');

-- credit_transactions
create policy "credits: owner read" on credit_transactions for select using (auth.uid() = user_id);

-- reactions
create policy "reactions: open insert" on reactions for insert with check (true);
create policy "reactions: owner read"  on reactions for select
  using (space_id in (select id from spaces where user_id = auth.uid()) or is_visible = true);

-- moderation / content reports / prompt log
create policy "moderation: owner" on moderation_items for select
  using (space_id in (select id from spaces where user_id = auth.uid()));
create policy "prompt_log: owner" on prompt_log for select
  using (space_id in (select id from spaces where user_id = auth.uid()));

-- platform_settings / prompt_templates: public read (feature flags)
create policy "settings: public read"  on platform_settings for select using (true);
create policy "templates: public read" on prompt_templates  for select using (true);

-- login_history
create policy "login_history: owner" on login_history for select using (auth.uid() = user_id);

-- username_blocklist: public read for client-side validation
create policy "blocklist: public read" on username_blocklist for select using (true);

-- space_templates
create policy "Active templates are readable" on space_templates for select using (is_active = true);
create policy "Admins manage templates" on space_templates for all
  using (exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin'));

-- daily_pulse_entries
create policy "owner_all" on daily_pulse_entries for all using (auth.uid() = user_id);
create policy "public_read" on daily_pulse_entries for select
  using (exists (select 1 from spaces s where s.id = daily_pulse_entries.space_id and s.visibility = 'public'));

-- companion_daily
create policy "owner_all" on companion_daily
  using (space_id in (select id from spaces where user_id = auth.uid()))
  with check (space_id in (select id from spaces where user_id = auth.uid()));

-- companion_interactions
create policy "owner_all" on companion_interactions
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- quotes: public read
create policy "public_read" on quotes for select using (true);

-- space_snapshots
create policy "owner_all" on space_snapshots
  using (user_id = auth.uid()) with check (user_id = auth.uid());
