'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from '@/lib/supabase/server';

export async function featureSpace(spaceId: string) {
  const svc = await createServiceClient() as any;

  // Clear any previously featured space
  await svc.from('spaces').update({ gallery_featured_at: null }).not('gallery_featured_at', 'is', null);

  // Feature this space
  const { error } = await svc
    .from('spaces')
    .update({ gallery_featured_at: new Date().toISOString() })
    .eq('id', spaceId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function approveForGallery(spaceId: string) {
  const svc = await createServiceClient() as any;
  const { error } = await svc
    .from('spaces')
    .update({ gallery_status: 'approved', visibility: 'public' })
    .eq('id', spaceId);
  if (error) return { error: error.message };
  return { ok: true };
}
