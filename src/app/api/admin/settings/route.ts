import { getSettings, setSetting, type PlatformSettings } from '@/lib/platform-settings';
import { NextResponse } from 'next/server';

const VALID_KEYS: (keyof PlatformSettings)[] = [
  'companion_credit_cost',
  'daily_login_credits',
  'generation_credit_cost',
  'regeneration_credit_cost',
  'signup_gift_credits',
];

function isAdminRequest(request: Request) {
  return request.headers.get('Authorization') === `Bearer ${process.env.ADMIN_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getSettings());
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  for (const [key, val] of Object.entries(body)) {
    if (!VALID_KEYS.includes(key as keyof PlatformSettings)) continue;
    const num = Number(val);
    if (!isFinite(num) || num < 0) continue;
    await setSetting(key as keyof PlatformSettings, num);
  }

  return NextResponse.json(await getSettings());
}
