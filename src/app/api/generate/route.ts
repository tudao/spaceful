// SSE endpoint: streams AI theme generation progress to the onboarding client.
// Consumes onboarding answers → Claude Sonnet → design_tokens JSON.
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: implement SSE generation pipeline
  // 1. Validate session + credit balance (≥3)
  // 2. Call deduct_credits RPC (atomic, server-side)
  // 3. Stream Claude Sonnet generation via createSSEStream()
  // 4. Validate JSON against DesignTokensSchema (zod), retry ×2, fallback to default theme
  // 5. Persist spaces row + design_tokens, publish_at
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
