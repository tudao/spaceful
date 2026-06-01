-- Add language preference to profiles
alter table profiles
  add column if not exists preferred_language text not null default 'en';
