import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

function unsubscribeUrl(userId: string): string {
  const exp = String(Date.now() + 30 * 24 * 3600_000);
  const secret = process.env.RESEND_SIGNING_SECRET ?? process.env.RESEND_API_KEY ?? 'fallback';
  const token = createHmac('sha256', secret).update(`${userId}:${exp}`).digest('hex');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io';
  return `${base}/api/unsubscribe?uid=${userId}&exp=${exp}&token=${token}`;
}

function digestHtml(username: string, knockCount: number, knocks: { message: string | null; type: string }[], unsubUrl: string): string {
  const knockHtml = knocks.slice(0, 5).map(k => {
    if (k.type === 'energy') return `<li style="margin-bottom:8px">✦ Someone sent you energy</li>`;
    return `<li style="margin-bottom:8px">"${(k.message ?? '').slice(0, 80)}"</li>`;
  }).join('');

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;color:#1a1a2e">
    <h2 style="font-size:24px;margin-bottom:4px">Your weekly space digest</h2>
    <p style="color:#666;margin-bottom:32px">Here's what happened on your space this week.</p>
    ${knockCount > 0 ? `<h3 style="font-size:16px;margin-bottom:12px">${knockCount} knock${knockCount !== 1 ? 's' : ''} this week</h3><ul style="padding:0;list-style:none;background:#f8f8fc;border-radius:12px;padding:16px 20px">${knockHtml}</ul>` : ''}
    <div style="margin-top:28px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io'}/${username}" style="display:inline-block;background:#7c6fe0;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700">Open your space →</a>
    </div>
    <p style="margin-top:40px;font-size:12px;color:#999"><a href="${unsubUrl}" style="color:#999">Unsubscribe</a> from these emails</p>
  </body></html>`;
}

export async function POST(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any;
  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  // Find spaces with recent knocks whose owners haven't opted out
  const { data: spaces } = await supabase
    .from('spaces')
    .select('id, user_id, slug, profiles!inner(user_id, username, email, email_digest_opted_out)')
    .eq('reactions_enabled', true)
    .eq('profiles.email_digest_opted_out', false);

  let sent = 0, failed = 0;
  for (const space of spaces ?? []) {
    const profile = space.profiles;
    if (!profile?.email) continue;

    const { data: knocks, count } = await supabase
      .from('reactions')
      .select('type, message', { count: 'exact' })
      .eq('space_id', space.id)
      .gte('created_at', since)
      .limit(5);

    if ((count ?? 0) === 0) continue;

    const html = digestHtml(profile.username, count ?? 0, knocks ?? [], unsubscribeUrl(profile.user_id));
    try {
      await resend.emails.send({
        from: 'Spaceful <digest@spaceful.io>',
        to: profile.email,
        subject: `${count} new knock${count !== 1 ? 's' : ''} on your space this week`,
        html,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
