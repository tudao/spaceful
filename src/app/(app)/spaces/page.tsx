import Link from 'next/link';
import { Plus, Globe, Link2, Lock, Star } from 'lucide-react';
import { MiniSpace } from '@/components/space/MiniSpace';
import { CreditPill } from '@/components/ui/CreditPill';
import type { SpaceMood } from '@/lib/utils';

interface SpaceCard {
  id: string;
  palette: SpaceMood;
  name: string;
  url: string;
  slug: string;
  username: string;
  status: 'public' | 'link_only' | 'private';
  primary: boolean;
  updated: string;
  goals: string[];
}

// Demo data — replace with createClient() + DB query
const SPACES: SpaceCard[] = [
  { id: '1', palette: 'lavender', name: "Laki's World",    url: 'spaceful.io/laki',             slug: '',             username: 'laki', status: 'public',    primary: true,  updated: '2 hours ago', goals: ['write', 'run', 'read'] },
  { id: '2', palette: 'rose',     name: 'nina-notebook',   url: 'spaceful.io/laki/nina-notebook', slug: 'nina-notebook', username: 'laki', status: 'private',   primary: false, updated: '3 days ago',  goals: ['paint', 'plant'] },
  { id: '3', palette: 'ocean',    name: 'koa-surf-log',    url: 'spaceful.io/laki/koa-surf-log',  slug: 'koa-surf-log',  username: 'laki', status: 'link_only', primary: false, updated: 'last week',   goals: ['surf', 'rest'] },
];

const STATUS_MAP = {
  public:    { cls: 'badge-success', icon: Globe, label: 'Public' },
  link_only: { cls: 'badge',         icon: Link2, label: 'Link-only' },
  private:   { cls: 'badge-neutral', icon: Lock,  label: 'Private' },
} as const;

const CREDITS = 14;

export default function SpacesPage() {
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="t-h1">My Spaces</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 14, color: 'var(--app-text-2)' }}>
            <CreditPill balance={CREDITS} />
            <span>· Next refresh in 18 days</span>
          </div>
        </div>
        <Link href="/spaces/new" className="btn btn-primary">
          <Plus size={18} /> New space
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 22 }}>
        {SPACES.map(s => {
          const st = STATUS_MAP[s.status];
          const Icon = st.icon;
          const href = s.primary ? `/${s.username}` : `/${s.username}/${s.slug}`;
          return (
            <div key={s.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'var(--t)' }}>
              {/* thumbnail */}
              <div style={{ height: 180, position: 'relative' }}>
                <MiniSpace palette={s.palette} title={s.name} goals={s.goals} style={{ height: '100%' }} />
                {/* badges */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                  <span className={`badge ${st.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={13} /> {st.label}
                  </span>
                  {s.status === 'private' && <span className="badge badge-neutral">Draft</span>}
                </div>
                {s.primary && (
                  <span className="badge badge-gold" style={{ position: 'absolute', top: 12, right: 12 }}>
                    <Star size={13} /> Primary
                  </span>
                )}
              </div>
              {/* body */}
              <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{s.name}</div>
                <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: 'var(--app-text-2)' }}>{s.url}</div>
                <div style={{ fontSize: 12.5, color: 'var(--app-text-muted)', marginTop: 2 }}>Updated {s.updated}</div>
              </div>
              {/* actions */}
              <div style={{ display: 'flex', gap: 8, padding: '0 18px 18px' }}>
                <Link href={href} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Open</Link>
                <Link href={href} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Settings</Link>
              </div>
            </div>
          );
        })}

        {/* new space card */}
        <Link
          href="/spaces/new"
          style={{
            border: '2px dashed var(--app-border-strong)', borderRadius: 'var(--r-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, minHeight: 380, cursor: 'pointer', transition: 'var(--t)',
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
