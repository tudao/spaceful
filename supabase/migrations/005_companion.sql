-- Phase 4: Space Companion
-- IMPORTANT: extend enum BEFORE creating tables that reference it

alter type credit_action add value if not exists 'companion_chat';

-- Daily companion message cache (one per space per day)
create table if not exists companion_daily (
  space_id    uuid not null references spaces(id) on delete cascade,
  date        date not null,
  archetype   text not null,
  message     text not null,
  quote_id    uuid,
  created_at  timestamptz not null default now(),
  primary key (space_id, date)
);
alter table companion_daily enable row level security;
create policy "owner_all" on companion_daily
  using (space_id in (select id from spaces where user_id = auth.uid()))
  with check (space_id in (select id from spaces where user_id = auth.uid()));

-- Companion chat interactions (for future context window)
create table if not exists companion_interactions (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references spaces(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
alter table companion_interactions enable row level security;
create policy "owner_all" on companion_interactions
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index companion_interactions_space_time on companion_interactions (space_id, created_at desc);

-- Curated quotes (seeded from src/data/quotes.json via admin)
create table if not exists quotes (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  author      text,
  themes      text[] not null default '{}',
  created_at  timestamptz not null default now()
);
alter table quotes enable row level security;
create policy "public_read" on quotes for select using (true);

-- Archetype stored on spaces
alter table spaces
  add column if not exists companion_archetype text not null default 'sage'
    check (companion_archetype in ('stoic', 'coach', 'poet', 'sage', 'challenger'));
