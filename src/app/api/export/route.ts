import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const PERIOD_LABEL: Record<string, string> = {
  morning:          '☀️ Morning',
  evening:          '🌙 Evening',
  ai_letter:        '✉️ Monthly Letter',
  weekly_synthesis: '📝 Weekly Synthesis',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const space_id = searchParams.get('space_id');
  if (!space_id) return NextResponse.json({ error: 'space_id required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: space } = await supabase
    .from('spaces')
    .select('user_id, display_name, profiles!inner(username)')
    .eq('id', space_id)
    .single() as { data: { user_id: string; display_name: string | null; profiles: { username: string } } | null };

  if (!space || space.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: entries } = await supabase
    .from('daily_pulse_entries')
    .select('entry_date, period, body')
    .eq('space_id', space_id)
    .order('entry_date', { ascending: true })
    .order('period', { ascending: true }) as { data: { entry_date: string; period: string; body: string }[] | null };

  // Group by YYYY-MM
  const byMonth: Record<string, typeof entries> = {};
  for (const entry of entries ?? []) {
    const month = entry.entry_date.slice(0, 7);
    (byMonth[month] ??= []).push(entry);
  }

  const lines: string[] = [
    `# Spaceful Journal — ${space.display_name ?? space.profiles.username}`,
    `Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
  ];

  for (const [month, monthEntries] of Object.entries(byMonth).sort()) {
    const label = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    lines.push(`## ${label}`, '');

    // Group by date within month
    const byDate: Record<string, typeof monthEntries> = {};
    for (const entry of monthEntries ?? []) {
      (byDate[entry.entry_date] ??= []).push(entry);
    }

    for (const [date, dayEntries] of Object.entries(byDate).sort()) {
      const dateLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      lines.push(`### ${dateLabel}`, '');
      for (const e of dayEntries ?? []) {
        lines.push(`**${PERIOD_LABEL[e.period] ?? e.period}**`, '', e.body, '');
      }
    }
  }

  const markdown = lines.join('\n');
  const filename = `spaceful-journal-${space.profiles.username}-${new Date().toISOString().slice(0, 10)}.md`;

  return new Response(markdown, {
    headers: {
      'Content-Type':        'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
