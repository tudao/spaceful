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
        @keyframes sp-drift { from { transform: translateX(-2%) rotate(-4deg); } to { transform: translateX(3%) rotate(4deg); } }
        @media (max-width: 760px) { .spec-mid { grid-template-columns: 1fr !important; } .spec-header { align-items: flex-start !important; } }
      `}</style>
      <Decoration palette={p} spec={spec} mood={tokens.mood} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: spec.layout.max_width, margin: '0 auto', padding: spec.layout.density === 'spacious' ? '56px clamp(20px,5vw,48px) 84px' : '44px clamp(18px,4vw,40px) 76px' }}>
        <header className="spec-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: spec.layout.density === 'spacious' ? 42 : 28 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
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
          <div style={{ ...card, width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
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

