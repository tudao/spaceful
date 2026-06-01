import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';
import { languagePrompt } from '@/lib/languages';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs on 2nd of each month at 00:01 UTC (vercel.json cron)
// Generates a personal letter from diff of last 2 snapshots, stores in daily_pulse_entries
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  const today = new Date().toISOString().slice(0, 10);

  // Find spaces with at least 2 snapshots, no letter yet this month
  const { data: spaces } = await svc
    .from('spaces')
    .select('id, user_id, content_json, profiles!inner(username, email, email_digest_opted_out, preferred_language)')
    .filter('id', 'in', `(
      SELECT space_id FROM space_snapshots GROUP BY space_id HAVING COUNT(*) >= 2
    )`)
    .limit(50) as { data: Array<{
      id: string;
      user_id: string;
      content_json: Record<string, unknown> | null;
      profiles: { username: string; email: string; email_digest_opted_out: boolean; preferred_language: string };
    }> | null };

  if (!spaces || spaces.length === 0) return NextResponse.json({ ok: true, letters: 0 });

  const ai = new Anthropic();
  let sent = 0;

  for (const space of spaces) {
    if (space.profiles.email_digest_opted_out) continue;

    // Check if letter already sent this month
    const { data: existing } = await svc
      .from('daily_pulse_entries')
      .select('id')
      .eq('space_id', space.id)
      .eq('period', 'ai_letter')
      .gte('entry_date', today.slice(0, 7) + '-01')
      .single();
    if (existing) continue;

    // Get last 2 snapshots
    const { data: snapshots } = await svc
      .from('space_snapshots')
      .select('snapshot_at, content_json')
      .eq('space_id', space.id)
      .order('snapshot_at', { ascending: false })
      .limit(2) as { data: { snapshot_at: string; content_json: Record<string, unknown> }[] | null };

    if (!snapshots || snapshots.length < 2) continue;

    const [curr, prev] = snapshots;
    const diff = buildDiff(prev.content_json, curr.content_json);
    const username = space.profiles.username;

    let letter = fallbackLetter(username, diff);

    try {
      const resp = await ai.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system:     'You write warm, specific, personal monthly letters for a personal space app. Speak in second person. Reference actual data — goals, habits, words. 5 sentences max. No generic affirmations. No bullet points.' + languagePrompt(space.profiles.preferred_language ?? 'en'),
        messages:   [{ role: 'user', content: buildPrompt(username, diff, prev.snapshot_at, curr.snapshot_at) }],
      });
      const block = resp.content[0];
      if (block.type === 'text') letter = block.text.trim();
    } catch {
      // Use fallback letter on Claude failure
    }

    // Store as ai_letter in daily_pulse_entries
    await svc.from('daily_pulse_entries').upsert({
      space_id:   space.id,
      user_id:    space.user_id,
      entry_date: today,
      period:     'ai_letter',
      body:       letter,
    }, { onConflict: 'space_id,entry_date,period' });

    // Send email (best-effort)
    try {
      await resend.emails.send({
        from:    'Spaceful <hello@spaceful.io>',
        to:      space.profiles.email,
        subject: `Your monthly letter, ${username}`,
        html:    letterHtml(username, letter),
      });
    } catch {
      // Don't fail the job if email fails
    }

    sent++;
  }

  return NextResponse.json({ ok: true, letters: sent });
}

type ContentJson = Record<string, unknown>;

interface Diff {
  goalsAdded: string[];
  goalsCompleted: string[];
  goalsRemoved: string[];
  habitRateChange: number | null;
  notepadWordDelta: number;
  readingDelta: number;
}

function buildDiff(prev: ContentJson, curr: ContentJson): Diff {
  const prevGoals = (Array.isArray(prev.goals) ? prev.goals : []) as { text: string; done: boolean }[];
  const currGoals = (Array.isArray(curr.goals) ? curr.goals : []) as { text: string; done: boolean }[];

  const prevTexts = new Set(prevGoals.map(g => g.text));
  const currTexts = new Set(currGoals.map(g => g.text));

  const goalsAdded     = currGoals.filter(g => !prevTexts.has(g.text)).map(g => g.text);
  const goalsCompleted = currGoals.filter(g => g.done && !prevGoals.find(p => p.text === g.text)?.done).map(g => g.text);
  const goalsRemoved   = prevGoals.filter(g => !currTexts.has(g.text)).map(g => g.text);

  const prevHabits = (Array.isArray(prev.habits) ? prev.habits : []) as { days: boolean[] }[];
  const currHabits = (Array.isArray(curr.habits) ? curr.habits : []) as { days: boolean[] }[];
  const habitRate = (habits: { days: boolean[] }[]) => {
    const allDays = habits.flatMap(h => h.days ?? []);
    return allDays.length > 0 ? allDays.filter(Boolean).length / allDays.length : null;
  };
  const prevRate = habitRate(prevHabits);
  const currRate = habitRate(currHabits);
  const habitRateChange = prevRate != null && currRate != null ? Math.round((currRate - prevRate) * 100) : null;

  const wordCount = (s: unknown) => typeof s === 'string' ? s.split(/\s+/).filter(Boolean).length : 0;
  const notepadWordDelta = wordCount(curr.notepad) - wordCount(prev.notepad);

  const prevReads = Array.isArray(prev.reading_list) ? prev.reading_list.length : 0;
  const currReads = Array.isArray(curr.reading_list) ? curr.reading_list.length : 0;
  const readingDelta = currReads - prevReads;

  return { goalsAdded, goalsCompleted, goalsRemoved, habitRateChange, notepadWordDelta, readingDelta };
}

function buildPrompt(username: string, diff: Diff, prevDate: string, currDate: string) {
  return `Write a 5-sentence personal monthly letter for ${username}.

Period: ${prevDate} → ${currDate}

Data:
- Goals added: ${diff.goalsAdded.join(', ') || 'none'}
- Goals completed: ${diff.goalsCompleted.join(', ') || 'none'}
- Goals removed: ${diff.goalsRemoved.join(', ') || 'none'}
- Habit completion rate change: ${diff.habitRateChange != null ? `${diff.habitRateChange > 0 ? '+' : ''}${diff.habitRateChange}%` : 'unknown'}
- Notepad word delta: ${diff.notepadWordDelta > 0 ? '+' : ''}${diff.notepadWordDelta} words
- Reading list delta: ${diff.readingDelta > 0 ? '+' : ''}${diff.readingDelta} items

Reference the actual data. Be warm and specific. No generic affirmations.`;
}

function fallbackLetter(username: string, diff: Diff): string {
  const parts: string[] = [];
  if (diff.goalsCompleted.length > 0) parts.push(`You completed "${diff.goalsCompleted[0]}" this month — that matters.`);
  if (diff.habitRateChange != null && diff.habitRateChange > 0) parts.push(`Your habits improved by ${diff.habitRateChange}% — consistency builds quietly.`);
  if (diff.goalsAdded.length > 0) parts.push(`You added a new goal: "${diff.goalsAdded[0]}". Something is shifting.`);
  if (parts.length === 0) parts.push(`Another month in your space, ${username}. Keep going.`);
  return parts.join(' ');
}

function letterHtml(username: string, body: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1028">
<p style="font-size:13px;color:#888;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:32px">SPACEFUL · Monthly Letter</p>
<p style="font-size:18px;line-height:1.8;margin-bottom:32px">${body}</p>
<p style="font-size:13px;color:#888">— Your Spaceful companion<br>
<a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io'}/${username}?tab=journal" style="color:#7c6fe0">Open your journal →</a></p>
</body></html>`;
}
