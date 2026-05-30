'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';

interface GeneratedTokens {
  mood?: SpaceMood;
  layout_variant?: string;
  animation_level?: string;
  template_id?: string;
  palette?: Record<string, string>;
  tagline?: string;
  hero_title_placeholder?: string;
  notepad_starter?: string;
  currently_placeholder?: string;
}

interface PublishSpaceInput {
  name: string;
  vibes: string[];
  goal: string;
  mood: SpaceMood;
  layout: 'spacious' | 'rich';
  generatedTokens?: GeneratedTokens;
}

export async function publishSpace(input: PublishSpaceInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/onboard');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('username, credit_balance')
    .eq('user_id', user.id)
    .single() as { data: { username: string; credit_balance: number } | null };

  if (!profile) redirect('/login?next=/onboard');
  if (profile.credit_balance < 3) return { error: 'insufficient_credits' };

  const palette = SPACE_PALETTES[input.mood];
  // Use AI-generated tokens if available; fall back to the preset palette
  const gt = input.generatedTokens;
  const design_tokens = {
    mood:            (gt?.mood ?? input.mood) as SpaceMood,
    layout_variant:  gt?.layout_variant ?? input.layout,
    animation_level: gt?.animation_level ?? 'subtle',
    template_id:     gt?.template_id ?? 'garden',
    tagline:                  gt?.tagline ?? '',
    hero_title_placeholder:   gt?.hero_title_placeholder ?? '',
    currently_placeholder:    gt?.currently_placeholder  ?? '',
    palette: gt?.palette ?? {
      bg:      palette.bg,
      bg2:     palette.bg2,
      surface: palette.surface,
      accent:  palette.accent,
      accent2: palette.accent2,
      text:    palette.text,
      text2:   palette.text2,
      glow:    palette.glow,
    },
  };

  const content_json = {
    title:     input.name,
    subtitle:  gt?.tagline ?? '',
    currently: gt?.currently_placeholder ?? '',
    hero_title: gt?.hero_title_placeholder ?? '',
    notepad:   gt?.notepad_starter ?? '',
    goals: [
      ...(input.goal ? [{ id: '1', text: input.goal, done: false }] : []),
      ...input.vibes.slice(0, 2).map((v, i) => ({ id: String(i + 2), text: v, done: false })),
    ],
  };

  const baseSlug = input.name
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'my-space';

  const { count } = await (supabase as any)
    .from('spaces')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id) as { count: number | null };

  const isPrimary = (count ?? 0) === 0;

  // deduct credits atomically via service-role RPC
  const svc = await createServiceClient();
  const { error: creditError } = await (svc as any).rpc('deduct_credits', {
    p_user_id: user.id,
    p_delta:   3,
    p_action:  'generation',
    p_note:    `Generated "${input.name}"`,
  }) as { error: { message: string } | null };

  if (creditError) {
    return { error: creditError.message?.includes('insufficient_credits') ? 'insufficient_credits' : creditError.message };
  }

  const spaceData = {
    user_id: user.id, slug: baseSlug, display_name: input.name,
    design_tokens, content_json,
    visibility: 'link_only', gallery_status: 'not_submitted',
    is_primary: isPrimary, published_at: new Date().toISOString(),
  };

  const { data: space, error: spaceError } = await (supabase as any)
    .from('spaces').insert(spaceData).select('slug').single() as
    { data: { slug: string } | null; error: { code: string; message: string } | null };

  if (spaceError) {
    if (spaceError.code === '23505') {
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: s2, error: e2 } = await (supabase as any)
        .from('spaces').insert({ ...spaceData, slug }).select('slug').single() as
        { data: { slug: string } | null; error: { message: string } | null };
      if (e2) return { error: e2.message };
      redirect(isPrimary ? `/${profile.username}` : `/${profile.username}/${s2?.slug}`);
    }
    return { error: spaceError.message };
  }

  redirect(isPrimary ? `/${profile.username}` : `/${profile.username}/${space?.slug}`);
}
