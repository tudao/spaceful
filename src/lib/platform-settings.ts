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
      .select('companion_credit_cost, daily_login_credits, generation_credit_cost, regeneration_credit_cost, signup_gift_credits')
      .eq('id', 1)
      .single() as { data: PlatformSettings | null };

    if (!data) return DEFAULTS;
    return {
      companion_credit_cost:    Number(data.companion_credit_cost)    || DEFAULTS.companion_credit_cost,
      daily_login_credits:      Number(data.daily_login_credits)      || DEFAULTS.daily_login_credits,
      generation_credit_cost:   Number(data.generation_credit_cost)   || DEFAULTS.generation_credit_cost,
      regeneration_credit_cost: Number(data.regeneration_credit_cost) || DEFAULTS.regeneration_credit_cost,
      signup_gift_credits:      Number(data.signup_gift_credits)      || DEFAULTS.signup_gift_credits,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function setSetting(key: keyof PlatformSettings, value: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;
  await svc.from('platform_settings').update({ [key]: value }).eq('id', 1);
}
