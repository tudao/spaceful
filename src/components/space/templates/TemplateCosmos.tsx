'use client';

import { useRef, useEffect } from 'react';
import { Fireflies } from '../Fireflies';
import type { TemplateProps } from './types';

function hexA(hex: string, a: number) {
  const h = hex.replace('#','');
  const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

// deterministic star positions seeded from index
function starField(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: (i * 97.3)  % 92,
    r: 0.4 + (i % 4) * 0.45,
    delay: `${(i * 0.38) % 4}s`,
    dur: `${2.2 + (i % 4) * 0.6}s`,
    bright: i % 7 === 0,
  }));
}

const STARS = starField(55);
const CON_LINES = [[12,18,32,35],[32,35,58,22],[58,22,74,42],[74,42,91,25],[36,62,58,22],[74,42,92,64],[20,50,36,62]];

export function TemplateCosmos({ content, tokens, isOwner, mode, onUpdate, onSave }: TemplateProps) {
  const p = tokens.palette;
  const editing = isOwner && mode === 'editing';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleUpdate(patch: Partial<typeof content>) {
    onUpdate(patch);
    const next = { ...content, ...patch };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSave(next), 800);
  }
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const donePct = content.goals.length
    ? Math.round(content.goals.filter(g => g.done).length / content.goals.length * 100) : 0;

  const glass = `rgba(255,255,255,0.06)`;
  const border = hexA(p.accent, 0.32);

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Nunito', sans-serif", position: 'relative',
      background: `radial-gradient(ellipse 70% 60% at 80% 10%, ${hexA(p.accent, 0.22)}, transparent 50%),
                   radial-gradient(ellipse 50% 40% at 15% 85%, ${hexA(p.accent2, 0.15)}, transparent 50%),
                   linear-gradient(170deg, ${p.bg}, ${p.bg2})`,
      color: p.text,
    }}>
      <Fireflies color={p.glow} count={28} className="space-fireflies" />

      {/* Star constellation */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <style>{`@keyframes twinkle{0%,100%{opacity:0.35}50%{opacity:0.9}}`}</style>
        {CON_LINES.map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.accent2} strokeWidth="0.12" opacity="0.22"/>
        ))}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r}
            fill={s.bright ? p.accent2 : '#fff'}
            style={{ animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite` }}
            opacity="0.55"/>
        ))}
      </svg>

      {/* glowing orbs */}
      <div style={{ position: 'fixed', top: '8%', right: '6%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent, 0.28)}, transparent 68%)`, filter: 'blur(32px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '4%', width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent2, 0.22)}, transparent 68%)`, filter: 'blur(24px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '52px clamp(20px,4vw,40px) 80px' }}>

        {/* ── HEADER ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 44, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            {/* monogram + wordmark */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20, background: hexA(p.accent, 0.14), border: `1px solid ${border}`, borderRadius: 99, padding: '6px 16px 6px 8px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${p.accent2}, ${p.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', boxShadow: `0 0 20px ${p.glow}` }}>
                {content.title.slice(0,2).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: p.text2, letterSpacing: '0.04em' }}>{content.title.toUpperCase()}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent2, animation: 'sp-pulse 2s infinite' }} />
            </div>

            <h1
              style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 12, outline: 'none', textShadow: `0 0 40px ${hexA(p.accent, 0.4)}` }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ title: e.currentTarget.innerText.trim() })}
            >
              {content.title}
            </h1>
            <p
              style={{ fontSize: 16, color: p.text2, lineHeight: 1.7, maxWidth: 480, outline: 'none', opacity: 0.82 }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ subtitle: e.currentTarget.innerText.trim() })}
            >
              {content.subtitle || (editing ? 'Add a tagline…' : '')}
            </p>
          </div>

          {/* orbital progress ring */}
          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke={hexA(p.accent, 0.14)} strokeWidth="2" strokeDasharray="4 6"/>
              <circle cx="50" cy="50" r="34" fill="none" stroke={hexA(p.accent, 0.12)} strokeWidth="8"/>
              <circle cx="50" cy="50" r="34" fill="none" stroke={`url(#cg)`} strokeWidth="8"
                strokeLinecap="round" strokeDasharray="214" strokeDashoffset={214 - 214 * donePct / 100}
                style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${p.accent})` }}/>
              <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={p.accent2}/><stop offset="100%" stopColor={p.accent}/></linearGradient></defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: p.text }}>{donePct}%</div>
              <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.6) }}>done</div>
            </div>
          </div>
        </div>

        {/* ── GOALS ───────────────────────────────────── */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: hexA(p.text2, 0.55), marginBottom: 12 }}>
          What I&apos;m working toward
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {content.goals.map(g => (
            <span key={g.id}
              onClick={() => editing && scheduleUpdate({ goals: content.goals.map(gl => gl.id === g.id ? { ...gl, done: !gl.done } : gl) })}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => { const t = e.currentTarget.innerText.trim(); if(t) scheduleUpdate({ goals: content.goals.map(gl => gl.id === g.id ? { ...gl, text: t } : gl) }); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 999,
                background: g.done ? hexA(p.accent, 0.22) : glass,
                border: `1.5px solid ${g.done ? p.accent : border}`,
                fontSize: 14, fontWeight: 600, color: g.done ? p.accent : p.text2,
                cursor: editing ? 'pointer' : 'default', backdropFilter: 'blur(6px)',
                boxShadow: g.done ? `0 0 16px ${hexA(p.accent, 0.3)}` : 'none',
                transition: 'all 0.2s',
              }}>
              <span style={{ width: 15, height: 15, borderRadius: '50%', border: `1.5px solid ${g.done ? p.accent : hexA(p.text2, 0.4)}`, background: g.done ? p.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: g.done ? `0 0 8px ${p.accent}` : 'none' }}>
                {g.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>✓</span>}
              </span>
              {g.text}
            </span>
          ))}
          {editing && content.goals.length < 7 && (
            <button onClick={() => scheduleUpdate({ goals: [...content.goals, { id: Date.now().toString(), text: 'New goal', done: false }] })}
              style={{ height: 38, padding: '0 16px', borderRadius: 999, border: `1.5px dashed ${border}`, background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: hexA(p.text2, 0.6), fontFamily: "'Nunito', sans-serif" }}>
              + add goal
            </button>
          )}
        </div>

        {/* currently */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: glass, border: `1.5px solid ${border}`, borderRadius: 999, padding: '9px 18px', fontSize: 14, color: p.text2, fontWeight: 600, backdropFilter: 'blur(6px)' }}
            contentEditable={editing || undefined}
            suppressContentEditableWarning
            onBlur={e => scheduleUpdate({ currently: e.currentTarget.innerText.trim() })}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.accent2, boxShadow: `0 0 8px ${p.accent2}`, flexShrink: 0 }} />
            {content.currently || (editing ? tokens.currently_placeholder || 'Currently…' : '')}
          </span>
        </div>

        {/* ── 2-COL GRID ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
          <div style={{ background: glass, border: `1.5px solid ${border}`, borderRadius: 20, padding: '22px 24px', backdropFilter: 'blur(12px)', boxShadow: `0 0 30px ${hexA(p.accent, 0.08)}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: hexA(p.text2, 0.55), fontWeight: 700, marginBottom: 10 }}>This week · focus</div>
            <div
              style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.3, marginBottom: 12, color: p.text, outline: 'none', minHeight: 28, textShadow: `0 0 20px ${hexA(p.accent, 0.2)}` }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ heroTitle: e.currentTarget.innerText.trim() })}
            >
              {content.heroTitle || (editing ? tokens.hero_title_placeholder || 'What are you focused on?' : '')}
            </div>
            <p
              style={{ fontSize: 14, lineHeight: 1.85, color: p.text2, outline: 'none', minHeight: editing ? 56 : 0 }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ heroNotes: e.currentTarget.innerText.trim() })}
            >
              {content.heroNotes || (editing ? 'Add some context…' : '')}
            </p>
          </div>

          <div style={{ background: glass, border: `1.5px solid ${border}`, borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', boxShadow: `0 0 30px ${hexA(p.accent, 0.08)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${hexA(p.accent, 0.18)}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.6), display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Notepad
              </span>
              <span style={{ fontSize: 12, color: hexA(p.text2, 0.5), fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div
              style={{ padding: '16px 18px', fontSize: 14, lineHeight: 1.9, color: p.text2, flex: 1, minHeight: 110, outline: 'none' }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ notepad: e.currentTarget.innerText.trim() })}
            >
              {content.notepad || (editing ? tokens.notepad_starter || 'Write something…' : '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
