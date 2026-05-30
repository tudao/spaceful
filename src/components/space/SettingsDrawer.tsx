'use client';

import { useState } from 'react';
import { Lock, Link, Globe, Sparkles, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';

type Visibility = 'private' | 'link_only' | 'public';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  spaceName?: string;
  visibility?: Visibility;
  galleryStatus?: string;
  reactionsEnabled?: boolean;
  lastGenerated?: string;
  onRegenerate?: () => void;
  onDelete?: () => void;
}

const PRIVACY_OPTIONS = [
  { key: 'private'   as Visibility, icon: Lock,  label: 'Private',   desc: 'Only you can see this' },
  { key: 'link_only' as Visibility, icon: Link,  label: 'Link-only', desc: 'Anyone with the link' },
  { key: 'public'    as Visibility, icon: Globe, label: 'Public',    desc: 'Listed & discoverable' },
];

export function SettingsDrawer({
  open, onClose,
  spaceName: initialName = "Laki's World",
  visibility: initialVis = 'link_only',
  reactionsEnabled: initialRx = true,
  lastGenerated = 'May 30',
  onRegenerate,
  onDelete,
}: SettingsDrawerProps) {
  const { toast } = useToast();
  const [vis, setVis]       = useState<Visibility>(initialVis);
  const [rx, setRx]         = useState(initialRx);
  const [name, setName]     = useState(initialName);

  function pickVis(v: Visibility) {
    const wasPrivate = vis !== 'public' && v === 'public';
    setVis(v);
    if (wasPrivate) toast('Your space is now visible to anyone with the link');
  }

  return (
    <Drawer open={open} onClose={onClose} title="Space settings">
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--app-border)' }}>
        <h5 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 12 }}>Space name</h5>
        <input className="input" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--app-border)' }}>
        <h5 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 12 }}>Privacy</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PRIVACY_OPTIONS.map(({ key, icon: Icon, label, desc }) => (
            <div
              key={key}
              onClick={() => pickVis(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px',
                border: `1.5px solid ${vis === key ? 'var(--app-accent)' : 'var(--app-border)'}`,
                borderRadius: 12, cursor: 'pointer', transition: 'var(--t-fast)',
                background: vis === key ? 'var(--app-accent-soft)' : 'transparent',
              }}
            >
              <Icon size={18} style={{ color: vis === key ? 'var(--app-accent-ink)' : 'var(--app-text-2)' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: vis === key ? 'var(--app-accent-ink)' : 'var(--app-text)' }}>{label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--app-text-2)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--app-border)' }}>
        <h5 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 12 }}>Gallery</h5>
        <p style={{ fontSize: 12, color: 'var(--app-text-2)', lineHeight: 1.5, marginBottom: 12 }}>Submit your space for review to appear in the public gallery.</p>
        <button className="btn btn-secondary btn-sm btn-block" onClick={() => toast('Submitted for gallery review', 'success')}>
          Submit to gallery
        </button>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--app-border)' }}>
        <h5 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 12 }}>Reactions</h5>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--app-text-2)' }}>Allow visitors to leave notes</span>
          <label className="switch">
            <input type="checkbox" checked={rx} onChange={e => setRx(e.target.checked)} />
            <span className="track" /><span className="thumb" />
          </label>
        </div>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--app-border)' }}>
        <h5 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 12 }}>Design</h5>
        <p style={{ fontSize: 12, color: 'var(--app-text-2)', lineHeight: 1.5, marginBottom: 12 }}>Last generated {lastGenerated}. Regenerating keeps your content.</p>
        <button className="btn btn-secondary btn-sm btn-block" onClick={onRegenerate}>
          <Sparkles size={15} /> Regenerate theme · 2 credits
        </button>
      </div>

      <div style={{ padding: '18px 22px' }}>
        <h5 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-danger)', marginBottom: 12 }}>Danger zone</h5>
        <button
          className="btn btn-sm btn-block"
          style={{ color: 'var(--app-danger)', border: '1.5px solid var(--app-danger-soft)', background: 'var(--app-danger-soft)' }}
          onClick={onDelete}
        >
          <Trash2 size={15} /> Delete space
        </button>
      </div>
    </Drawer>
  );
}
