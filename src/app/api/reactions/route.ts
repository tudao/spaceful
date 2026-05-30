// Visitor reaction submission. Rate-limited: 3/space/IP/hour (app-layer, not RLS).
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';

const ReactionSchema = z.object({
  space_id: z.string().uuid(),
  message:  z.string().min(1).max(140),
});

export async function POST(request: Request) {
  // TODO: implement rate limit check + insert
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
