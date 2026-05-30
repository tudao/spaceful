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

export function TemplateJournal({ content, tokens, isOwner, mode, onUpdate, onSave }: TemplateProps) {
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

  const border = hexA(p.accent, 0.28);

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Nunito', sans-serif", position: 'relative',
      background: `radial-gradient(ellipse 100% 50% at 50% 0%, ${hexA(p.accent2, 0.22)}, transparent 55%),
                   linear-gradient(180deg, ${p.bg}, ${p.bg2} 60%, ${p.bg})`,
      color: p.text,
    }}>
      <Fireflies color={p.glow} count={10} className="space-fireflies" />

      {/* ruled-paper horizontal lines decoration */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${5 + i * 5}%`, height: 1, background: p.accent }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '56px clamp(20px,5vw,48px) 80px' }}>

        {/* ── JOURNAL HEADER ──────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}>
          {/* date stamp */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: hexA(p.text2, 0.55), marginBottom: 16 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* monogram */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${p.accent2}, ${p.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', boxShadow: `0 0 32px ${p.glow}, 0 8px 24px ${hexA(p.accent, 0.3)}` }}>
              {content.title.slice(0,2).toUpperCase()}
            </div>
          </div>

          <h1
            style={{ fontSize: 'clamp(36px,5.5vw,60px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', marginBottom: 14, outline: 'none' }}
            contentEditable={editing || undefined}
            suppressContentEditableWarning
            onBlur={e => scheduleUpdate({ title: e.currentTarget.innerText.trim() })}
          >
            {content.title}
          </h1>
          <p
            style={{ fontSize: 17, color: p.text2, lineHeight: 1.7, maxWidth: 44 + 'ch', margin: '0 auto', outline: 'none', fontStyle: 'italic' }}
            contentEditable={editing || undefined}
            suppressContentEditableWarning
            onBlur={e => scheduleUpdate({ subtitle: e.currentTarget.innerText.trim() })}
          >
            {content.subtitle || (editing ? 'A tagline for your space…' : '')}
          </p>

          {/* divider with progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '28px auto 0', maxWidth: 420 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${hexA(p.accent, 0.4)})` }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: hexA(p.text2, 0.6), whiteSpace: 'nowrap' }}>
              {donePct}% complete
            </div>
            <div style={{ width: 80, height: 4, borderRadius: 99, background: hexA(p.accent, 0.15), overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${donePct}%`, background: `linear-gradient(to right, ${p.accent2}, ${p.accent})`, borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${hexA(p.accent, 0.4)})` }} />
          </div>
        </div>

        {/* ── GOALS ─────────────────────────────────── */}
        <div style={{ background: `rgba(255,255,255,0.65)`, border: `1px solid ${border}`, borderRadius: 20, padding: '22px 26px', marginBottom: 22, backdropFilter: 'blur(10px)', boxShadow: `0 4px 24px ${hexA(p.accent, 0.08)}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: hexA(p.text2, 0.55), marginBottom: 14 }}>
            What I&apos;m working toward
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 14 }}>
            {content.goals.map(g => (
              <span key={g.id}
                onClick={() => editing && scheduleUpdate({ goals: content.goals.map(gl => gl.id === g.id ? { ...gl, done: !gl.done } : gl) })}
                contentEditable={editing || undefined}
                suppressContentEditableWarning
                onBlur={e => { const t = e.currentTarget.innerText.trim(); if(t) scheduleUpdate({ goals: content.goals.map(gl => gl.id === g.id ? { ...gl, text: t } : gl) }); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 15px', borderRadius: 999,
                  background: g.done ? hexA(p.accent, 0.14) : hexA(p.accent, 0.06),
                  border: `1.5px solid ${g.done ? p.accent : border}`,
                  fontSize: 14, fontWeight: 600, color: g.done ? hexA(p.accent, 0.85) : p.text2,
                  cursor: editing ? 'pointer' : 'default', transition: 'all 0.2s',
                }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${g.done ? p.accent : hexA(p.text2, 0.35)}`, background: g.done ? p.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {g.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>✓</span>}
                </span>
                {g.text}
              </span>
            ))}
            {editing && content.goals.length < 7 && (
              <button onClick={() => scheduleUpdate({ goals: [...content.goals, { id: Date.now().toString(), text: 'New goal', done: false }] })}
                style={{ height: 36, padding: '0 15px', borderRadius: 999, border: `1.5px dashed ${border}`, background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: hexA(p.text2, 0.55), fontFamily: "'Nunito', sans-serif" }}>
                + add
              </button>
            )}
          </div>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: hexA(p.accent, 0.08), border: `1px solid ${border}`, borderRadius: 999, padding: '7px 15px', fontSize: 13, color: p.text2, fontWeight: 600 }}
            contentEditable={editing || undefined}
            suppressContentEditableWarning
            onBlur={e => scheduleUpdate({ currently: e.currentTarget.innerText.trim() })}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.accent2, flexShrink: 0 }} />
            {content.currently || (editing ? tokens.currently_placeholder || 'Currently…' : '')}
          </span>
        </div>

        {/* ── JOURNAL ENTRY ──────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* focus */}
          <div style={{ background: `rgba(255,255,255,0.68)`, border: `1px solid ${border}`, borderRadius: 18, padding: '22px 24px', backdropFilter: 'blur(8px)', boxShadow: `0 4px 24px ${hexA(p.accent, 0.07)}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: hexA(p.text2, 0.5), fontWeight: 700, marginBottom: 10 }}>This week · focus</div>
            <div
              style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, color: p.text, marginBottom: 12, outline: 'none', minHeight: 24 }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ heroTitle: e.currentTarget.innerText.trim() })}
            >
              {content.heroTitle || (editing ? tokens.hero_title_placeholder || 'What are you working on?' : '')}
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

          {/* notepad — ruled paper feel */}
          <div style={{ background: `rgba(255,255,255,0.72)`, border: `1px solid ${border}`, borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', boxShadow: `0 4px 24px ${hexA(p.accent, 0.07)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: hexA(p.accent, 0.06), borderBottom: `1px solid ${hexA(p.accent, 0.15)}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.55), display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Notepad
              </span>
              <span style={{ fontSize: 12, color: hexA(p.text2, 0.5), fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {/* ruled lines background */}
            <div style={{ position: 'relative', flex: 1 }}>
              {Array.from({length: 6}).map((_,i) => (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${20 + i * 28}px`, height: 1, background: hexA(p.accent, 0.08) }} />
              ))}
              <div
                style={{ position: 'relative', padding: '16px 18px', fontSize: 14, lineHeight: 1.9, color: p.text2, minHeight: 120, outline: 'none', zIndex: 1 }}
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
    </div>
  );
}
