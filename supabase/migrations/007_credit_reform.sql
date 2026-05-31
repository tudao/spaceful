-- Credit reform: 10x scaling, daily login grant, platform settings

-- Add daily_login to credit_action enum
alter type credit_action add value if not exists 'daily_login';

-- Track last daily credit grant on profiles
alter table profiles
  add column if not exists last_daily_credit_at date;

-- Update signup gift from 3 → 30 in the trigger
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
declare
  v_username text;
  v_gift     int;
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );

  select coalesce((value::int), 30)
    into v_gift
    from platform_settings
    where key = 'signup_gift_credits';

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

-- Platform settings table (admin-editable credit amounts)
create table if not exists platform_settings (
  key   text primary key,
  value jsonb not null
);
alter table platform_settings enable row level security;
-- Only service role can read/write (admin routes use service client)
create policy "service_only" on platform_settings using (false);

insert into platform_settings (key, value) values
  ('companion_credit_cost',    '1'),
  ('daily_login_credits',      '10'),
  ('generation_credit_cost',   '30'),
  ('regeneration_credit_cost', '20'),
  ('signup_gift_credits',      '30')
on conflict (key) do nothing;

-- Extend daily_pulse_entries period constraint to include weekly_synthesis
alter table daily_pulse_entries
  drop constraint if exists daily_pulse_entries_period_check;
alter table daily_pulse_entries
  add constraint daily_pulse_entries_period_check
    check (period in ('morning', 'evening', 'ai_letter', 'weekly_synthesis'));
