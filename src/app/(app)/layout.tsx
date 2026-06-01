import { AppNav } from '@/components/nav/AppNav';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/platform-settings';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let creditBalance = 0;
  let userInitial   = '?';
  let authenticated = false;

  if (user) {
    authenticated = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('username, credit_balance, last_daily_credit_at')
      .eq('user_id', user.id)
      .single() as { data: { username: string; credit_balance: number; last_daily_credit_at: string | null } | null };

    if (profile) {
      creditBalance = profile.credit_balance;
      userInitial   = (profile.username ?? '?').charAt(0).toUpperCase();

      // Grant daily login credits if not yet granted today
      const today = new Date().toISOString().slice(0, 10);
      if (profile.last_daily_credit_at !== today) {
        const settings = await getSettings();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const svc = await createServiceClient() as any;
        await svc.rpc('grant_credits', {
          p_user_id:  user.id,
          p_delta:    settings.daily_login_credits,
          p_action:   'daily_login',
          p_note:     'Daily login reward',
        });
        await svc.from('profiles')
          .update({ last_daily_credit_at: today })
          .eq('user_id', user.id);
        creditBalance += settings.daily_login_credits;
      }
    }
  }

  return (
    <>
      <AppNav authenticated={authenticated} creditBalance={creditBalance} userInitial={userInitial} />
      {children}
    </>
  );
}
