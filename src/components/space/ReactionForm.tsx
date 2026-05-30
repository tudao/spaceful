'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ReactionFormProps {
  username: string;
  spaceId: string;
}

export function ReactionForm({ username, spaceId }: ReactionFormProps) {
  const [msg, setMsg]     = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (!msg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_id: spaceId, message: msg.trim() }),
      });
      if (res.status === 429) { setError("You've sent a few notes already — come back later!"); return; }
      if (!res.ok) throw new Error('failed');
      setSent(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 940, margin: '8px auto 0', padding: '0 clamp(18px,4vw,36px) 60px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.62)', border: '1.5px solid var(--sp-border2)',
        borderRadius: 20, padding: '24px 26px', backdropFilter: 'blur(4px)',
        boxShadow: '0 6px 26px var(--sp-glow)',
      }}>
        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>💛</div>
            <div style={{ fontSize: 14, color: 'var(--sp-text2)', fontWeight: 700 }}>Sent — thank you</div>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 18, color: 'var(--sp-text)', marginBottom: 4 }}>Leave a note for {username}</h3>
            <div style={{ fontSize: 13, color: 'var(--sp-text3)', marginBottom: 16 }}>A short, kind word — they'll see it privately.</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                maxLength={140}
                placeholder="Say something nice…"
                style={{
                  flex: 1, fontFamily: "'Nunito',sans-serif", fontSize: 15, color: 'var(--sp-text)',
                  background: 'rgba(255,255,255,0.7)', border: '1.5px solid var(--sp-border2)', borderRadius: 14,
                  padding: '12px 16px', resize: 'none', minHeight: 52, lineHeight: 1.5,
                  transition: '.2s', outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !msg.trim()}
                style={{
                  height: 52, padding: '0 22px', border: 'none', borderRadius: 14,
                  background: 'var(--sp-accent)', color: '#fff',
                  fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', transition: '.2s', flexShrink: 0,
                  opacity: loading || !msg.trim() ? 0.65 : 1,
                }}
              >
                <Send size={17} /> Send
              </button>
            </div>
            {msg.length >= 100 && (
              <div style={{ fontSize: 12, color: 'var(--sp-text3)', marginTop: 8, textAlign: 'right' }}>
                {msg.length} / 140
              </div>
            )}
            {error && <div style={{ fontSize: 13, color: 'var(--app-danger)', marginTop: 8 }}>{error}</div>}
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 30, fontSize: 14, color: 'var(--sp-text3)' }}>
        Like this little world?{' '}
        <a href="/signup" style={{ color: 'var(--sp-accent)', fontWeight: 700, borderBottom: '1.5px solid var(--sp-border2)', paddingBottom: 1 }}>
          Create your own → spaceful.io
        </a>
      </div>
    </div>
  );
}
