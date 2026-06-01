/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/nav/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== 'admin') redirect('/spaces');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminNav />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
