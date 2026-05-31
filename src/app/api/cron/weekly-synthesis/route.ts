import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs Sunday 20:00 UTC — cron: 0 20 * * 0
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  const today = new Date().toISOString().slice(0, 10); // Sunday date = week-end
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);

  // Spaces with ≥3 pulse entries this week, no synthesis yet today
  const { data: spaces } = await svc
    .from('spaces')
    .select('id, user_id, profiles!inner(username, email, email_digest_opted_out)')
    .filter('id', 'in',
      `(SELECT space_id FROM daily_pulse_entries WHERE entry_date > '${weekAgo}' AND period IN ('morning','evening') GROUP BY space_id HAVING COUNT(*) >= 3)`
    )
    .filter('id', 'not.in',
      `(SELECT space_id FROM daily_pulse_entries WHERE entry_date = '${today}' AND period = 'weekly_synthesis')`
    )
    .limit(100) as {
      data: Array<{ id: string; user_id: string; profiles: { username: string; email: string; email_digest_opted_out: boolean } }> | null
    };

  if (!spaces || spaces.length === 0) return NextResponse.json({ ok: true, synthesised: 0 });

  const ai = new Anthropic();
  let sent = 0;

  for (const space of spaces) {
    if (space.profiles.email_digest_opted_out) continue;

    const { data: entries } = await svc
      .from('daily_pulse_entries')
      .select('period, body, entry_date')
      .eq('space_id', space.id)
      .gt('entry_date', weekAgo)
      .in('period', ['morning', 'evening'])
      .order('entry_date', { ascending: true }) as { data: { period: string; body: string; entry_date: string }[] | null };

    if (!entries || entries.length < 3) continue;

    const entriesText = entries.map(e => `[${e.entry_date} ${e.period}] ${e.body}`).join('\n');
    const username = space.profiles.username;
    let synthesis = `A quiet week. You showed up ${entries.length} times.`;

    try {
      const resp = await ai.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system:     'You write warm, specific weekly synthesis notes for a personal journal app. 3 sentences. Reference actual words or themes from the entries. Second person. No bullet points.',
        messages:   [{ role: 'user', content: `Write a 3-sentence synthesis of ${username}'s week from these entries:\n\n${entriesText}` }],
      });
      const block = resp.content[0];
      if (block.type === 'text') synthesis = block.text.trim();
    } catch {
      // Fallback to default on Claude failure
    }

    await svc.from('daily_pulse_entries').upsert({
      space_id:   space.id,
      user_id:    space.user_id,
      entry_date: today,
      period:     'weekly_synthesis',
      body:       synthesis,
    }, { onConflict: 'space_id,entry_date,period' });

    try {
      await resend.emails.send({
        from:    'Spaceful <hello@spaceful.io>',
        to:      space.profiles.email,
        subject: `Your week in reflection, ${username}`,
        html:    `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1028">
<p style="font-size:13px;color:#888;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:32px">SPACEFUL · Weekly Synthesis</p>
<p style="font-size:17px;line-height:1.8;margin-bottom:32px">${synthesis}</p>
<p style="font-size:13px;color:#888">— Your Spaceful companion<br>
<a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io'}/${username}?tab=journal" style="color:#7c6fe0">Open your journal →</a></p>
</body></html>`,
      });
    } catch { /* best-effort */ }

    sent++;
  }

  return NextResponse.json({ ok: true, synthesised: sent });
}
