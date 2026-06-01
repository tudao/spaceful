'use client';

import Link from 'next/link';
import { Edit3, Eye, Share2, Settings, ChevronLeft } from 'lucide-react';

interface OwnerChromeProps {
  mode: 'editing' | 'preview';
  onModeChange: (m: 'editing' | 'preview') => void;
  creditBalance: number;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
}

export function OwnerChrome({ mode, onModeChange, creditBalance, onOpenShare, onOpenSettings, saveState = 'idle' }: OwnerChromeProps) {
  const creditClass = creditBalance === 0 ? 'zero' : creditBalance < 5 ? 'low' : '';

  return (
    <>
      {/* back to spaces */}
      <Link
        href="/spaces"
        style={{
          position: 'fixed', top: 18, left: 18, zIndex: 100,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          height: 40, padding: '0 15px', borderRadius: 999,
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 4px 18px rgba(26,16,64,0.14)',
          fontSize: 13, fontWeight: 700, color: 'var(--app-text-2)',
          textDecoration: 'none', whiteSpace: 'nowrap', transition: 'var(--t-fast)',
        }}
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
        My spaces
      </Link>

      {/* credit pill */}
      <a
        href="/account/credits"
        style={{
          position: 'fixed', top: 18, left: 148, zIndex: 100,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          height: 40, padding: '0 15px', borderRadius: 999,
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 4px 18px rgba(26,16,64,0.14)',
          fontSize: 14, fontWeight: 700, color: 'var(--app-accent-ink)',
          textDecoration: 'none', whiteSpace: 'nowrap', transition: 'var(--t-fast)',
        }}
        className={`owner-credit ${creditClass}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
          <path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
        </svg>
        {creditBalance === 0 ? 'Buy credits' : `${creditBalance} credits`}
      </a>

      {/* editing toolbar */}
      <div style={{
        position: 'fixed', top: 18, right: 18, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 8, padding: 6,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 18px rgba(26,16,64,0.14)',
      }}>
        <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'var(--app-bg-2)', borderRadius: 999 }}>
          {(['editing', 'preview'] as const).map(m => (
            <button key={m} onClick={() => onModeChange(m)} style={{
              border: 'none', background: mode === m ? '#fff' : 'none',
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
              color: mode === m ? 'var(--app-accent-ink)' : 'var(--app-text-2)',
              padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: mode === m ? 'var(--shadow-soft)' : 'none',
              transition: 'var(--t-fast)',
            }}>
              {m === 'editing' ? <Edit3 size={15} /> : <Eye size={15} />}
              {m === 'editing' ? 'Editing' : 'Preview'}
            </button>
          ))}
        </div>

        {saveState !== 'idle' && (
          <span style={{ fontSize: 12, color: saveState === 'error' ? 'var(--app-danger)' : 'var(--app-success)', fontWeight: 600, padding: '0 4px' }}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Error'}
          </span>
        )}

        <button onClick={onOpenShare} title="Share" style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--app-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Share2 size={19} />
        </button>
        <button onClick={onOpenSettings} title="Settings" style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--app-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Settings size={19} />
        </button>
      </div>
    </>
  );
}
