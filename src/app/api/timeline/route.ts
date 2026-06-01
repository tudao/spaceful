import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const space_id = searchParams.get('space_id');
  if (!space_id) return NextResponse.json({ error: 'space_id required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  // Verify ownership (timeline is private)
  const { data: space } = await supabase
    .from('spaces')
    .select('user_id')
    .eq('id', space_id)
    .single() as { data: { user_id: string } | null };

  if (!space || space.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ data: snapshots }, { data: letters }] = await Promise.all([
    supabase
      .from('space_snapshots')
      .select('snapshot_at, content_json')
      .eq('space_id', space_id)
      .order('snapshot_at', { ascending: false })
      .limit(24),
    supabase
      .from('daily_pulse_entries')
      .select('entry_date, body')
      .eq('space_id', space_id)
      .eq('period', 'ai_letter')
      .order('entry_date', { ascending: false })
      .limit(24),
  ]);

  return NextResponse.json({ snapshots: snapshots ?? [], letters: letters ?? [] });
}
