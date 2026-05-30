'use client';

import { useRef, useEffect } from 'react';
import type { TemplateProps } from './types';
import { Fireflies } from '../Fireflies';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}


export function TemplateGarden({ content, tokens, isOwner, mode, onUpdate, onSave }: TemplateProps) {
  const p = tokens.palette;
  const isDark = tokens.mood === 'forest' || tokens.mood === 'midnight';
  const editing = isOwner && mode === 'editing';

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleUpdate(patch: Partial<typeof content>) {
    const next = { ...content, ...patch };
    onUpdate(patch);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSave(next), 800);
  }
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const glassBorder = hexA(p.accent, 0.38);
  const donePct = content.goals.length
    ? Math.round(content.goals.filter(g => g.done).length / content.goals.length * 100) : 0;

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Nunito', sans-serif", position: 'relative', overflow: 'hidden',
      background: `radial-gradient(ellipse 80% 60% at 70% -10%, ${hexA(p.accent2, 0.30)}, transparent 55%),
                   radial-gradient(ellipse 60% 50% at 10% 110%, ${hexA(p.accent, 0.18)}, transparent 55%),
                   linear-gradient(170deg, ${p.bg}, ${p.bg2})`,
      color: p.text,
    }}>
      <Fireflies color={p.glow} count={isDark ? 32 : 16} className="space-fireflies" />

      {/* Animated botanical header decoration */}
      <GardenHeader p={p} isDark={isDark} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '44px clamp(20px,4vw,40px) 80px' }}>

        {/* ── HERO CARD ─────────────────────────────────────── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: isDark
            ? `linear-gradient(130deg, ${hexA(p.accent, 0.16)}, ${hexA(p.surface, 0.10)})`
            : `linear-gradient(130deg, rgba(255,255,255,0.82), ${hexA(p.accent2, 0.12)})`,
          border: `1.5px solid ${glassBorder}`,
          borderRadius: 24, padding: '28px 32px',
          boxShadow: `0 8px 36px ${p.glow}`,
          backdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
          marginBottom: 28,
        }}>
          {/* shimmer top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.accent2}, ${p.accent2}, ${p.accent}, ${p.accent2}, ${p.accent2})`, backgroundSize: '300% 100%', animation: 'sp-shimmer 4s linear infinite' }} />

          <div style={{ flex: 1, minWidth: 220 }}>
            {/* brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${p.accent2}, ${p.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: '#fff',
                boxShadow: `0 0 24px ${p.glow}, 0 4px 12px ${hexA(p.accent, 0.35)}`,
                flexShrink: 0,
              }}>
                {content.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: p.text2, letterSpacing: '0.04em' }}>{content.title.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: hexA(p.text2, 0.65), display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent2, display: 'inline-block', animation: 'sp-pulse 2s infinite' }} />
                  updated recently
                </div>
              </div>
            </div>

            <h1
              style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 10, outline: 'none' }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ title: e.currentTarget.innerText.trim() })}
            >
              {content.title}
            </h1>
            <p
              style={{ fontSize: 15, color: p.text2, lineHeight: 1.7, maxWidth: 440, outline: 'none', fontStyle: content.subtitle ? 'normal' : 'italic' }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ subtitle: e.currentTarget.innerText.trim() })}
            >
              {content.subtitle || (editing ? 'Add a tagline…' : '')}
            </p>
          </div>

          {/* progress ring */}
          <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
            <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={p.accent2} /><stop offset="100%" stopColor={p.accent} />
                </linearGradient>
              </defs>
              <circle cx="46" cy="46" r="38" fill="none" stroke={hexA(p.accent, 0.15)} strokeWidth="7" />
              <circle cx="46" cy="46" r="38" fill="none" stroke="url(#rg)" strokeWidth="7"
                strokeLinecap="round" strokeDasharray="239"
                strokeDashoffset={239 - 239 * donePct / 100}
                style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.text }}>{donePct}%</div>
              <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.65), marginTop: 1 }}>done</div>
            </div>
          </div>
        </div>

        {/* ── GOALS ─────────────────────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.65), marginBottom: 13 }}>
          What I&apos;m working toward
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 16 }}>
          {content.goals.map(g => (
            <span
              key={g.id}
              onClick={() => editing && scheduleUpdate({ goals: content.goals.map(gl => gl.id === g.id ? { ...gl, done: !gl.done } : gl) })}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => {
                const text = e.currentTarget.innerText.trim();
                if (text) scheduleUpdate({ goals: content.goals.map(gl => gl.id === g.id ? { ...gl, text } : gl) });
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 38, padding: '0 16px', borderRadius: 999,
                background: g.done ? hexA(p.accent, 0.18) : (isDark ? hexA(p.surface, 0.18) : 'rgba(255,255,255,0.65)'),
                border: `1.5px solid ${g.done ? p.accent : glassBorder}`,
                fontSize: 14, fontWeight: 600,
                color: g.done ? p.accent : p.text2,
                cursor: editing ? 'pointer' : 'default',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${g.done ? p.accent : hexA(p.text2, 0.4)}`,
                background: g.done ? p.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {g.done && <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, lineHeight: 1 }}>✓</span>}
              </span>
              {g.text}
            </span>
          ))}
          {editing && content.goals.length < 7 && (
            <button
              onClick={() => scheduleUpdate({ goals: [...content.goals, { id: Date.now().toString(), text: 'New goal', done: false }] })}
              style={{ height: 38, padding: '0 16px', borderRadius: 999, border: `1.5px dashed ${glassBorder}`, background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: hexA(p.text2, 0.65), fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s' }}
            >
              + add goal
            </button>
          )}
        </div>

        {/* currently badge */}
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: isDark ? hexA(p.surface, 0.2) : 'rgba(255,255,255,0.65)',
              border: `1.5px solid ${glassBorder}`, borderRadius: 999,
              padding: '9px 18px', fontSize: 14, color: p.text2, fontWeight: 600,
              backdropFilter: 'blur(6px)',
            }}
            contentEditable={editing || undefined}
            suppressContentEditableWarning
            onBlur={e => scheduleUpdate({ currently: e.currentTarget.innerText.trim() })}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.accent2, animation: 'sp-nowpulse 1.8s infinite', flexShrink: 0 }} />
            {content.currently || (editing ? tokens.currently_placeholder || 'Currently…' : '')}
          </span>
        </div>

        {/* ── MID GRID ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18, marginBottom: 24 }}>
          {/* focus card */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: isDark ? `linear-gradient(140deg, ${hexA(p.accent, 0.18)}, ${hexA(p.accent2, 0.10)})` : `linear-gradient(140deg, rgba(255,255,255,0.82), ${hexA(p.accent2, 0.14)})`,
            border: `1.5px solid ${glassBorder}`, borderRadius: 20, padding: '22px 24px',
            boxShadow: `0 6px 28px ${p.glow}`, backdropFilter: 'blur(10px)',
          }}>
            {/* glow orb */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${p.glow}, transparent 70%)` }} />
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.65), fontWeight: 700, marginBottom: 10 }}>
              This week · focus
            </div>
            <div
              style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 12, color: p.text, minHeight: 30, outline: 'none' }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ heroTitle: e.currentTarget.innerText.trim() })}
            >
              {content.heroTitle || (editing ? tokens.hero_title_placeholder || 'What are you focused on this week?' : '')}
            </div>
            <p
              style={{ fontSize: 14, lineHeight: 1.85, color: p.text2, outline: 'none', minHeight: editing ? 60 : 0 }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ heroNotes: e.currentTarget.innerText.trim() })}
            >
              {content.heroNotes || (editing ? 'Add some context…' : '')}
            </p>
          </div>

          {/* notepad */}
          <div style={{
            background: isDark ? hexA(p.surface, 0.16) : 'rgba(255,255,255,0.68)',
            border: `1.5px solid ${glassBorder}`, borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: `0 6px 28px ${p.glow}`, backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${hexA(p.accent, 0.18)}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.65), display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                Notepad
              </span>
              <span style={{ fontSize: 12, color: hexA(p.text2, 0.55), fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div
              style={{ padding: '16px 18px', fontSize: 14, lineHeight: 1.9, color: p.text2, flex: 1, minHeight: 120, outline: 'none' }}
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => scheduleUpdate({ notepad: e.currentTarget.innerText.trim() })}
            >
              {content.notepad || (editing ? tokens.notepad_starter || 'Write something…' : '')}
            </div>
          </div>
        </div>

        {/* ── PERIOD CARDS ─────────────────────────────────── */}
        {content.periods && content.periods.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hexA(p.text2, 0.65), marginBottom: 14 }}>
              The season so far
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {content.periods.map((pd, i) => (
                <div key={i} style={{
                  background: isDark ? hexA(p.surface, 0.14) : 'rgba(255,255,255,0.55)',
                  border: `1.5px solid ${hexA(p.accent, 0.22)}`, borderRadius: 16, padding: '16px 18px',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: hexA(p.text2, 0.6), fontWeight: 700 }}>{pd.week}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 8px', color: p.text }}>{pd.title}</div>
                  <div style={{ fontSize: 12, color: p.text2, lineHeight: 1.6 }}>{pd.notes}</div>
                  <span style={{ display: 'inline-block', marginTop: 10, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: hexA(p.accent, pd.status === 'done' ? 0.18 : 0.1), color: p.accent }}>
                    {pd.status === 'done' ? 'Done' : pd.status === 'prog' ? 'In progress' : 'Planned'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Botanical header decoration — full-width, richer than before ─────────────
function GardenHeader({ p, isDark }: { p: { accent: string; accent2: string; bg: string; bg2: string }; isDark: boolean }) {
  const cloudOp = isDark ? 0.07 : 0.28;
  const stemOp  = isDark ? 0.55 : 1;

  return (
    <div aria-hidden style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes gardenSway1{0%,100%{transform:rotate(-3deg) translateX(-1px)}50%{transform:rotate(5deg) translateX(2px)}}
        @keyframes gardenSway2{0%,100%{transform:rotate(4deg) translateX(1px)}50%{transform:rotate(-5deg) translateX(-2px)}}
        @keyframes gardenSway3{0%,100%{transform:rotate(-2deg) translateX(-1.5px)}50%{transform:rotate(4.5deg) translateX(2px)}}
        @keyframes gardenSway4{0%,100%{transform:rotate(2deg) translateX(1px)}50%{transform:rotate(-4deg) translateX(-1.5px)}}
        @keyframes windDrift{0%{transform:translateX(-12px) scaleX(1)}50%{transform:translateX(12px) scaleX(1.04)}100%{transform:translateX(-12px) scaleX(1)}}
        @keyframes petalDrift{0%{transform:translate(0,0) rotate(0deg);opacity:0.5}50%{opacity:0.25}100%{transform:translate(80px,200px) rotate(200deg);opacity:0}}
        .gsw1{transform-origin:50% 100%;animation:gardenSway1 3.4s ease-in-out infinite}
        .gsw2{transform-origin:50% 100%;animation:gardenSway2 2.9s ease-in-out infinite .25s}
        .gsw3{transform-origin:50% 100%;animation:gardenSway3 3.8s ease-in-out infinite .5s}
        .gsw4{transform-origin:50% 100%;animation:gardenSway4 4.2s ease-in-out infinite .1s}
        .gsw5{transform-origin:50% 100%;animation:gardenSway1 3.1s ease-in-out infinite .7s}
        .wdc1{animation:windDrift 6s ease-in-out infinite}
        .wdc2{animation:windDrift 8s ease-in-out infinite 1.2s}
        .wdc3{animation:windDrift 10s ease-in-out infinite 2s}
      `}</style>

      {/* wind clouds — multiple layers, full width */}
      <svg className="wdc1" style={{ position: 'absolute', top: 16, left: '8%', opacity: cloudOp, width: 280 }} viewBox="0 0 280 70">
        <g fill="rgba(255,255,255,0.95)">
          <ellipse cx="70" cy="46" rx="56" ry="21"/><ellipse cx="116" cy="34" rx="44" ry="32"/>
          <ellipse cx="164" cy="46" rx="58" ry="20"/><ellipse cx="206" cy="52" rx="38" ry="16"/>
        </g>
      </svg>
      <svg className="wdc2" style={{ position: 'absolute', top: 10, left: '40%', opacity: cloudOp * 0.7, width: 240 }} viewBox="0 0 240 60">
        <g fill="rgba(255,255,255,0.88)">
          <ellipse cx="60" cy="38" rx="46" ry="17"/><ellipse cx="100" cy="27" rx="36" ry="26"/>
          <ellipse cx="142" cy="38" rx="48" ry="16"/><ellipse cx="180" cy="44" rx="32" ry="13"/>
        </g>
      </svg>
      <svg className="wdc3" style={{ position: 'absolute', top: 28, right: '5%', opacity: cloudOp * 0.5, width: 200 }} viewBox="0 0 200 55">
        <g fill="rgba(255,255,255,0.82)">
          <ellipse cx="52" cy="33" rx="40" ry="15"/><ellipse cx="90" cy="23" rx="32" ry="23"/>
          <ellipse cx="130" cy="33" rx="44" ry="15"/>
        </g>
      </svg>

      {/* floating petals */}
      {[
        {l:'8%', t:'12%', s:10, d:'0s',   dur:'18s'},
        {l:'25%',t:'8%',  s:8,  d:'4s',   dur:'22s'},
        {l:'68%',t:'6%',  s:12, d:'8s',   dur:'16s'},
        {l:'88%',t:'18%', s:9,  d:'2s',   dur:'20s'},
        {l:'45%',t:'14%', s:7,  d:'11s',  dur:'24s'},
      ].map((pt,i)=>(
        <div key={i} style={{
          position:'absolute', left:pt.l, top:pt.t, width:pt.s, height:pt.s,
          borderRadius:'50% 0 50% 0',
          background:`linear-gradient(135deg,${p.accent2},${p.accent})`,
          opacity: isDark ? 0.18 : 0.30,
          animation:`petalDrift ${pt.dur} ${pt.d} linear infinite`,
        }}/>
      ))}

      {/* ── Left botanical cluster ── */}
      <svg style={{ position: 'absolute', bottom: 0, left: 18, opacity: stemOp }} width="180" height="220" viewBox="0 0 180 220">
        {/* tall center stem */}
        <g className="gsw1">
          <path d="M52 218 C47 165 52 108 56 38" stroke={p.accent} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <path d="M52 138 C28 120 32 96 56 110" fill={p.accent2} opacity=".75"/>
          <path d="M54 98 C78 78 82 104 57 118" fill={p.accent} opacity=".65"/>
          <ellipse cx="56" cy="36" rx="8" ry="16" fill={p.accent2} opacity=".85"/>
          <ellipse cx="68" cy="46" rx="8" ry="16" fill={p.accent} opacity=".70" transform="rotate(60 68 46)"/>
          <ellipse cx="44" cy="46" rx="8" ry="16" fill={p.accent2} opacity=".78" transform="rotate(-60 44 46)"/>
          <circle cx="56" cy="35" r="6" fill="#F9D6B0" opacity=".92"/>
        </g>
        {/* left stem */}
        <g className="gsw2">
          <path d="M24 218 C19 175 25 130 29 72" stroke={p.accent2} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
          <path d="M24 148 C4 134 8 114 29 126" fill={p.accent} opacity=".60"/>
          <path d="M26 108 C46 90 50 112 30 124" fill={p.accent2} opacity=".55"/>
          <ellipse cx="29" cy="70" rx="6.5" ry="13" fill={p.accent} opacity=".82"/>
          <ellipse cx="39" cy="79" rx="6.5" ry="13" fill={p.accent2} opacity=".68" transform="rotate(60 39 79)"/>
          <circle cx="29" cy="69" r="5" fill="#F4A89A" opacity=".88"/>
        </g>
        {/* short right stem */}
        <g className="gsw3">
          <path d="M88 218 C92 182 84 148 89 98" stroke={p.accent} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M88 162 C68 150 72 136 89 146" fill={p.accent2} opacity=".50"/>
          <circle cx="89" cy="96" r="13" fill={p.accent2} opacity=".32"/>
          <circle cx="89" cy="96" r="7" fill={p.accent} opacity=".45"/>
          <circle cx="89" cy="96" r="3.5" fill="#F9D6B0" opacity=".78"/>
        </g>
        {/* tall far-left slender */}
        <g className="gsw4">
          <path d="M6 218 C3 180 7 140 10 82" stroke={p.accent2} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <circle cx="10" cy="80" r="8" fill={p.accent2} opacity=".25"/>
          <circle cx="10" cy="80" r="4" fill="#F9D6B0" opacity=".65"/>
        </g>
        {/* extra right accent stem */}
        <g className="gsw5">
          <path d="M128 218 C132 190 124 162 130 116" stroke={p.accent} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          <circle cx="130" cy="114" r="6.5" fill={p.accent} opacity=".22"/>
          <circle cx="130" cy="114" r="3" fill="#F4A89A" opacity=".60"/>
        </g>
      </svg>

      {/* ── Right botanical cluster (mirrored) ── */}
      <svg style={{ position: 'absolute', bottom: 0, right: 18, opacity: stemOp, transform: 'scaleX(-1)' }} width="140" height="180" viewBox="0 0 140 180">
        <g className="gsw2">
          <path d="M44 178 C40 138 44 98 48 44" stroke={p.accent2} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M44 118 C22 104 26 84 48 96" fill={p.accent} opacity=".62"/>
          <ellipse cx="48" cy="42" rx="7" ry="14" fill={p.accent2} opacity=".80"/>
          <ellipse cx="58" cy="51" rx="7" ry="14" fill={p.accent} opacity=".65" transform="rotate(60 58 51)"/>
          <circle cx="48" cy="41" r="5.5" fill="#F4A89A" opacity=".88"/>
        </g>
        <g className="gsw1">
          <path d="M80 178 C84 148 76 114 82 62" stroke={p.accent} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M80 120 C60 108 62 92 82 102" fill={p.accent2} opacity=".52"/>
          <circle cx="82" cy="60" r="11" fill={p.accent2} opacity=".28"/>
          <circle cx="82" cy="60" r="5.5" fill="#F9D6B0" opacity=".70"/>
        </g>
        <g className="gsw3">
          <path d="M112 178 C108 155 114 128 116 90" stroke={p.accent2} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          <circle cx="116" cy="88" r="7" fill={p.accent} opacity=".22"/>
          <circle cx="116" cy="88" r="3" fill="#F4A89A" opacity=".58"/>
        </g>
      </svg>

      {/* grass wave across bottom */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 22 }} viewBox="0 0 1400 22" preserveAspectRatio="none">
        <path d="M0 14 C175 5 350 16 540 8 S880 16 1160 6 S1300 14 1400 9" stroke={p.accent} strokeWidth="12" fill="none" opacity={isDark ? 0.07 : 0.13} strokeLinecap="round"/>
      </svg>
    </div>
  );
}

