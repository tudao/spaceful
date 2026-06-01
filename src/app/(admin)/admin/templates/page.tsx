/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { TemplateEditor } from './TemplateEditor';
import { BASE_TEMPLATE_SPECS } from '@/components/space/engine/utils';

export default async function AdminTemplatesPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from('space_templates')
    .select('*')
    .order('created_at', { ascending: false });

  const fallback = Object.entries(BASE_TEMPLATE_SPECS).map(([slug, spec]) => ({
    id: slug,
    slug,
    name: slug[0].toUpperCase() + slug.slice(1),
    description: null,
    spec,
    preview_mood: slug === 'cosmos' ? 'midnight' : slug === 'journal' ? 'sand' : 'lavender',
    tags: [],
    mood_affinity: [],
    vibe_keywords: [],
    is_active: true,
    is_featured: true,
  }));

  return <TemplateEditor initialTemplates={(data?.length ? data : fallback) as any} />;
}

