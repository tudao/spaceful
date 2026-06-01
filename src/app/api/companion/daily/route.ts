import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { languagePrompt } from '@/lib/languages';
import { NextResponse } from 'next/server';
import quotes from '@/data/quotes.json';

const ARCHETYPE_PROMPTS: Record<string, string> = {
  stoic:      'You are a stoic advisor. Speak with calm clarity, grounded in practical wisdom. Reference Stoic principles naturally.',
  coach:      'You are an energetic life coach. Speak with warmth and actionable encouragement. Focus on momentum and progress.',
  poet:       'You are a poetic guide. Speak with gentle beauty and metaphor. Help the user find meaning in the everyday.',
  sage:       'You are a wise sage. Speak with depth and gentle provocation. Ask questions that illuminate.',
  challenger: 'You are a bold challenger. Speak directly and push the user toward growth. Name comfort zones and edge them forward.',
};

function pickQuote(archetype: string) {
  const matching = quotes.filter(q => q.themes.includes(archetype));
  const pool = matching.length > 0 ? matching : quotes;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const space_id = searchParams.get('space_id');
  if (!space_id) return NextResponse.json({ error: 'space_id required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  // Return cached daily message if already generated today
  const { data: cached } = await supabase
    .from('companion_daily')
    .select('message, archetype, quote_id')
    .eq('space_id', space_id)
    .eq('date', today)
    .single();

  if (cached) {
    const quote = quotes.find(q => q.text === cached.quote_id) ?? pickQuote(cached.archetype);
    return NextResponse.json({ message: cached.message, archetype: cached.archetype, quote });
  }

  // Fetch space + profile language in parallel
  const [{ data: space }, { data: profile }] = await Promise.all([
    supabase
      .from('spaces')
      .select('companion_archetype, content_json, display_name')
      .eq('id', space_id)
      .eq('user_id', user.id)
      .single() as Promise<{ data: { companion_archetype: string; content_json: Record<string, unknown>; display_name: string } | null }>,
    supabase
      .from('profiles')
      .select('preferred_language')
      .eq('user_id', user.id)
      .single() as Promise<{ data: { preferred_language: string } | null }>,
  ]);

  if (!space) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const archetype = space.companion_archetype ?? 'sage';
  const quote = pickQuote(archetype);
  const name = (space.content_json?.title as string) || space.display_name || 'there';
  const goals = Array.isArray(space.content_json?.goals)
    ? (space.content_json.goals as { text: string; done: boolean }[]).map(g => g.text).join(', ')
    : '';

  let message = `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${name}. Take it one step at a time today.`;

  try {
    const ai = new Anthropic();
    const resp = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 180,
      system: ARCHETYPE_PROMPTS[archetype] + ' Keep your message to 2-3 sentences. No lists.' + languagePrompt(profile?.preferred_language ?? 'en'),
      messages: [{
        role: 'user',
        content: `Write a brief daily message for ${name}. Their current focus: ${goals || 'living with intention'}. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.`,
      }],
    });
    const text = resp.content[0];
    if (text.type === 'text') message = text.text.trim();
  } catch {
    // Fallback to default greeting on Claude failure (rate limit, 529, etc.)
  }

  // Cache for today
  await supabase.from('companion_daily').upsert({
    space_id,
    date: today,
    archetype,
    message,
    quote_id: quote.text, // use text as stable ID since quotes are static
  }, { onConflict: 'space_id,date' });

  return NextResponse.json({ message, archetype, quote });
}
