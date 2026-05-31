'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import type { SpaceContent } from '@/components/space/SpacePage';

export async function saveSpaceContent(spaceId: string, content: SpaceContent) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthenticated' };

  // verify ownership before writing
  const { data: space } = await (supabase as any)
    .from('spaces')
    .select('user_id')
    .eq('id', spaceId)
    .single() as { data: { user_id: string } | null };

  if (!space || space.user_id !== user.id) return { error: 'forbidden' };

  const content_json = {
    title:       content.title,
    subtitle:    content.subtitle    ?? '',
    currently:   content.currently   ?? '',
    hero_title:  content.heroTitle   ?? '',
    hero_notes:  content.heroNotes   ?? '',
    notepad:     content.notepad     ?? '',
    goals: content.goals.map(g => ({ id: g.id, text: g.text, done: g.done })),
    periods: (content.periods ?? []).map(p => ({ week: p.week, title: p.title, notes: p.notes, status: p.status })),
    habits: (content.habits ?? []).map(h => ({ id: h.id, label: h.label, days: h.days })),
    reading_list: (content.readingList ?? []).map(item => ({ id: item.id, title: item.title, meta: item.meta ?? '', status: item.status ?? 'queued' })),
    quote: content.quote ?? null,
    photo: content.photo ?? null,
  };

  const { error } = await (supabase as any)
    .from('spaces')
    .update({ content_json, display_name: content.title })
    .eq('id', spaceId);

  if (error) return { error: (error as any).message };
  return { ok: true };
}

export async function remixThisSpace(sourceSpaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to remix a space' };

  const { data: source } = await (supabase as any)
    .from('spaces')
    .select('design_tokens, remix_count')
    .eq('id', sourceSpaceId)
    .single() as { data: { design_tokens: Record<string, unknown>; remix_count: number } | null };

  if (!source) return { error: 'Space not found' };

  const { data: mySpace } = await (supabase as any)
    .from('spaces')
    .select('id, design_tokens')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single() as { data: { id: string; design_tokens: Record<string, unknown> } | null };

  if (!mySpace) return { error: "You don't have a space yet" };

  const merged = {
    ...(mySpace.design_tokens ?? {}),
    template_id:   source.design_tokens?.template_id ?? (mySpace.design_tokens as any)?.template_id,
    spec_override: source.design_tokens?.spec_override,
    remixed_from_space_id: sourceSpaceId,
  };

  await (supabase as any).from('spaces').update({ design_tokens: merged }).eq('id', mySpace.id);
  await (supabase as any).from('spaces').update({ remix_count: (source.remix_count ?? 0) + 1 }).eq('id', sourceSpaceId);

  return { ok: true };
}

export async function saveCompanionArchetype(spaceId: string, archetype: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthenticated' };

  const { error } = await (supabase as any)
    .from('spaces')
    .update({ companion_archetype: archetype })
    .eq('id', spaceId)
    .eq('user_id', user.id);

  if (error) return { error: (error as any).message };
  return { ok: true };
}
