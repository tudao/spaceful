import { createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

function unsubscribeUrl(userId: string): string {
  const exp = String(Date.now() + 30 * 24 * 3600_000);
  const secret = process.env.RESEND_SIGNING_SECRET ?? process.env.RESEND_API_KEY ?? 'fallback';
  const token = createHmac('sha256', secret).update(`${userId}:${exp}`).digest('hex');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io';
  return `${base}/api/unsubscribe?uid=${userId}&exp=${exp}&token=${token}`;
}

// Runs every hour — cron: 0 * * * *
// Sends morning email to users whose morning_email_hour matches the current UTC hour
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  const today = new Date().toISOString().slice(0, 10);
  const currentHour = new Date().getUTCHours();

  // Paginate with cursor — 100 per run to stay within function timeout
  const { data: profiles } = await svc
    .from('profiles')
    .select('user_id, username, email, morning_email_hour, morning_email_timezone')
    .eq('morning_email_enabled', true)
    .eq('morning_email_hour', currentHour)
    .or(`morning_email_sent_date.is.null,morning_email_sent_date.lt.${today}`)
    .limit(100) as {
      data: Array<{ user_id: string; username: string; email: string; morning_email_hour: number; morning_email_timezone: string }> | null
    };

  if (!profiles || profiles.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;

  for (const profile of profiles) {
    // Fetch their primary space streak + today's companion daily message
    const { data: space } = await svc
      .from('spaces')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('is_primary', true)
      .maybeSingle() as { data: { id: string } | null };

    let streak = 0;
    let companionMessage = 'Take it one step at a time today.';

    if (space) {
      const { data: daily } = await svc
        .from('companion_daily')
        .select('message')
        .eq('space_id', space.id)
        .eq('date', today)
        .maybeSingle() as { data: { message: string } | null };
      if (daily) companionMessage = daily.message;

      const { data: entries } = await svc
        .from('daily_pulse_entries')
        .select('entry_date')
        .eq('space_id', space.id)
        .order('entry_date', { ascending: false })
        .limit(60) as { data: { entry_date: string }[] | null };

      const dates = new Set((entries ?? []).map((e: { entry_date: string }) => e.entry_date));
      const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
      const cur = new Date(yesterday);
      for (let i = 0; i < 60; i++) {
        if (dates.has(cur.toISOString().slice(0, 10))) { streak++; cur.setDate(cur.getDate() - 1); } else break;
      }
    }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io';
    const journalUrl = `${base}/${profile.username}?tab=journal`;

    try {
      await resend.emails.send({
        from:    'Spaceful <hello@spaceful.io>',
        to:      profile.email,
        subject: `Good morning, ${profile.username}`,
        html:    `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1028">
<p style="font-size:13px;color:#888;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">SPACEFUL · Morning</p>
${streak > 0 ? `<p style="font-size:13px;color:#888;margin-bottom:16px">🔥 ${streak}-day streak</p>` : ''}
<p style="font-size:17px;line-height:1.8;font-style:italic;margin-bottom:32px">"${companionMessage}"</p>
<a href="${journalUrl}" style="display:inline-block;padding:12px 24px;background:#7c6fe0;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-family:sans-serif">Log your intention →</a>
<p style="font-size:12px;color:#aaa;margin-top:32px"><a href="${unsubscribeUrl(profile.user_id)}" style="color:#aaa">Unsubscribe</a></p>
</body></html>`,
      });

      await svc.from('profiles')
        .update({ morning_email_sent_date: today })
        .eq('user_id', profile.user_id);

      sent++;
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ ok: true, sent });
}
