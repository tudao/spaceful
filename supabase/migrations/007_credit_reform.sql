-- Credit reform: 10x scaling, daily login grant, platform settings

-- Add daily_login to credit_action enum
alter type credit_action add value if not exists 'daily_login';

-- Track last daily credit grant on profiles
alter table profiles
  add column if not exists last_daily_credit_at date;

-- Add credit amount columns to existing platform_settings singleton (id=1)
alter table platform_settings
  add column if not exists companion_credit_cost    numeric(6,2) not null default 1,
  add column if not exists daily_login_credits      numeric(6,2) not null default 10,
  add column if not exists generation_credit_cost   numeric(6,2) not null default 30,
  add column if not exists regeneration_credit_cost numeric(6,2) not null default 20,
  add column if not exists signup_gift_credits      numeric(6,2) not null default 30;

-- Update signup gift from 3 → 30 in the trigger (reads from singleton row)
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

-- Extend daily_pulse_entries period constraint to include weekly_synthesis
alter table daily_pulse_entries
  drop constraint if exists daily_pulse_entries_period_check;
alter table daily_pulse_entries
  add constraint daily_pulse_entries_period_check
    check (period in ('morning', 'evening', 'ai_letter', 'weekly_synthesis'));
