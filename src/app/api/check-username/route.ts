import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isValidUsername } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') ?? '';

  if (!isValidUsername(username)) {
    return NextResponse.json({ available: false, reason: 'invalid' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
