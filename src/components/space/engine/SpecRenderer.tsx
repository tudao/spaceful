'use client';

import { useMemo } from 'react';
import type { SpaceContent } from '../SpacePage';
import type { EngineTokens, TemplateSpec } from './types';
import { DECORATIONS } from './decorations';
import { SECTIONS } from './sections';
import { cardStyle } from './cards';
import { titleFontSize } from './typography';
import { hexA, isDarkMood, resolveSpec } from './utils';

interface SpecRendererProps {
  content: SpaceContent;
  tokens: EngineTokens;
  spec?: TemplateSpec;
  isOwner: boolean;
  mode: 'editing' | 'preview';
  onUpdate: (patch: Partial<SpaceContent>) => void;
  onSave: (content: SpaceContent) => Promise<unknown>;
}

export function SpecRenderer({ content, tokens, spec: specProp, isOwner, mode, onUpdate, onSave }: SpecRendererProps) {
  const spec = useMemo(() => specProp ?? resolveSpec(tokens.template_id, tokens.spec_override), [specProp, tokens.template_id, tokens.spec_override]);
  const p = tokens.palette;
  const editing = isOwner && mode === 'editing';
  const Decoration = DECORATIONS[spec.decoration.type] ?? DECORATIONS.minimal;
  const donePct = content.goals.length ? Math.round(content.goals.filter(g => g.done).length / content.goals.length * 100) : 0;
  const card = cardStyle(spec, p, tokens.mood);
  const border = hexA(p.accent, 0.28);
  const muted = hexA(p.text2, 0.66);
  const sceneHeader = tokens.template_id === 'laki-world' || spec.layout.header_style === 'botanical' || spec.layout.header_style === 'wave' || spec.decoration.type === 'clouds';

  function commit(patch: Partial<SpaceContent>) {
    const next = { ...content, ...patch };
    onUpdate(patch);
    void onSave(next);
  }

  function toggleGoal(id: string) {
    if (!editing) return;
    commit({ goals: content.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) });
  }

  function updateGoalText(id: string, text: string) {
    if (!text || !editing) return;
    commit({ goals: content.goals.map(g => g.id === id ? { ...g, text } : g) });
  }

  function addGoal() {
    if (!editing || content.goals.length >= 7) return;
    commit({ goals: [...content.goals, { id: Date.now().toString(), text: 'New goal', done: false }] });
  }

  const vars = {
    '--sp-bg': p.bg,
    '--sp-bg2': p.bg2,
    '--sp-surface': p.surface,
    '--sp-accent': p.accent,
    '--sp-accent2': p.accent2,
    '--sp-text': p.text,
    '--sp-text2': p.text2,
    '--sp-muted': muted,
    '--sp-border': border,
    '--sp-glow': p.glow,
    '--sp-chip-bg': isDarkMood(tokens.mood) ? hexA(p.surface, 0.34) : 'rgba(255,255,255,0.62)',
    '--sp-done-bg': hexA(p.accent, 0.15),
  } as React.CSSProperties;

  const sectionProps = {
    content,
    tokens,
    spec,
    isOwner,
    mode,
    editing,
    onUpdate: commit,
    updateGoalText,
    toggleGoal,
    addGoal,
    styles: {
      card,
      label: { fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: muted, marginBottom: 12 },
      muted,
      border,
    },
  };

  const headerScene = sceneHeader ? (
    <div aria-hidden className={`sp-scene sp-scene-${spec.decoration.type}`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: spec.cards.radius + 4, pointerEvents: 'none' }}>
      <div className="sp-scene-sky" style={{ position: 'absolute', inset: 0, background: `linear-gradient(155deg, ${hexA('#ffffff', 0.58)}, transparent 36%), radial-gradient(circle at 82% 18%, ${hexA(p.accent2, 0.28)}, transparent 26%), linear-gradient(135deg, ${hexA(p.accent2, 0.18)}, ${hexA(p.accent, 0.10)})` }} />
      {(spec.decoration.type === 'botanicals' || spec.decoration.type === 'forest' || spec.decoration.type === 'petals') && (
        <>
          <svg viewBox="0 0 640 210" preserveAspectRatio="none" style={{ position: 'absolute', inset: 'auto 0 0', width: '100%', height: '78%', opacity: 0.9 }}>
            <path d="M0 168 C96 130 160 158 246 132 C340 104 410 126 512 100 C578 84 620 94 640 86 L640 210 L0 210Z" fill={hexA(p.accent, 0.14)} />
            <path d="M0 188 C110 146 216 178 318 142 C420 110 506 136 640 116 L640 210 L0 210Z" fill={hexA(p.accent2, 0.13)} />
            {Array.from({ length: 8 }).map((_, i) => {
              const x = 24 + i * 82;
              return (
                <g key={i} className="sp-header-stem" style={{ transformOrigin: `${x}px 202px`, animationDelay: `${-i * 0.38}s` }}>
                  <path d={`M${x} 205 C${x - 5} 160 ${x + 8} 132 ${x + 1} 88`} stroke={hexA(p.accent, 0.58)} strokeWidth="3" fill="none" strokeLinecap="round" />
                  <ellipse cx={x - 10} cy="118" rx="10" ry="24" fill={hexA(p.accent, 0.20)} transform={`rotate(${-18 + i * 5} ${x - 10} 118)`} />
                  <ellipse cx={x + 12} cy="94" rx="12" ry="25" fill={hexA(p.accent2, 0.20)} transform={`rotate(${22 - i * 4} ${x + 12} 94)`} />
                  <circle cx={x + 1} cy="82" r="8" fill={hexA(i % 2 ? p.accent2 : p.accent, 0.55)} />
                </g>
              );
            })}
          </svg>
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="sp-header-petal" style={{ left: `${8 + i * 13}%`, top: `${20 + (i * 11) % 38}%`, background: hexA(i % 2 ? p.accent2 : p.accent, 0.55), animationDelay: `${-i * 1.1}s` }} />
          ))}
        </>
      )}
      {spec.decoration.type === 'clouds' && (
        <>
          {[0, 1, 2].map(i => (
            <svg key={i} viewBox="0 0 180 70" className="sp-header-cloud" style={{ top: `${16 + i * 18}%`, width: `${150 + i * 42}px`, animationDelay: `${-i * 8}s` }}>
              <path d="M45 55H137C158 55 171 45 171 32C171 20 160 11 145 12C140 5 129 1 117 5C108 -2 91 0 83 11C72 8 60 12 55 22C42 21 31 29 31 40C31 49 37 55 45 55Z" fill="rgba(255,255,255,.72)" />
            </svg>
          ))}
          <div className="sp-header-sun" style={{ background: `radial-gradient(circle, ${hexA(p.accent2, 0.5)}, transparent 68%)` }} />
        </>
      )}
      {spec.decoration.type === 'waves' && (
        <>
          {[0, 1, 2].map(i => <div key={i} className="sp-header-wave" style={{ bottom: `${-28 + i * 19}px`, background: hexA(i === 1 ? p.accent2 : p.accent, 0.16 + i * 0.04), animationDelay: `${-i * 1.4}s` }} />)}
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} viewBox="0 0 48 20" className="sp-header-fish" style={{ top: `${34 + i * 10}%`, color: i % 2 ? p.accent : p.accent2, animationDelay: `${-i * 2.3}s` }}>
              <path d="M5 10 L14 4 L14 16 Z" fill="currentColor" opacity=".78" />
              <path d="M12 10 C21 1 39 3 45 10 C39 17 21 19 12 10Z" fill="currentColor" />
              <circle cx="38.5" cy="8" r="1.25" fill="rgba(255,255,255,.86)" />
            </svg>
          ))}
        </>
      )}
    </div>
  ) : null;

  return (
    <div style={{
      ...vars,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Nunito', sans-serif",
      color: 'var(--sp-text)',
      background: `radial-gradient(ellipse 75% 55% at 80% 0%, ${hexA(p.accent2, 0.24)}, transparent 56%),
                   radial-gradient(ellipse 55% 45% at 10% 95%, ${hexA(p.accent, 0.16)}, transparent 58%),
                   linear-gradient(170deg, ${p.bg}, ${p.bg2})`,
    }}>
      <style>{`
        @keyframes sp-sway { from { transform: rotate(-8deg) translateY(0); } to { transform: rotate(8deg) translateY(-10px); } }
        @keyframes sp-tree-sway { from { transform: rotate(-2deg) translateX(-1px); } to { transform: rotate(3.5deg) translateX(2px); } }
        @keyframes sp-petal { 0% { transform: translate(0,0) rotate(0deg); opacity: .05; } 20% { opacity: .6; } 100% { transform: translate(76px,18px) rotate(260deg); opacity: .04; } }
        @keyframes sp-drift { from { transform: translateX(-2%) rotate(-4deg); } to { transform: translateX(3%) rotate(4deg); } }
        @keyframes sp-cloud { from { transform: translateX(-20vw); } to { transform: translateX(120vw); } }
        @keyframes sp-bird { from { transform: translateX(-10vw) translateY(0); } 50% { transform: translateX(55vw) translateY(-10px); } to { transform: translateX(115vw) translateY(0); } }
        @keyframes sp-fish { 0% { transform: translateX(-12vw) translateY(0); } 45% { transform: translateX(50vw) translateY(-7px); } 100% { transform: translateX(118vw) translateY(2px); } }
        @keyframes sp-bubble { from { transform: translateY(0) scale(.7); opacity: 0; } 20% { opacity: .35; } to { transform: translateY(-72vh) scale(1.2); opacity: 0; } }
        @keyframes sp-header-stem { 0%, 100% { transform: rotate(-2deg) translateX(-1px); } 42% { transform: rotate(4.5deg) translateX(3px); } 68% { transform: rotate(-3deg) translateX(-2px); } }
        @keyframes sp-header-petal { 0% { transform: translate(0,0) rotate(0deg); opacity: 0; } 20% { opacity: .68; } 100% { transform: translate(82px, -18px) rotate(250deg); opacity: 0; } }
        @keyframes sp-header-cloud { from { transform: translateX(-210px); } to { transform: translateX(calc(100vw + 220px)); } }
        @keyframes sp-header-wave { from { transform: translateX(-4%) skewX(-5deg); } to { transform: translateX(4%) skewX(5deg); } }
        @keyframes sp-header-fish { from { transform: translateX(-90px) translateY(0); } 50% { transform: translateX(54vw) translateY(-8px); } to { transform: translateX(calc(100vw + 90px)) translateY(2px); } }
        .sp-header-stem { animation: sp-header-stem 4.4s ease-in-out infinite; }
        .sp-header-petal { position: absolute; width: 8px; height: 5px; border-radius: 70% 40% 70% 40%; animation: sp-header-petal 9s ease-in-out infinite; }
        .sp-header-cloud { position: absolute; left: -220px; height: auto; opacity: .68; filter: drop-shadow(0 16px 18px rgba(82,108,134,.12)); animation: sp-header-cloud 32s linear infinite; }
        .sp-header-sun { position: absolute; right: 7%; top: 9%; width: 130px; height: 130px; border-radius: 50%; filter: blur(1px); opacity: .72; }
        .sp-header-wave { position: absolute; left: -8%; right: -8%; height: 92px; border-radius: 50% 50% 0 0; animation: sp-header-wave 5.4s ease-in-out infinite alternate; }
        .sp-header-fish { position: absolute; left: -96px; width: 48px; opacity: .48; animation: sp-header-fish 17s linear infinite; }
        .spec-header-scene::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px; background: linear-gradient(90deg, var(--sp-accent), var(--sp-accent2), #f4a89a, var(--sp-accent)); background-size: 300% 100%; animation: sp-shimmer 4.8s linear infinite; }
        @keyframes sp-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @media (max-width: 760px) { .spec-mid { grid-template-columns: 1fr !important; } .spec-header { align-items: flex-start !important; } .spec-header-scene { min-height: 300px !important; } }
      `}</style>
      <Decoration palette={p} spec={spec} mood={tokens.mood} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: spec.layout.max_width, margin: '0 auto', padding: spec.layout.density === 'spacious' ? '56px clamp(20px,5vw,48px) 84px' : '44px clamp(18px,4vw,40px) 76px' }}>
        <header className={`spec-header${sceneHeader ? ' spec-header-scene' : ''}`} style={{
          ...sceneHeader ? card : undefined,
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: spec.layout.density === 'spacious' ? 42 : 28,
          padding: sceneHeader ? '22px clamp(20px,4vw,34px)' : undefined,
          minHeight: sceneHeader ? 248 : undefined,
          overflow: sceneHeader ? 'hidden' : undefined,
          borderRadius: sceneHeader ? spec.cards.radius + 4 : undefined,
          isolation: sceneHeader ? 'isolate' : undefined,
        }}>
          {headerScene}
          <div style={{ position: 'relative', zIndex: 2, flex: 1, minWidth: 0, maxWidth: sceneHeader ? 610 : undefined }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, marginBottom: 16, padding: '6px 15px 6px 7px', borderRadius: 999, background: 'var(--sp-chip-bg)', border: `1px solid ${border}` }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${p.accent2}, ${p.accent})`, color: '#fff', fontWeight: 900, fontSize: 13, boxShadow: `0 0 24px ${p.glow}` }}>
                {(content.monogram ?? content.title.slice(0, 2)).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--sp-text2)' }}>{spec.typography.header_uppercase ? content.title.toUpperCase() : content.title}</span>
            </div>
            <h1
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => commit({ title: e.currentTarget.innerText.trim() })}
              style={{ fontSize: titleFontSize(spec.typography.title_scale), fontWeight: spec.typography.weight, lineHeight: 1.06, margin: '0 0 12px', outline: 'none' }}
            >
              {content.title}
            </h1>
            <p
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => commit({ subtitle: e.currentTarget.innerText.trim() })}
              style={{ maxWidth: 560, color: 'var(--sp-text2)', lineHeight: 1.7, fontSize: 16, margin: 0, outline: 'none' }}
            >
              {content.subtitle || (editing ? tokens.tagline || 'Add a tagline...' : '')}
            </p>
          </div>
          <div style={{ ...card, position: 'relative', zIndex: 2, width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 21, fontWeight: 900 }}>{donePct}%</div>
              <div style={{ color: muted, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>done</div>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gap: spec.layout.density === 'spacious' ? 24 : 18 }}>
          {spec.layout.sections.map((sectionId, index) => {
            const Section = SECTIONS[sectionId];
            if (!Section) return null;
            const pairWithNext = sectionId === 'focus_hero' && spec.layout.sections[index + 1] === 'notepad' && spec.layout.density !== 'spacious';
            if (pairWithNext) {
              const Notepad = SECTIONS.notepad;
              return (
                <div key="focus-notepad" className="spec-mid" style={{ display: 'grid', gridTemplateColumns: '1.08fr 1fr', gap: 18 }}>
                  <Section {...sectionProps} />
                  <Notepad {...sectionProps} />
                </div>
              );
            }
            if (sectionId === 'notepad' && spec.layout.sections[index - 1] === 'focus_hero' && spec.layout.density !== 'spacious') return null;
            return <Section key={`${sectionId}-${index}`} {...sectionProps} />;
          })}
        </div>
      </main>
    </div>
  );
}
