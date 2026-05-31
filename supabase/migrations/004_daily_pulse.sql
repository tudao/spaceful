-- Phase 3: Daily Pulse entries (morning/evening/ai_letter)

create table if not exists daily_pulse_entries (
  id           uuid primary key default gen_random_uuid(),
  space_id     uuid not null references spaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  entry_date   date not null,
  period       text not null check (period in ('morning', 'evening', 'ai_letter')),
  body         text not null,
  created_at   timestamptz not null default now(),
  unique (space_id, entry_date, period)
);

alter table daily_pulse_entries enable row level security;

create policy "owner_all" on daily_pulse_entries
  for all using (auth.uid() = user_id);

create policy "public_read" on daily_pulse_entries
  for select using (
    exists (
      select 1 from spaces s
      where s.id = daily_pulse_entries.space_id
        and s.visibility = 'public'
    )
  );

create index daily_pulse_space_date on daily_pulse_entries (space_id, entry_date desc);
