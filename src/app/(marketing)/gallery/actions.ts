'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';

export async function remixSpace(sourceSpaceId: string) {
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to remix a space' };

  // Fetch source space design tokens
  const { data: source } = await supabase
    .from('spaces')
    .select('design_tokens')
    .eq('id', sourceSpaceId)
    .single() as { data: { design_tokens: Record<string, unknown> } | null };

  if (!source) return { error: 'Source space not found' };

  // Fetch viewer's primary space
  const { data: mySpace } = await supabase
    .from('spaces')
    .select('id, design_tokens')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single() as { data: { id: string; design_tokens: Record<string, unknown> } | null };

  if (!mySpace) return { error: "You don't have a space yet" };

  // Apply source layout/template tokens to viewer's space, preserving their palette/mood
  const myTokens = mySpace.design_tokens ?? {};
  const srcTokens = source.design_tokens ?? {};

  const merged = {
    ...myTokens,
    template_id:   srcTokens.template_id   ?? myTokens.template_id,
    spec_override: srcTokens.spec_override  ?? myTokens.spec_override,
    remixed_from_space_id: sourceSpaceId,
  };

  await supabase
    .from('spaces')
    .update({ design_tokens: merged })
    .eq('id', mySpace.id);

  // Increment remix count on source space (best-effort)
  const { data: srcCount } = await supabase
    .from('spaces').select('remix_count').eq('id', sourceSpaceId).single() as { data: { remix_count: number } | null };
  if (srcCount != null) {
    await supabase.from('spaces').update({ remix_count: (srcCount.remix_count ?? 0) + 1 }).eq('id', sourceSpaceId);
  }

  return { ok: true };
}
