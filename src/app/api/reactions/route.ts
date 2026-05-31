import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';

const Schema = z.object({
  space_id: z.string().uuid(),
  type: z.enum(['message', 'energy', 'goal_cheer']).default('message'),
  message: z.string().min(1).max(140).optional(),
  goal_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { space_id, type, message, goal_id } = parsed.data;

  if (type === 'message' && !message) return NextResponse.json({ error: 'message required' }, { status: 400 });
  if (type === 'goal_cheer' && !message) return NextResponse.json({ error: 'message required' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const visitor_ip_hash = createHash('sha256').update(ip + space_id).digest('hex');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // DB-based rate limit (3/space/IP/hour) — safe across serverless instances
  try {
    const { count } = await supabase
      .from('reactions')
      .select('id', { count: 'exact', head: true })
      .eq('visitor_ip_hash', visitor_ip_hash)
      .eq('space_id', space_id)
      .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

    if ((count ?? 0) >= 3) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
  } catch {
    // fail open — don't block knocks due to a slow rate-limit query
  }

  const { error } = await supabase.from('reactions').insert({
    space_id,
    type,
    message: message ?? null,
    goal_id: goal_id ?? null,
    visitor_ip_hash,
    is_visible: false,
  });

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
