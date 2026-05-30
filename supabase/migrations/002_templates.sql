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

insert into space_templates (slug, name, description, spec, preview_mood, tags, mood_affinity, vibe_keywords, is_featured)
values
  (
    'garden',
    'Garden',
    'Botanical header with animated stems and warm glass cards',
    '{"version":1,"layout":{"header_style":"botanical","sections":["goals","currently","focus_hero","notepad","kanban"],"max_width":980,"density":"rich"},"decoration":{"type":"botanicals","density":"lush","animated":true,"fixed_background":true},"cards":{"style":"glass","radius":20,"shadow":"soft"},"typography":{"title_scale":"xl","weight":800,"header_uppercase":false}}',
    'lavender',
    array['botanical','soft','featured'],
    array['lavender','rose','forest','sand'],
    array['dreamy','cozy','calm','creative','grounded','playful'],
    true
  ),
  (
    'cosmos',
    'Cosmos',
    'Dark starfield with glowing orbs and editorial typography',
    '{"version":1,"layout":{"header_style":"cosmic","sections":["goals","currently","focus_hero","notepad","streak"],"max_width":980,"density":"balanced"},"decoration":{"type":"starfield","density":"medium","animated":true,"fixed_background":true},"cards":{"style":"glass","radius":20,"shadow":"medium"},"typography":{"title_scale":"2xl","weight":800,"header_uppercase":false}}',
    'midnight',
    array['cosmic','dark','featured'],
    array['midnight','ocean','forest'],
    array['bold','focused','minimal','energetic'],
    true
  ),
  (
    'journal',
    'Journal',
    'Warm editorial layout with paper cards and quiet structure',
    '{"version":1,"layout":{"header_style":"editorial","sections":["goals","currently","focus_hero","notepad","quote"],"max_width":860,"density":"spacious"},"decoration":{"type":"minimal","density":"minimal","animated":false,"fixed_background":false},"cards":{"style":"paper","radius":16,"shadow":"soft"},"typography":{"title_scale":"display","weight":800,"header_uppercase":false}}',
    'sand',
    array['editorial','paper','featured'],
    array['sand','lavender','rose'],
    array['calm','creative','minimal','dreamy','grounded'],
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  spec = excluded.spec,
  preview_mood = excluded.preview_mood,
  tags = excluded.tags,
  mood_affinity = excluded.mood_affinity,
  vibe_keywords = excluded.vibe_keywords,
  is_featured = excluded.is_featured;

