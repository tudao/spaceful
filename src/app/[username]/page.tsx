/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SpaceView } from './SpaceView';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserSpacePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // resolve profile for this username
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('user_id, username, display_name, credit_balance')
    .eq('username', username)
    .single() as { data: { user_id: string; username: string; display_name: string | null; credit_balance: number } | null };

  if (!profile) notFound();

  // fetch primary space
  const { data: space } = await (supabase as any)
    .from('spaces')
    .select('id, slug, display_name, design_tokens, content_json, visibility, reactions_enabled')
    .eq('user_id', profile.user_id)
    .eq('is_primary', true)
    .single() as {
      data: {
        id: string; slug: string; display_name: string | null;
        design_tokens: Record<string, unknown> | null;
        content_json: Record<string, unknown> | null;
        visibility: string; reactions_enabled: boolean;
      } | null;
    };

  const isOwner = user?.id === profile.user_id;

  if (!isOwner && space?.visibility === 'private') {
    return <SpaceView username={username} isPrivate />;
  }

  if (!space) {
    if (isOwner) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>No space yet</h2>
            <p style={{ color: 'var(--app-text-2)', marginBottom: 24 }}>Create your first space to see it here.</p>
            <a href="/onboard" className="btn btn-primary">Start designing →</a>
          </div>
        </div>
      );
    }
    notFound();
  }

  // reactions: owner sees all, visitor sees only public ones
  const rxQuery = (supabase as any)
    .from('reactions')
    .select('id, message, created_at')
    .eq('space_id', space.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!isOwner) rxQuery.eq('is_visible', true);
  const { data: reactions } = await rxQuery as { data: { id: string; message: string; created_at: string }[] | null };

  return (
    <SpaceView
      username={username}
      space={space}
      isOwner={isOwner}
      reactions={reactions ?? []}
      creditBalance={isOwner ? profile.credit_balance : 0}
    />
  );
}
