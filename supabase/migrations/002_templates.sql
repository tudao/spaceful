-- Spec-driven templates

create table if not exists space_templates (
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

alter table space_templates enable row level security;

create policy "Active templates are readable"
  on space_templates for select
  using (is_active = true);

create policy "Admins manage templates"
  on space_templates for all
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'admin'
    )
  );
