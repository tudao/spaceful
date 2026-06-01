'use client';

import { useEffect, useState } from 'react';

interface Snapshot {
  snapshot_at: string;
  content_json: {
    title?: string;
    goals?: { text: string; done: boolean }[];
    habits?: { label: string; days: boolean[] }[];
    notepad?: string;
    reading_list?: { title: string }[];
  };
}

interface LetterEntry {
  entry_date: string;
  body: string;
}

interface TimelineViewProps {
  spaceId: string;
  palette: { bg: string; bg2: string; accent: string; text: string; text2: string; surface: string };
}

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function habitRate(habits: { days: boolean[] }[]): number {
  const all = habits.flatMap(h => h.days ?? []);
  return all.length > 0 ? Math.round((all.filter(Boolean).length / all.length) * 100) : 0;
}

export function TimelineView({ spaceId, palette: p }: TimelineViewProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [letters, setLetters]     = useState<LetterEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/timeline?space_id=${spaceId}`).then(r => r.json()),
    ]).then(([data]) => {
      setSnapshots(data.snapshots ?? []);
      setLetters(data.letters ?? []);
    }).finally(() => setLoading(false));
  }, [spaceId]);

  const border = `1px solid ${p.surface}`;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(170deg, ${p.bg}, ${p.bg2})`, color: p.text, fontFamily: "'Nunito', sans-serif", padding: '80px clamp(20px,5vw,60px) 120px' }}>
      <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Your evolution</h2>
      <p style={{ fontSize: 14, color: p.text2, marginBottom: 32 }}>Monthly snapshots of your space</p>

      {loading && (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ width: 200, height: 240, borderRadius: 16, background: p.surface, flexShrink: 0, opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      )}

      {!loading && snapshots.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: p.text2 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
          <p style={{ fontSize: 16, lineHeight: 1.7 }}>Your first snapshot will appear at the start of next month.</p>
        </div>
      )}

      {/* Horizontal scroll timeline */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'thin' }}>
        {snapshots.map(snap => {
          const cj = snap.content_json;
          const completedGoals = (cj.goals ?? []).filter(g => g.done).length;
          const totalGoals     = (cj.goals ?? []).length;
          const rate           = habitRate(cj.habits ?? []);
          const reads          = (cj.reading_list ?? []).length;
          const letter         = letters.find(l => l.entry_date.startsWith(snap.snapshot_at.slice(0, 7)));
          const isExpanded     = expanded === snap.snapshot_at;

          return (
            <div
              key={snap.snapshot_at}
              onClick={() => setExpanded(isExpanded ? null : snap.snapshot_at)}
              style={{
                width: isExpanded ? 360 : 200,
                flexShrink: 0,
                borderRadius: 20,
                background: p.surface,
                border: isExpanded ? `2px solid ${p.accent}` : border,
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: p.accent, marginBottom: 8, letterSpacing: '0.02em' }}>
                {fmtMonth(snap.snapshot_at)}
              </div>

              {/* Mini stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: isExpanded ? 20 : 0 }}>
                {totalGoals > 0 && (
                  <div style={{ fontSize: 12, color: p.text2 }}>
                    <strong style={{ color: p.text }}>{completedGoals}/{totalGoals}</strong> goals done
                  </div>
                )}
                {(cj.habits ?? []).length > 0 && (
                  <div style={{ fontSize: 12, color: p.text2 }}>
                    <strong style={{ color: p.text }}>{rate}%</strong> habit rate
                  </div>
                )}
                {reads > 0 && (
                  <div style={{ fontSize: 12, color: p.text2 }}>
                    <strong style={{ color: p.text }}>{reads}</strong> reading
                  </div>
                )}
              </div>

              {/* Expanded: letter + goals list */}
              {isExpanded && (
                <div>
                  {letter && (
                    <div style={{ background: `${p.accent}18`, borderRadius: 12, padding: '14px', marginBottom: 16, border: `1px solid ${p.accent}44` }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: p.accent, marginBottom: 8, letterSpacing: '0.05em' }}>✉️ MONTHLY LETTER</div>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: p.text, margin: 0, fontStyle: 'italic' }}>{letter.body}</p>
                    </div>
                  )}
                  {(cj.goals ?? []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: p.text2, marginBottom: 8, letterSpacing: '0.05em' }}>GOALS</div>
                      {cj.goals?.map((g, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: g.done ? p.accent : p.text, marginBottom: 4 }}>
                          <span>{g.done ? '✓' : '○'}</span>
                          <span style={{ textDecoration: g.done ? 'line-through' : 'none', opacity: g.done ? 0.7 : 1 }}>{g.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
