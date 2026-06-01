import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('user_id', user.id)
    .single() as { data: { preferred_language: string } | null };

  return NextResponse.json({ preferred_language: data?.preferred_language ?? 'en' });
}
