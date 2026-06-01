'use client';

import { useEffect, useRef } from 'react';
import { Image, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface SharePopoverProps {
  open: boolean;
  onClose: () => void;
  username: string;
  slug?: string;
}

export function SharePopover({ open, onClose, username, slug }: SharePopoverProps) {
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const url = slug ? `spaceful.io/${username}/${slug}` : `spaceful.io/${username}`;

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: 70, right: 18, zIndex: 60,
        width: 280,
        background: 'var(--app-surface)', border: '1px solid var(--app-border)',
        borderRadius: 'var(--r-modal)', boxShadow: 'var(--shadow-lift)', padding: 18,
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'var(--t-fast)',
      }}
    >
      <h4 style={{ fontSize: 15, marginBottom: 4 }}>Share your space</h4>
      <div style={{ fontSize: 12, color: 'var(--app-text-2)' }}>Anyone with the link can visit.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--app-bg-2)', border: '1px solid var(--app-border)', borderRadius: 10, padding: '9px 12px', margin: '12px 0' }}>
        <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--app-text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
        <button
          style={{ border: 'none', background: 'var(--app-accent)', color: '#fff', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
          onClick={() => { navigator.clipboard?.writeText(`https://${url}`); toast('Link copied 💛', 'success'); }}
        >
          Copy
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { icon: Image, label: 'OG card' },
          { icon: QrCode, label: 'QR code' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => toast(`${label} ready`)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 8px', border: '1px solid var(--app-border)', borderRadius: 12,
              background: 'var(--app-surface)', cursor: 'pointer', transition: 'var(--t-fast)',
              fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: 'var(--app-text-2)',
            }}
          >
            <Icon size={20} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
