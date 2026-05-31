-- Companion persistent memory + profiles email trigger columns + onboarding tracking

-- Companion context on spaces
alter table spaces
  add column if not exists companion_context jsonb not null default '{"facts":[]}';

-- Morning email trigger columns on profiles
alter table profiles
  add column if not exists morning_email_enabled    bool    not null default false,
  add column if not exists morning_email_hour       int     not null default 7
    check (morning_email_hour between 0 and 23),
  add column if not exists morning_email_timezone   text    not null default 'UTC',
  add column if not exists morning_email_sent_date  date;

-- Activation email tracking on spaces
alter table spaces
  add column if not exists onboarding_emails_sent   int[]   not null default '{}';

-- Username availability: add unique index (already enforced by profiles unique constraint on username in 001)
-- Confirm it exists
create unique index if not exists profiles_username_unique on profiles (username);
