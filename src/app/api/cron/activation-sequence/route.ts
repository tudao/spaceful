import { createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAILS: Record<number, { subject: string; body: string }> = {
  1: {
    subject: 'Your space is ready — log your first intention',
    body:    'Your space is live. The best thing to do right now is log your first morning intention — two sentences about what you want to focus on today. It takes 20 seconds and starts the habit.',
  },
  3: {
    subject: 'Meet your companion',
    body:    'Your AI companion is waiting. Open the Companion tab and ask it anything — what you\'re working on, what\'s on your mind, or just say hello. It remembers what you share.',
  },
  5: {
    subject: 'You\'re building a streak',
    body:    'You\'ve been showing up. Keep the habit going — open your space and log your evening reflection. Even one sentence counts.',
  },
  7: {
    subject: 'One week in — here\'s what\'s coming',
    body:    'You\'ve made it to day 7. Next month you\'ll receive your first monthly letter — a personal note written from your own words. The longer you stay, the more meaningful it becomes.',
  },
};

// Runs daily at 09:00 UTC — cron: 0 9 * * *
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io';
  let sent = 0;

  for (const [dayStr, email] of Object.entries(EMAILS)) {
    const day = parseInt(dayStr, 10);
    const targetDate = new Date(Date.now() - day * 86400_000).toISOString().slice(0, 10);
    const nextDate   = new Date(Date.now() - (day - 1) * 86400_000).toISOString().slice(0, 10);

    const { data: spaces } = await svc
      .from('spaces')
      .select('id, user_id, profiles!inner(username, email)')
      .eq('is_primary', true)
      .gte('published_at', targetDate)
      .lt('published_at', nextDate)
      .not('onboarding_emails_sent', 'cs', `{${day}}`)
      .limit(100) as {
        data: Array<{ id: string; user_id: string; profiles: { username: string; email: string } }> | null
      };

    for (const space of (spaces ?? [])) {
      try {
        await resend.emails.send({
          from:    'Spaceful <hello@spaceful.io>',
          to:      space.profiles.email,
          subject: email.subject,
          html:    `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1028">
<p style="font-size:13px;color:#888;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">SPACEFUL · Day ${day}</p>
<p style="font-size:17px;line-height:1.8;margin-bottom:32px">${email.body}</p>
<a href="${base}/${space.profiles.username}" style="display:inline-block;padding:12px 24px;background:#7c6fe0;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-family:sans-serif">Open my space →</a>
</body></html>`,
        });
        // Mark this day as sent
        await svc.from('spaces')
          .update({ onboarding_emails_sent: svc.raw(`array_append(onboarding_emails_sent, ${day})`) })
          .eq('id', space.id);
        sent++;
      } catch { /* best-effort */ }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
