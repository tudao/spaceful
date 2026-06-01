import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// GET: fetch entries + streak for Journal tab
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const space_id = searchParams.get('space_id');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 120);
  if (!space_id) return NextResponse.json({ error: 'space_id required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: entries } = await supabase
    .from('daily_pulse_entries')
    .select('id, entry_date, period, body, created_at')
    .eq('space_id', space_id)
    .order('entry_date', { ascending: false })
    .order('period', { ascending: true })
    .limit(limit);

  // Streak: scan backwards from yesterday, count consecutive days with ≥1 entry
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400_000);

  const dates = new Set((entries ?? []).map((e: { entry_date: string }) => e.entry_date));
  let streak = 0;
  const cur = new Date(yesterday);
  for (let i = 0; i < 365; i++) {
    const key = cur.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }

  const todayKey = today.toISOString().slice(0, 10);
  const today_logged = dates.has(todayKey);

  return NextResponse.json({ entries: entries ?? [], streak, today_logged });
}

const PostSchema = z.object({
  space_id: z.string().uuid().optional(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.enum(['morning', 'evening']),
  body: z.string().min(1).max(280),
});

// POST: save a pulse entry (upsert)
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  // Resolve space_id from user's primary space if not provided
  let { space_id } = parsed.data;
  if (!space_id) {
    const { data: space } = await supabase
      .from('spaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();
    space_id = space?.id;
  }
  if (!space_id) return NextResponse.json({ error: 'No space' }, { status: 400 });

  const { error } = await supabase.from('daily_pulse_entries').upsert({
    space_id,
    user_id: user.id,
    entry_date: parsed.data.entry_date,
    period: parsed.data.period,
    body: parsed.data.body,
  }, { onConflict: 'space_id,entry_date,period' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
