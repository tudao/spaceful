import { createServiceClient } from '@/lib/supabase/server';

export interface PlatformSettings {
  companion_credit_cost:    number;
  daily_login_credits:      number;
  generation_credit_cost:   number;
  regeneration_credit_cost: number;
  signup_gift_credits:      number;
}

const DEFAULTS: PlatformSettings = {
  companion_credit_cost:    1,
  daily_login_credits:      10,
  generation_credit_cost:   30,
  regeneration_credit_cost: 20,
  signup_gift_credits:      30,
};

export async function getSettings(): Promise<PlatformSettings> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = await createServiceClient() as any;
    const { data } = await svc
      .from('platform_settings')
      .select('key, value') as { data: { key: string; value: number }[] | null };

    if (!data) return DEFAULTS;

    return data.reduce<PlatformSettings>((acc, row) => {
      if (row.key in DEFAULTS) {
        (acc as unknown as Record<string, number>)[row.key] = Number(row.value);
      }
      return acc;
    }, { ...DEFAULTS });
  } catch {
    return DEFAULTS;
  }
}

export async function setSetting(key: keyof PlatformSettings, value: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  await svc.from('platform_settings').upsert({ key, value }, { onConflict: 'key' });
}
