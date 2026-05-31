'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PulseEntry {
  id: string;
  entry_date: string;
  period: 'morning' | 'evening' | 'ai_letter';
  body: string;
  created_at: string;
}

interface JournalTabProps {
  spaceId: string;
  username: string;
  palette: { bg: string; bg2: string; accent: string; text: string; text2: string; surface: string; border?: string; };
  streak: number;
}

function periodLabel(p: string) {
  if (p === 'morning') return '☀️ Morning';
  if (p === 'evening') return '🌙 Evening';
  return '✉️ Letter';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function JournalTab({ spaceId, username, palette: p, streak }: JournalTabProps) {
  const [entries, setEntries] = useState<PulseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pulse?space_id=${spaceId}&limit=60`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries ?? []); })
      .finally(() => setLoading(false));
  }, [spaceId]);

  // Group by date
  const byDate = entries.reduce<Record<string, PulseEntry[]>>((acc, e) => {
    (acc[e.entry_date] ??= []).push(e);
    return acc;
  }, {});

  const border = `1px solid ${p.surface}`;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(170deg, ${p.bg}, ${p.bg2})`, color: p.text, fontFamily: "'Nunito', sans-serif", padding: '80px clamp(20px,5vw,60px) 120px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Journal</h2>
          {streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: p.surface, border, fontSize: 14, fontWeight: 700, color: p.text2 }}>
              🔥 {streak}-day pulse streak
            </div>
          )}
        </div>
        <Link href={`/${username}?tab=journal&view=timeline`} style={{ fontSize: 13, fontWeight: 700, color: p.accent, textDecoration: 'none', padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${p.accent}44`, background: `${p.accent}12`, marginTop: 4 }}>
          📸 Evolution →
        </Link>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 16, background: p.surface, opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: p.text2 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
          <p style={{ fontSize: 16, lineHeight: 1.7 }}>Your journal starts with your first morning intention. Open your Space tab and add one.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayEntries]) => (
          <div key={date}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: p.text2, marginBottom: 10 }}>
              {fmtDate(date)}
            </div>
            {dayEntries.sort((a, b) => a.period.localeCompare(b.period)).map(e => (
              <div key={e.id} style={{ background: p.surface, borderRadius: 16, padding: '18px 20px', border, marginBottom: 8, ...(e.period === 'ai_letter' ? { border: `1.5px solid ${p.accent}`, position: 'relative' as const } : {}) }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: p.text2, marginBottom: 8, letterSpacing: '0.05em' }}>
                  {periodLabel(e.period)}
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: p.text, whiteSpace: 'pre-wrap' }}>{e.body}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
