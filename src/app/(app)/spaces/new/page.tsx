'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Gem } from 'lucide-react';
import { MiniSpace } from '@/components/space/MiniSpace';
import type { SpaceMood } from '@/lib/utils';

const CREDITS = 14; // replace with session data
const TEMPLATES: { palette: SpaceMood; label: string }[] = [
  { palette: 'lavender', label: 'Lavender' },
  { palette: 'sand',     label: 'Sand' },
  { palette: 'forest',   label: 'Forest' },
];

export default function NewSpacePage() {
  const router    = useRouter();
  const hasCredits = CREDITS >= 3;
  const [slug, setSlug] = useState('');
  const username = 'laki'; // replace with session

  function sanitizeSlug(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 'clamp(28px,6vw,64px) 20px 80px' }}>
      <h1 className="t-h1" style={{ marginBottom: 6 }}>Create a new space</h1>
      <p className="muted" style={{ marginBottom: 26 }}>A fresh, AI-designed page — or start from a free template.</p>

      <div className="card" style={{ padding: 'clamp(24px,4vw,36px)' }}>
        {hasCredits ? (
          <>
            {/* cost line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--app-accent-soft)', borderRadius: 14, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-accent)', flexShrink: 0 }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>This will use 3 credits</div>
                <div style={{ fontSize: 13, color: 'var(--app-text-2)' }}>You have {CREDITS} credits remaining.</div>
              </div>
            </div>

            <label className="field-label">Space URL</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--app-bg-2)', border: '1.5px solid var(--app-border-strong)', borderRadius: 'var(--r-input)', overflow: 'hidden', transition: 'var(--t-fast)' }}>
              <span style={{ padding: '11px 4px 11px 14px', fontFamily: 'ui-monospace,monospace', fontSize: 14, color: 'var(--app-text-muted)', whiteSpace: 'nowrap' }}>
                spaceful.io/{username}/
              </span>
              <input
                value={slug}
                onChange={e => setSlug(sanitizeSlug(e.target.value))}
                placeholder="my-notebook"
                style={{ flex: 1, border: 'none', background: 'none', padding: '11px 14px 11px 0', fontFamily: 'ui-monospace,monospace', fontSize: 14, color: 'var(--app-text)', outline: 'none' }}
                spellCheck={false}
              />
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Lowercase letters, numbers and hyphens.</p>

            <button
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 20 }}
              disabled={!slug}
              onClick={() => router.push('/onboard')}
            >
              Continue to design questions →
            </button>
          </>
        ) : (
          <>
            {/* zero credits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--app-warning-soft)', borderRadius: 14, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-warning)', flexShrink: 0 }}>
                <Gem size={20} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>You're out of credits</div>
                <div style={{ fontSize: 13, color: 'var(--app-text-2)' }}>Creating an AI space costs 3 credits.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/account/credits" className="btn btn-primary btn-block">Get 10 credits for $5</Link>
              <Link href="/account/credits" className="btn btn-secondary btn-block">Subscribe $15/mo → 20 credits/month</Link>
            </div>
          </>
        )}

        {/* divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 20px', color: 'var(--app-text-muted)', fontSize: 13, fontWeight: 700 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--app-border)' }} />
          or choose a free template
          <div style={{ flex: 1, height: 1, background: 'var(--app-border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {TEMPLATES.map(t => (
            <Link
              key={t.palette}
              href="/spaces"
              style={{ border: '1.5px solid var(--app-border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'var(--t-fast)', background: '#fff', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ height: 110 }}>
                <MiniSpace palette={t.palette} title={t.label} goals={['goal', 'goal']} style={{ height: '100%' }} />
              </div>
              <div style={{ padding: '9px 11px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--app-text)' }}>
                {t.label} <span style={{ fontSize: 11, color: 'var(--app-success)', fontWeight: 700 }}>Free</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
