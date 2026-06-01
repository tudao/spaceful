import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { LANGUAGES, type LanguageCode } from '@/lib/languages';

const VALID_LANGUAGES = new Set(LANGUAGES.map(l => l.code));

export async function PATCH(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const updates: Record<string, unknown> = {};

  if ('preferred_language' in body) {
    const lang = body.preferred_language as string;
    if (!VALID_LANGUAGES.has(lang as LanguageCode)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }
    updates.preferred_language = lang;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
