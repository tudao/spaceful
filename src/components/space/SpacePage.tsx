'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Edit3, Eye, Share2, Settings, Heart, ChevronDown, Check as CheckIcon } from 'lucide-react';
import { Fireflies } from './Fireflies';
import { ThemeDecorations } from './ThemeDecorations';
import { AmbientPlayer } from './AmbientPlayer';
import { type SpaceMood, SPACE_PALETTES } from '@/lib/utils';

export interface SpaceContent {
  title: string;
  subtitle?: string;
  monogram?: string;
  goals: { id: string; text: string; done: boolean }[];
  currently?: string;
  heroTitle?: string;
  heroNotes?: string;
  notepad?: string;
  periods?: { week: string; title: string; notes: string; status: 'done' | 'prog' | 'plan' }[];
  progressPct?: number;
}

export interface SpacePalette {
  bg: string; bg2: string; surface: string;
  accent: string; accent2: string;
  text: string; text2: string; glow: string;
}

interface SpacePageProps {
  content: SpaceContent;
  mood?: SpaceMood;
  palette?: SpacePalette;
  layoutVariant?: 'spacious' | 'rich';
  isOwner?: boolean;
  username?: string;
  spaceId?: string;
  reactions?: { id: string; message: string; ago: string; initial: string }[];
  creditBalance?: number;
  onOpenSettings?: () => void;
  onOpenShare?: () => void;
  onSave?: (content: SpaceContent) => Promise<{ error?: string; ok?: boolean } | void>;
}

export function SpacePage({
  content: initialContent,
  mood = 'lavender',
  palette: paletteProp,
  layoutVariant = 'rich',
  isOwner = false,
  username = '',
  reactions = [],
  creditBalance = 0,
  onOpenSettings,
  onOpenShare,
  onSave,
}: SpacePageProps) {
  const [mode, setMode]       = useState<'editing' | 'preview'>('editing');
  const [content, setContent] = useState<SpaceContent>(initialContent);
  const [rxOpen, setRxOpen]   = useState(false);
  const [rxPublic, setRxPublic] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // use the saved palette from design_tokens if provided, fall back to mood preset
  const p = paletteProp ?? SPACE_PALETTES[mood];
  const isDark = mood === 'forest' || mood === 'midnight';

  // alpha helpers
  function hex2rgba(hex: string, a: number) {
    const h = hex.replace('#','');
    const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  }

  // Glass backgrounds tuned per light / dark theme
  const cardBg  = isDark
    ? `linear-gradient(120deg, ${hex2rgba(p.accent, 0.12)}, ${hex2rgba(p.surface, 0.08)})`
    : `linear-gradient(120deg, rgba(255,255,255,0.78), rgba(255,255,255,0.44))`;
  const heroBg  = isDark
    ? `linear-gradient(140deg, ${hex2rgba(p.accent, 0.15)}, ${hex2rgba(p.accent2, 0.08)})`
    : `linear-gradient(140deg, rgba(255,255,255,0.82), ${hex2rgba(p.accent2, 0.12)})`;
  const noteBg  = isDark
    ? hex2rgba(p.surface, 0.14)
    : 'rgba(255,255,255,0.68)';
  const chipBg  = isDark
    ? hex2rgba(p.accent, 0.14)
    : 'rgba(255,255,255,0.62)';

  // CSS vars derived from the palette — applied inline on the space root element
  const spaceVars: React.CSSProperties = {
    '--sp-bg':       p.bg,
    '--sp-bg2':      p.bg2,
    '--sp-surface':  p.surface,
    '--sp-accent':   p.accent,
    '--sp-accent2':  p.accent2,
    '--sp-text':     p.text,
    '--sp-text2':    p.text2,
    '--sp-text3':    hex2rgba(p.text2, 0.65),
    '--sp-border':   hex2rgba(p.accent, 0.22),
    '--sp-border2':  hex2rgba(p.accent, 0.44),
    '--sp-glow':     p.glow,
    '--sp-card-bg':  cardBg,
    '--sp-hero-bg':  heroBg,
    '--sp-note-bg':  noteBg,
    '--sp-chip-bg':  chipBg,
  } as React.CSSProperties;

  // ── autosave ─────────────────────────────────────────────────────────────
  const save = useCallback(async (next: SpaceContent) => {
    if (!onSave) return;
    setSaveState('saving');
    const res = await onSave(next);
    setSaveState(res && 'error' in res && res.error ? 'error' : 'saved');
    setTimeout(() => setSaveState('idle'), 2000);
  }, [onSave]);

  const schedulesSave = useCallback((next: SpaceContent) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next), 800);
  }, [save]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function update(patch: Partial<SpaceContent>) {
    const next = { ...content, ...patch };
    setContent(next);
    schedulesSave(next);
  }

  // ── goal helpers ──────────────────────────────────────────────────────────
  function toggleGoal(id: string) {
    if (mode !== 'editing') return;
    const next = { ...content, goals: content.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) };
    setContent(next);
    // goal toggling saves immediately (discrete action, not typing)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(next);
  }

  function addGoal() {
    if (content.goals.length >= 7) return;
    const next = { ...content, goals: [...content.goals, { id: Date.now().toString(), text: 'New goal', done: false }] };
    setContent(next);
    schedulesSave(next);
  }

  function updateGoalText(id: string, text: string) {
    update({ goals: content.goals.map(g => g.id === id ? { ...g, text } : g) });
  }

  const creditClass = creditBalance === 0 ? 'zero' : creditBalance < 5 ? 'low' : '';
  const periodLabel = { done: 'Done', prog: 'In progress', plan: 'Planned' } as const;
  const periodCls   = { done: 'done', prog: 'prog', plan: 'plan' } as const;

  const donePct = content.goals.length
    ? Math.round((content.goals.filter(g => g.done).length / content.goals.length) * 100)
    : 0;

  return (
    <>
      {/* credit pill */}
      {isOwner && (
        <a
          href="/account/credits"
          style={{
            position: 'fixed', top: 18, left: 18, zIndex: 40,
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 40, padding: '0 15px', borderRadius: 999,
            background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 4px 18px rgba(26,16,64,0.14)',
            fontSize: 14, fontWeight: 700, color: 'var(--app-accent-ink)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
          className={`owner-credit ${creditClass}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
          </svg>
          {creditBalance === 0 ? 'Buy credits' : `${creditBalance} credits`}
        </a>
      )}

      {/* owner toolbar */}
      {isOwner && (
        <div style={{
          position: 'fixed', top: 18, right: 18, zIndex: 41,
          display: 'flex', alignItems: 'center', gap: 8, padding: 6,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 4px 18px rgba(26,16,64,0.14)',
        }}>
          <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'var(--app-bg-2)', borderRadius: 999 }}>
            {(['editing', 'preview'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  border: 'none', background: mode === m ? '#fff' : 'none',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                  color: mode === m ? 'var(--app-accent-ink)' : 'var(--app-text-2)',
                  padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: mode === m ? 'var(--shadow-soft)' : 'none',
                  transition: 'var(--t-fast)',
                }}
              >
                {m === 'editing' ? <Edit3 size={15} /> : <Eye size={15} />}
                {m === 'editing' ? 'Editing' : 'Preview'}
              </button>
            ))}
          </div>
          {/* save indicator */}
          {saveState !== 'idle' && (
            <span style={{ fontSize: 12, color: saveState === 'error' ? 'var(--app-danger)' : 'var(--app-success)', fontWeight: 600, padding: '0 4px' }}>
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Error'}
            </span>
          )}
          <button onClick={onOpenShare} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--app-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Share">
            <Share2 size={19} />
          </button>
          <button onClick={onOpenSettings} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--app-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Settings">
            <Settings size={19} />
          </button>
        </div>
      )}

      {/* ambient player — visible to everyone */}
      <AmbientPlayer mood={mood} accentColor={p.accent} />

      {/* space */}
      <div
        className={`space${isOwner && mode === 'editing' ? ' editing' : ''}`}
        style={spaceVars}
      >
        <Fireflies color={p.glow} count={isDark ? 30 : 18} className="space-fireflies" />
        <ThemeDecorations mood={mood} accent={p.accent} accent2={p.accent2} />

        <div className="space-wrap">
          {/* header */}
          <header className="sp-header">
            <div className="sp-head-left">
              <div className="sp-brand">
                <div className="sp-monogram" style={{
                  background: `linear-gradient(135deg, ${p.accent2}, ${p.accent})`,
                  boxShadow: `0 0 24px ${p.glow}, 0 4px 12px ${hex2rgba(p.accent, 0.35)}`,
                }}>
                  {(content.monogram ?? content.title.slice(0, 2)).toUpperCase()}
                </div>
                <div>
                  <div className="sp-wordmark" style={{ color: p.text2 }}>{content.title.toUpperCase()}</div>
                  <div className="sp-live" style={{ color: hex2rgba(p.text2, 0.7) }}>
                    <span className="dot" style={{ background: p.accent2 }} />
                    updated recently
                  </div>
                </div>
              </div>
              <h1
                className="sp-title"
                data-edit="title"
                contentEditable={isOwner && mode === 'editing' || undefined}
                suppressContentEditableWarning
                onBlur={e => update({ title: e.currentTarget.innerText.trim() })}
              >
                {content.title}
              </h1>
              <p
                className="sp-subtitle"
                data-edit="subtitle"
                contentEditable={isOwner && mode === 'editing' || undefined}
                suppressContentEditableWarning
                onBlur={e => update({ subtitle: e.currentTarget.innerText.trim() })}
              >
                {content.subtitle}
              </p>
            </div>
            <div className="sp-ring-wrap" title={`${donePct}% goals done`}>
              <svg width="96" height="96" viewBox="0 0 96 96">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={p.accent2}/>
                    <stop offset="100%" stopColor={p.accent}/>
                  </linearGradient>
                </defs>
                <circle className="sp-ring-track" cx="48" cy="48" r="39" stroke={hex2rgba(p.accent, 0.18)}/>
                <circle className="sp-ring-fill" cx="48" cy="48" r="39"
                  stroke="url(#ringGrad)"
                  style={{ strokeDashoffset: 245 - (245 * donePct / 100) }} />
              </svg>
              <div className="sp-ring-center">
                <div className="sp-ring-pct" style={{ color: p.text }}>{donePct}%</div>
                <div className="sp-ring-sub" style={{ color: hex2rgba(p.text2, 0.7) }}>done</div>
              </div>
            </div>
          </header>

          {/* goals */}
          <div className="sp-section-label">What I&apos;m working toward</div>
          <div className="sp-goals">
            {content.goals.map(g => (
              <span
                key={g.id}
                className={`sp-goal${g.done ? ' done' : ''}`}
                data-edit="goal"
                onClick={() => toggleGoal(g.id)}
                contentEditable={isOwner && mode === 'editing' || undefined}
                suppressContentEditableWarning
                onBlur={e => updateGoalText(g.id, e.currentTarget.innerText.trim())}
                style={{ cursor: isOwner && mode === 'editing' ? 'pointer' : 'default' }}
              >
                <span className="check">{g.done && <CheckIcon size={10} color="#fff" strokeWidth={3} />}</span>
                {g.text}
              </span>
            ))}
            {isOwner && mode === 'editing' && content.goals.length < 7 && (
              <button className="sp-goal-add" onClick={addGoal}>+ add goal</button>
            )}
          </div>

          {/* currently */}
          <div style={{ marginTop: 16 }}>
            <span
              className="sp-currently"
              data-edit="currently"
              contentEditable={isOwner && mode === 'editing' || undefined}
              suppressContentEditableWarning
              onBlur={e => update({ currently: e.currentTarget.innerText.trim() })}
            >
              <span className="now" />
              {content.currently || (isOwner && mode === 'editing' ? 'Currently…' : '')}
            </span>
          </div>

          {/* ── SPACIOUS layout: big focus hero, notepad below, no period cards ── */}
          {layoutVariant === 'spacious' && (
            <div style={{ marginTop: 28 }}>
              <div className="sp-hero" style={{ marginBottom: 18 }}>
                <div className="sp-hero-period">This week · focus</div>
                <div
                  className="sp-hero-title"
                  data-edit="hero-title"
                  contentEditable={isOwner && mode === 'editing' || undefined}
                  suppressContentEditableWarning
                  onBlur={e => update({ heroTitle: e.currentTarget.innerText.trim() })}
                  style={{ fontSize: 'clamp(22px,3vw,32px)' }}
                >
                  {content.heroTitle || (isOwner && mode === 'editing' ? 'What are you focused on this week?' : '')}
                </div>
                <p
                  className="sp-hero-notes"
                  data-edit="hero-notes"
                  contentEditable={isOwner && mode === 'editing' || undefined}
                  suppressContentEditableWarning
                  onBlur={e => update({ heroNotes: e.currentTarget.innerText.trim() })}
                  style={{ fontSize: 15, lineHeight: 1.9, marginTop: 14 }}
                >
                  {content.heroNotes || (isOwner && mode === 'editing' ? 'Add some context…' : '')}
                </p>
              </div>

              <div className="sp-notepad">
                <div className="sp-np-head">
                  <span className="lbl">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    Notepad
                  </span>
                  <span className="sp-np-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div
                  className="sp-np-body"
                  data-edit="notepad"
                  contentEditable={isOwner && mode === 'editing' || undefined}
                  suppressContentEditableWarning
                  onBlur={e => update({ notepad: e.currentTarget.innerText.trim() })}
                  style={{ minHeight: 160, fontSize: 15, lineHeight: 2 }}
                >
                  {content.notepad || (isOwner && mode === 'editing' ? 'Write something…' : '')}
                </div>
              </div>
            </div>
          )}

          {/* ── RICH layout: side-by-side hero + notepad, then period cards ── */}
          {layoutVariant === 'rich' && (
            <>
              <div className="sp-mid">
                <div className="sp-hero">
                  <div className="sp-hero-period">This week · focus</div>
                  <div
                    className="sp-hero-title"
                    data-edit="hero-title"
                    contentEditable={isOwner && mode === 'editing' || undefined}
                    suppressContentEditableWarning
                    onBlur={e => update({ heroTitle: e.currentTarget.innerText.trim() })}
                  >
                    {content.heroTitle || (isOwner && mode === 'editing' ? 'What are you focused on this week?' : '')}
                  </div>
                  <p
                    className="sp-hero-notes"
                    data-edit="hero-notes"
                    contentEditable={isOwner && mode === 'editing' || undefined}
                    suppressContentEditableWarning
                    onBlur={e => update({ heroNotes: e.currentTarget.innerText.trim() })}
                  >
                    {content.heroNotes || (isOwner && mode === 'editing' ? 'Add some context…' : '')}
                  </p>
                </div>

                <div className="sp-notepad">
                  <div className="sp-np-head">
                    <span className="lbl">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                      Notepad
                    </span>
                    <span className="sp-np-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div
                    className="sp-np-body"
                    data-edit="notepad"
                    contentEditable={isOwner && mode === 'editing' || undefined}
                    suppressContentEditableWarning
                    onBlur={e => update({ notepad: e.currentTarget.innerText.trim() })}
                    style={{ minHeight: 120 }}
                  >
                    {content.notepad || (isOwner && mode === 'editing' ? 'Write something…' : '')}
                  </div>
                </div>
              </div>

              {content.periods && content.periods.length > 0 && (
                <>
                  <div className="sp-section-label">The season so far</div>
                  <div className="sp-periods">
                    {content.periods.map((pd, i) => (
                      <div key={i} className="sp-period">
                        <div className="wk">{pd.week}</div>
                        <div className="ti" data-edit="period-title" contentEditable={isOwner && mode === 'editing' || undefined} suppressContentEditableWarning>{pd.title}</div>
                        <div className="no" data-edit="period-notes" contentEditable={isOwner && mode === 'editing' || undefined} suppressContentEditableWarning>{pd.notes}</div>
                        <span className={`tag ${periodCls[pd.status]}`}>{periodLabel[pd.status]}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* reactions panel (owner only, editing mode) */}
      {isOwner && mode === 'editing' && (
        <div style={{ maxWidth: 940, margin: '24px auto 0', padding: '0 clamp(18px,4vw,36px)' }}>
          <div style={{ background: 'rgba(255,255,255,0.62)', border: '1.5px solid var(--sp-border)', borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(4px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', cursor: 'pointer' }} onClick={() => setRxOpen(o => !o)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(244,168,152,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d98b76' }}>
                  <Heart size={15} />
                </span>
                <div>
                  <div>{reactions.length} visitor note{reactions.length !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 12, color: 'var(--app-text-muted)', fontWeight: 600 }}>
                    {reactions.length > 0 ? 'tap to view' : 'None yet'}
                  </div>
                </div>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--app-text-muted)', transform: rxOpen ? 'rotate(180deg)' : 'none', transition: 'var(--t-fast)' }} />
            </div>
            {rxOpen && (
              <div style={{ padding: '0 20px 18px' }}>
                {reactions.map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 11, padding: '11px 0', borderTop: '1px solid var(--app-border)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#D8C8F0,#9D7DE8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                      {r.initial}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--app-text-2)', lineHeight: 1.55 }}>{r.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>{r.ago}</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderTop: '1px solid var(--app-border)', fontSize: 13, color: 'var(--app-text-2)' }}>
                  <span>Show reactions publicly on my space</span>
                  <label className="switch">
                    <input type="checkbox" checked={rxPublic} onChange={e => setRxPublic(e.target.checked)} />
                    <span className="track" /><span className="thumb" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
