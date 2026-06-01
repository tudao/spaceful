-- Spaceful local seed data.
-- Applied by `supabase db reset` after migrations.

insert into space_templates (slug, name, description, spec, preview_mood, tags, mood_affinity, vibe_keywords, is_featured, is_active)
values
  (
    'garden',
    'Garden',
    'Anime-inspired garden world with petals, fireflies, and warm glass cards',
    '{"version":1,"layout":{"header_style":"botanical","sections":["goals","currently","focus_hero","notepad","kanban","habit_tracker","reading_list","photo","quote"],"max_width":980,"density":"rich"},"decoration":{"type":"botanicals","density":"lush","animated":true,"fixed_background":true},"scene":{"image":"/templates/garden-anime.jpg","position":"right","overlay":"light"},"cards":{"style":"glass","radius":20,"shadow":"soft"},"typography":{"title_scale":"xl","weight":800,"header_uppercase":false}}'::jsonb,
    'lavender',
    array['botanical','soft','featured'],
    array['lavender','rose','forest','sand'],
    array['dreamy','cozy','calm','creative','grounded','playful'],
    true,
    true
  ),
  (
    'cosmos',
    'Cosmos',
    'Anime-inspired cosmic world with stars, planets, and focused glass cards',
    '{"version":1,"layout":{"header_style":"cosmic","sections":["goals","currently","focus_hero","notepad","kanban","habit_tracker","reading_list","photo","quote"],"max_width":980,"density":"balanced"},"decoration":{"type":"starfield","density":"medium","animated":true,"fixed_background":true},"scene":{"image":"/templates/cosmos-anime.jpg","position":"right","overlay":"dark"},"cards":{"style":"glass","radius":20,"shadow":"medium"},"typography":{"title_scale":"2xl","weight":800,"header_uppercase":false}}'::jsonb,
    'midnight',
    array['cosmic','dark','featured'],
    array['midnight','ocean','forest'],
    array['bold','focused','minimal','energetic'],
    true,
    true
  ),
  (
    'sky',
    'Sky',
    'Anime-inspired sky island world with clouds and birds in motion',
    '{"version":1,"layout":{"header_style":"minimal","sections":["goals","currently","focus_hero","notepad","kanban","habit_tracker","reading_list","photo","quote"],"max_width":980,"density":"balanced"},"decoration":{"type":"clouds","density":"medium","animated":true,"fixed_background":true},"scene":{"image":"/templates/sky-anime.jpg","position":"right","overlay":"light"},"cards":{"style":"solid","radius":20,"shadow":"soft"},"typography":{"title_scale":"xl","weight":800,"header_uppercase":false}}'::jsonb,
    'ocean',
    array['sky','clouds','featured'],
    array['ocean','lavender','sand'],
    array['calm','dreamy','minimal','playful','creative'],
    true,
    true
  ),
  (
    'ocean',
    'Ocean',
    'Anime-inspired underwater reef world with swimming fish and soft blue glass',
    '{"version":1,"layout":{"header_style":"wave","sections":["goals","currently","focus_hero","notepad","kanban","habit_tracker","reading_list","photo","quote"],"max_width":980,"density":"rich"},"decoration":{"type":"waves","density":"lush","animated":true,"fixed_background":true},"scene":{"image":"/templates/ocean-anime.jpg","position":"right","overlay":"medium"},"cards":{"style":"glass","radius":20,"shadow":"soft"},"typography":{"title_scale":"xl","weight":800,"header_uppercase":false}}'::jsonb,
    'ocean',
    array['ocean','waves','featured'],
    array['ocean','midnight','lavender'],
    array['calm','focused','grounded','creative','dreamy'],
    true,
    true
  ),
  (
    'journal',
    'Journal',
    'Warm anime-inspired study nook with paper cards and spacious structure',
    '{"version":1,"layout":{"header_style":"editorial","sections":["goals","currently","focus_hero","notepad","kanban","habit_tracker","reading_list","photo","quote"],"max_width":860,"density":"spacious"},"decoration":{"type":"minimal","density":"minimal","animated":false,"fixed_background":false},"scene":{"image":"/templates/journal-anime.jpg","position":"right","overlay":"light"},"cards":{"style":"paper","radius":16,"shadow":"soft"},"typography":{"title_scale":"display","weight":800,"header_uppercase":false}}'::jsonb,
    'sand',
    array['editorial','paper','featured'],
    array['sand','lavender','rose'],
    array['calm','creative','minimal','dreamy','grounded'],
    true,
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
  is_featured = excluded.is_featured,
  is_active = excluded.is_active;
