/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Globe, Link2, Lock, Star } from 'lucide-react';
import { MiniSpace } from '@/components/space/MiniSpace';
import { CreditPill } from '@/components/ui/CreditPill';
import { createClient } from '@/lib/supabase/server';
import type { SpaceMood } from '@/lib/utils';

const STATUS_MAP = {
  public:    { cls: 'badge-success', icon: Globe, label: 'Public' },
  link_only: { cls: 'badge',         icon: Link2, label: 'Link-only' },
  private:   { cls: 'badge-neutral', icon: Lock,  label: 'Private' },
} as const;

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function SpacesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/spaces');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('username, credit_balance, subscription_status')
    .eq('user_id', user.id)
    .single() as {
      data: {
        username: string;
        credit_balance: number;
        subscription_status: string;
      } | null;
    };

  if (!profile) redirect('/login?next=/spaces');

  const { data: spaces } = await (supabase as any)
    .from('spaces')
    .select('id, slug, display_name, design_tokens, content_json, visibility, is_primary, updated_at')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('updated_at', { ascending: false }) as {
      data: {
        id: string;
        slug: string;
        display_name: string | null;
        design_tokens: Record<string, unknown> | null;
        content_json: Record<string, unknown> | null;
        visibility: 'public' | 'link_only' | 'private';
        is_primary: boolean;
        updated_at: string;
      }[] | null;
    };

  const list = spaces ?? [];

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="t-h1">My Spaces</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 14, color: 'var(--app-text-2)' }}>
            <CreditPill balance={profile.credit_balance} />
          </div>
        </div>
        <Link href="/spaces/new" className="btn btn-primary">
          <Plus size={18} /> New space
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 22 }}>
        {list.map(s => {
          const st = STATUS_MAP[s.visibility] ?? STATUS_MAP.private;
          const Icon = st.icon;
          const href = s.is_primary
            ? `/${profile.username}`
            : `/${profile.username}/${s.slug}`;
          const displayUrl = s.is_primary
            ? `spaceful.io/${profile.username}`
            : `spaceful.io/${profile.username}/${s.slug}`;

          const cj = (s.content_json ?? {}) as Record<string, unknown>;
          const dt = (s.design_tokens ?? {}) as Record<string, unknown>;
          const title = (cj.title as string) || s.display_name || 'Untitled';
          const mood  = (dt.mood as SpaceMood) || 'lavender';
          const goals = Array.isArray(cj.goals)
            ? (cj.goals as { text: string }[]).map(g => g.text).slice(0, 3)
            : [];

          return (
            <div key={s.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'var(--t)' }}>
              <div style={{ height: 180, position: 'relative' }}>
                <MiniSpace palette={mood} title={title} goals={goals} style={{ height: '100%' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                  <span className={`badge ${st.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={13} /> {st.label}
                  </span>
                </div>
                {s.is_primary && (
                  <span className="badge badge-gold" style={{ position: 'absolute', top: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Star size={13} /> Primary
                  </span>
                )}
              </div>
              <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
                <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: 'var(--app-text-2)' }}>{displayUrl}</div>
                <div style={{ fontSize: 12.5, color: 'var(--app-text-muted)', marginTop: 2 }}>
                  Updated {timeAgo(s.updated_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '0 18px 18px' }}>
                <Link href={href} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Open</Link>
                <Link href={href} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Settings</Link>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 24px', color: 'var(--app-text-2)' }}>
            <p style={{ marginBottom: 20, fontSize: 16 }}>No spaces yet. Create your first one.</p>
            <Link href="/onboard" className="btn btn-primary">Start designing →</Link>
          </div>
        )}

        <Link
          href="/spaces/new"
          style={{
            border: '2px dashed var(--app-border-strong)', borderRadius: 'var(--r-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, minHeight: 280, cursor: 'pointer', transition: 'var(--t)',
            color: 'var(--app-text-2)', textAlign: 'center', padding: 24, textDecoration: 'none',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--app-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-accent)' }}>
            <Plus size={26} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--app-text)' }}>New space</div>
          <div style={{ fontSize: 13 }}>3 credits</div>
        </Link>
      </div>
    </main>
  );
}
