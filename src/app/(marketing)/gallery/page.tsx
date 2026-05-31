import { createClient } from '@/lib/supabase/server';
import { GalleryClient, type GallerySpace } from './GalleryClient';
import type { SpaceMood } from '@/lib/utils';

export default async function GalleryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Auth check (non-blocking — just used to show Remix buttons)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch approved public spaces with owner username
  const { data: rows } = await supabase
    .from('spaces')
    .select('id, slug, display_name, design_tokens, content_json, gallery_featured_at, remix_count, profiles!inner(username)')
    .eq('gallery_status', 'approved')
    .eq('visibility', 'public')
    .order('gallery_featured_at', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(32) as { data: Array<{
      id: string;
      slug: string;
      display_name: string | null;
      design_tokens: Record<string, unknown> | null;
      content_json: Record<string, unknown> | null;
      gallery_featured_at: string | null;
      remix_count: number;
      profiles: { username: string };
    }> | null };

  function toGallerySpace(row: NonNullable<typeof rows>[number]): GallerySpace {
    const dt = row.design_tokens ?? {};
    const cj = row.content_json ?? {};
    const vibes = Array.isArray(cj.vibes) ? (cj.vibes as string[]) : [];
    return {
      id:                  row.id,
      slug:                row.slug,
      display_name:        row.display_name ?? 'Unnamed space',
      username:            row.profiles?.username ?? row.slug,
      mood:                (dt.mood as SpaceMood) ?? 'lavender',
      vibes,
      gallery_featured_at: row.gallery_featured_at,
      remix_count:         row.remix_count ?? 0,
    };
  }

  const spaces = (rows ?? []).map(toGallerySpace);
  const featured = spaces.filter(s => s.gallery_featured_at != null);
  const recent   = spaces.filter(s => s.gallery_featured_at == null);

  return <GalleryClient featured={featured} recent={recent} isLoggedIn={!!user} />;
}
