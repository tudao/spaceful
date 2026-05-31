-- Phase 2: Visitor knocks, email opt-out, gallery columns

alter table reactions
  add column if not exists type text not null default 'message'
    check (type in ('message', 'energy', 'goal_cheer')),
  add column if not exists goal_id uuid references spaces(id) on delete set null;

alter table profiles
  add column if not exists email_digest_opted_out bool not null default false;

alter table spaces
  add column if not exists gallery_featured_at timestamptz,
  add column if not exists remix_count int not null default 0;
