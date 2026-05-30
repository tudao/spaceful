'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';

export async function switchTemplate(spaceId: string, templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthenticated' };

  // verify ownership
  const { data: space } = await (supabase as any)
    .from('spaces')
    .select('user_id, design_tokens')
    .eq('id', spaceId)
    .single() as { data: { user_id: string; design_tokens: Record<string, unknown> | null } | null };

  if (!space || space.user_id !== user.id) return { error: 'forbidden' };

  const updated = { ...(space.design_tokens ?? {}), template_id: templateId };

  const { error } = await (supabase as any)
    .from('spaces')
    .update({ design_tokens: updated })
    .eq('id', spaceId);

  if (error) return { error: (error as any).message };
  return { ok: true };
}
