import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');
  const exp = searchParams.get('exp');

  if (!token || !uid || !exp) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });

  const expiry = parseInt(exp, 10);
  if (isNaN(expiry) || Date.now() > expiry) return NextResponse.json({ error: 'Link expired' }, { status: 400 });

  const secret = process.env.RESEND_SIGNING_SECRET ?? process.env.RESEND_API_KEY ?? 'fallback';
  const expected = createHmac('sha256', secret).update(`${uid}:${exp}`).digest('hex');
  if (token !== expected) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any;
  await supabase.from('profiles').update({ email_digest_opted_out: true }).eq('user_id', uid);

  return new Response(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>Unsubscribed</h2><p>You won't receive weekly digests from Spaceful anymore.</p>
      <a href="/">Back to Spaceful</a></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
