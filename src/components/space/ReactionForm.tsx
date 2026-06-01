'use client';

import { useState } from 'react';
import { Send, Zap, Heart } from 'lucide-react';

type KnockType = 'message' | 'energy' | 'goal_cheer';

interface Goal { id: string; text: string; done: boolean; }

interface ReactionFormProps {
  username: string;
  spaceId: string;
  goals?: Goal[];
}

export function ReactionForm({ username, spaceId, goals = [] }: ReactionFormProps) {
  const [type, setType] = useState<KnockType>('message');
  const [msg, setMsg] = useState('');
  const [goalId, setGoalId] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setLoading(true);
    setError('');
    try {
      const body: Record<string, string> = { space_id: spaceId, type };
      if (type !== 'energy') body.message = msg.trim();
      if (type === 'goal_cheer' && goalId) body.goal_id = goalId;

      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const canSend = type === 'energy'
    || (type === 'message' && msg.trim().length > 0)
    || (type === 'goal_cheer' && msg.trim().length > 0);

  const tabBtn = (t: KnockType, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setType(t)}
      style={{
        border: 'none', borderRadius: 999, padding: '7px 14px',
        background: type === t ? 'var(--sp-accent)' : 'transparent',
        color: type === t ? '#fff' : 'var(--sp-text2)',
        fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: '.15s',
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 940, margin: '8px auto 0', padding: '0 clamp(18px,4vw,36px) 60px' }}>
      <div style={{ background: 'rgba(255,255,255,0.62)', border: '1.5px solid var(--sp-border2)', borderRadius: 20, padding: '24px 26px', backdropFilter: 'blur(4px)', boxShadow: '0 6px 26px var(--sp-glow)' }}>
        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>💛</div>
            <div style={{ fontSize: 14, color: 'var(--sp-text2)', fontWeight: 700 }}>Sent — thank you</div>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 18, color: 'var(--sp-text)', marginBottom: 12 }}>Leave a knock for {username}</h3>

            <div style={{ display: 'inline-flex', gap: 2, padding: 4, borderRadius: 999, background: 'rgba(0,0,0,0.06)', marginBottom: 16 }}>
              {tabBtn('message', 'Note', <Send size={13} />)}
              {tabBtn('energy', 'Energy', <Zap size={13} />)}
              {goals.filter(g => !g.done).length > 0 && tabBtn('goal_cheer', 'Cheer', <Heart size={13} />)}
            </div>

            {type === 'energy' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: 'var(--sp-text2)', marginBottom: 16 }}>Send a wordless burst of good energy — no account needed.</p>
                <button type="button" onClick={handleSend} disabled={loading} style={{ height: 52, padding: '0 32px', border: 'none', borderRadius: 999, background: 'var(--sp-accent)', color: '#fff', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.65 : 1 }}>
                  <Zap size={18} /> Send energy ✦
                </button>
              </div>
            ) : (
              <>
                {type === 'goal_cheer' && (
                  <select value={goalId} onChange={e => setGoalId(e.target.value)} style={{ width: '100%', fontFamily: "'Nunito',sans-serif", fontSize: 14, color: 'var(--sp-text)', background: 'rgba(255,255,255,0.7)', border: '1.5px solid var(--sp-border2)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, outline: 'none' }}>
                    <option value="">Pick a goal to cheer…</option>
                    {goals.filter(g => !g.done).map(g => <option key={g.id} value={g.id}>{g.text}</option>)}
                  </select>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea value={msg} onChange={e => setMsg(e.target.value)} maxLength={140} placeholder={type === 'goal_cheer' ? 'Write a short encouragement…' : 'Say something kind…'} style={{ flex: 1, fontFamily: "'Nunito',sans-serif", fontSize: 15, color: 'var(--sp-text)', background: 'rgba(255,255,255,0.7)', border: '1.5px solid var(--sp-border2)', borderRadius: 14, padding: '12px 16px', resize: 'none', minHeight: 52, lineHeight: 1.5, outline: 'none' }} />
                  <button type="button" onClick={handleSend} disabled={loading || !canSend} style={{ height: 52, padding: '0 22px', border: 'none', borderRadius: 14, background: 'var(--sp-accent)', color: '#fff', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, opacity: loading || !canSend ? 0.65 : 1 }}>
                    <Send size={17} /> Send
                  </button>
                </div>
                {msg.length >= 100 && <div style={{ fontSize: 12, color: 'var(--sp-text3)', marginTop: 8, textAlign: 'right' }}>{msg.length} / 140</div>}
              </>
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
