import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Runs on 1st of each month at 00:01 UTC (vercel.json cron)
// Idempotent: WHERE NOT EXISTS guard; batches 100 spaces per run
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  const today = new Date().toISOString().slice(0, 10);

  // Fetch up to 100 spaces that don't yet have a snapshot for today
  const { data: spaces, error } = await svc
    .from('spaces')
    .select('id, user_id, content_json')
    .filter('id', 'not.in', `(
      SELECT space_id FROM space_snapshots WHERE snapshot_at = '${today}'
    )`)
    .not('content_json', 'is', null)
    .limit(100) as { data: { id: string; user_id: string; content_json: unknown }[] | null; error: unknown };

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  if (!spaces || spaces.length === 0) return NextResponse.json({ ok: true, snapshotted: 0 });

  const rows = spaces.map(s => ({
    space_id:     s.id,
    user_id:      s.user_id,
    snapshot_at:  today,
    content_json: s.content_json,
  }));

  const { error: insertError } = await svc
    .from('space_snapshots')
    .upsert(rows, { onConflict: 'space_id,snapshot_at', ignoreDuplicates: true });

  if (insertError) return NextResponse.json({ error: 'Insert failed' }, { status: 500 });

  return NextResponse.json({ ok: true, snapshotted: rows.length });
}
