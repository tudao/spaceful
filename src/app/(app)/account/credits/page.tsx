import Link from 'next/link';
import { Gem, Sparkles, Gift, RefreshCw, MessageCircle, ChevronRight } from 'lucide-react';

const BALANCE = 14;
const REFRESH_DAYS = 18;
const REFRESH_DATE = 'June 17';

const PACKAGES = [
  { credits: 5,  price: 3,  highlight: false },
  { credits: 10, price: 5,  highlight: true  },
  { credits: 20, price: 9,  highlight: false },
];

const LEDGER = [
  { icon: Sparkles,       label: 'Generated "My Space"', date: 'May 30', delta: -3 },
  { icon: Gift,           label: 'Signup gift',               date: 'May 30', delta: +3 },
  { icon: RefreshCw,      label: 'Subscription renewal',      date: 'May 01', delta: +20 },
  { icon: Sparkles,       label: 'Generated "nina-notebook"', date: 'Apr 28', delta: -3 },
  { icon: MessageCircle,  label: 'AI journaling prompt ×4',   date: 'Apr 26', delta: -1 },
];

const COST_REF = [
  { label: 'Generate new space',       cost: '3 credits' },
  { label: 'Regenerate theme',         cost: '2 credits' },
  { label: 'AI journaling prompt',     cost: '0.25 credits' },
  { label: 'OG image regeneration',    cost: '0.5 credits' },
  { label: 'Editing content',          cost: 'Always free' },
];

export default function CreditsPage() {
  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <h1 className="t-h1" style={{ marginBottom: 24 }}>Credits</h1>

      {/* balance card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--app-accent-soft), #F6F1FF)',
        border: '1px solid var(--app-border)', borderRadius: 'var(--r-modal)',
        padding: '28px 30px', display: 'flex', alignItems: 'center', gap: 22,
        boxShadow: 'var(--shadow-soft)', marginBottom: 34,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-accent)', flexShrink: 0, boxShadow: 'var(--shadow-soft)' }}>
          <Gem size={32} />
        </div>
        <div>
          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>
            {BALANCE} <span style={{ fontSize: 18, color: 'var(--app-text-2)', fontWeight: 700 }}>credits remaining</span>
          </div>
          <div style={{ color: 'var(--app-text-2)', fontSize: 14, marginTop: 6 }}>
            Your subscription refreshes in {REFRESH_DAYS} days — that's <strong>+20 credits</strong> on {REFRESH_DATE}.
          </div>
        </div>
      </div>

      {/* buy more */}
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Buy more credits</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 38 }}>
        {PACKAGES.map(pkg => (
          <div
            key={pkg.credits}
            style={{
              border: `1.5px solid ${pkg.highlight ? 'var(--app-accent)' : 'var(--app-border)'}`,
              borderRadius: 16, padding: 20, textAlign: 'center', transition: 'var(--t-fast)',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800 }}>{pkg.credits} credits</div>
            <div style={{ color: 'var(--app-text-2)', fontSize: 15, margin: '4px 0 14px' }}>${pkg.price}</div>
            <button className={`btn btn-sm btn-block${pkg.highlight ? ' btn-primary' : ' btn-secondary'}`}>
              Buy
            </button>
          </div>
        ))}
      </div>

      {/* what do credits cost — collapsible */}
      <details style={{ border: '1px solid var(--app-border)', borderRadius: 14, marginBottom: 38, overflow: 'hidden' }}>
        <summary style={{ padding: '14px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight size={16} style={{ transition: 'var(--t-fast)' }} /> What do credits cost?
        </summary>
        <div style={{ padding: '0 18px 16px' }}>
          {COST_REF.map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: 'var(--app-text-2)', borderTop: '1px solid var(--app-border)' }}>
              <span>{row.label}</span>
              <strong style={{ color: 'var(--app-text)' }}>{row.cost}</strong>
            </div>
          ))}
        </div>
      </details>

      {/* usage history */}
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Usage history</h2>
      <div style={{ border: '1px solid var(--app-border)', borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
        {LEDGER.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < LEDGER.length - 1 ? '1px solid var(--app-border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--app-bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-text-2)', flexShrink: 0 }}>
                <Icon size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{row.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--app-text-muted)' }}>{row.date}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: row.delta > 0 ? 'var(--app-success)' : 'var(--app-text-2)' }}>
                {row.delta > 0 ? `+${row.delta}` : row.delta}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 38 }}>
        <button className="btn btn-ghost">More ↓</button>
      </div>

      {/* subscription */}
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Your subscription</h2>
      <div style={{ border: '1px solid var(--app-border)', borderRadius: 16, padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16 }}>
            $15 / month <span className="badge badge-success">Active</span>
          </div>
          <div style={{ color: 'var(--app-text-2)', fontSize: 14, marginTop: 3 }}>
            Next billing {REFRESH_DATE} · 20 credits/month, rolls over up to 40
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary btn-sm">Manage</button>
          <button className="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </main>
  );
}
