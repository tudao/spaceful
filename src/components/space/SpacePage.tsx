'use client';

import { useState } from 'react';
import { Edit3, Eye, Share2, Settings, Heart, ChevronDown } from 'lucide-react';
import { Fireflies } from './Fireflies';
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

interface SpacePageProps {
  content: SpaceContent;
  mood?: SpaceMood;
  isOwner?: boolean;
  username?: string;
  reactions?: { id: string; message: string; ago: string; initial: string }[];
  onOpenSettings?: () => void;
  onOpenShare?: () => void;
  onSave?: (content: SpaceContent) => void;
}

const DEFAULT_CONTENT: SpaceContent = {
  title: "Laki's World",
  subtitle: 'A quiet corner for a slow novel, long runs, and the books that keep me company.',
  monogram: 'LW',
  goals: [
    { id: '1', text: 'Write my first novel', done: true },
    { id: '2', text: 'Run 3× a week', done: true },
    { id: '3', text: 'Read 24 books', done: false },
    { id: '4', text: 'Learn film photography', done: false },
  ],
  currently: 'Currently reading The Creative Act',
  heroTitle: 'Finish chapter three before Sunday',
  heroNotes: 'The hard middle. Marisol finally tells him the truth and I keep flinching away from it. The goal is to stop editing as I go and just let the scene be messy.',
  notepad: 'Slept badly but got to the desk by seven. Coffee, then 600 words before the noise of the day.\n\nRan the long loop by the reservoir — first time it felt easy this year. Saw two herons.\n\nReading before bed instead of the phone. Small thing, big difference.',
  periods: [
    { week: 'Week 20', title: 'Outline the ending', notes: 'Mapped the last three chapters on index cards. It finally has a shape.', status: 'done' },
    { week: 'Week 21', title: 'Build the running habit', notes: 'Three runs, no excuses. Laid clothes out the night before.', status: 'prog' },
    { week: 'Week 22', title: 'A roll of film a week', notes: 'Picked up the old Pentax. Learning to see light again.', status: 'plan' },
  ],
  progressPct: 64,
};

export function SpacePage({
  content = DEFAULT_CONTENT,
  mood = 'lavender',
  isOwner = false,
  username = 'laki',
  reactions = [],
  onOpenSettings,
  onOpenShare,
  onSave,
}: SpacePageProps) {
  const [mode, setMode] = useState<'editing' | 'preview'>('editing');
  const [goals, setGoals] = useState(content.goals);
  const [rxOpen, setRxOpen] = useState(false);
  const [rxPublic, setRxPublic] = useState(false);
  const [credits] = useState(14);

  const p = SPACE_PALETTES[mood];

  function toggleGoal(id: string) {
    if (mode !== 'editing') return;
    setGoals(g => g.map(gl => gl.id === id ? { ...gl, done: !gl.done } : gl));
  }

  const creditClass = credits === 0 ? 'zero' : credits < 5 ? 'low' : '';
  const periodLabel = { done: 'Done', prog: 'In progress', plan: 'Planned' } as const;
  const periodCls   = { done: 'done', prog: 'prog', plan: 'plan' } as const;

  return (
    <>
      {/* owner credit pill */}
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
            textDecoration: 'none', whiteSpace: 'nowrap', transition: 'var(--t-fast)',
          }}
          className={`owner-credit ${creditClass}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
          </svg>
          {credits === 0 ? 'Buy credits' : `${credits} credits`}
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
          {/* segmented edit/preview */}
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
          <button
            onClick={onOpenShare}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--app-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--t-fast)' }}
            title="Share"
          >
            <Share2 size={19} />
          </button>
          <button
            onClick={onOpenSettings}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--app-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--t-fast)' }}
            title="Settings"
          >
            <Settings size={19} />
          </button>
        </div>
      )}

      {/* space */}
      <div className={`space ${mode === 'editing' && isOwner ? 'editing' : ''}`}>
        <Fireflies color={`${p.glow.replace(')', ', 0.9)').replace('rgba', 'rgba')}`} count={22} className="space-fireflies" />

        <div className="space-wrap">
          <header className="sp-header">
            <div className="sp-head-left">
              <div className="sp-brand">
                <div className="sp-monogram">{content.monogram ?? content.title.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="sp-wordmark">{content.title.toUpperCase()}</div>
                  <div className="sp-live"><span className="dot" /> updated this morning</div>
                </div>
              </div>
              <h1
                className="sp-title"
                data-edit="title"
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                {content.title}
              </h1>
              <p
                className="sp-subtitle"
                data-edit="subtitle"
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                {content.subtitle}
              </p>
            </div>
            <div className="sp-ring-wrap" title={`${content.progressPct}% goals this season`}>
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle className="sp-ring-track" cx="48" cy="48" r="39" />
                <circle
                  className="sp-ring-fill" cx="48" cy="48" r="39"
                  style={{ strokeDashoffset: 245 - (245 * (content.progressPct ?? 64) / 100) }}
                />
              </svg>
              <div className="sp-ring-center">
                <div className="sp-ring-pct">{content.progressPct ?? 64}%</div>
                <div className="sp-ring-sub">season</div>
              </div>
            </div>
          </header>

          {/* goals */}
          <div className="sp-section-label">What I'm working toward</div>
          <div className="sp-goals">
            {goals.map(g => (
              <span
                key={g.id}
                className={`sp-goal${g.done ? ' done' : ''}`}
                data-edit="goal"
                onClick={() => toggleGoal(g.id)}
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                <span className="check">{g.done && '✓'}</span>
                {g.text}
              </span>
            ))}
            {isOwner && mode === 'editing' && (
              <button className="sp-goal-add" onClick={() => setGoals(g => [...g, { id: Date.now().toString(), text: 'New goal', done: false }])}>
                + add goal
              </button>
            )}
          </div>

          {content.currently && (
            <div style={{ marginTop: 16 }}>
              <span
                className="sp-currently"
                data-edit="currently"
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                <span className="now" />
                {content.currently}
              </span>
            </div>
          )}

          {/* mid grid */}
          <div className="sp-mid">
            <div className="sp-hero">
              <div className="sp-hero-period">This week · focus</div>
              <div
                className="sp-hero-title"
                data-edit="hero-title"
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                {content.heroTitle}
              </div>
              <p
                className="sp-hero-notes"
                data-edit="hero-notes"
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                {content.heroNotes}
              </p>
              <div className="sp-hero-foot">
                <span>1,840 / 2,500 words</span>
                <span className="sp-hero-bar"><i /></span>
              </div>
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
                contentEditable={isOwner && mode === 'editing' ? true : undefined}
                suppressContentEditableWarning
              >
                {content.notepad?.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          </div>

          {/* period cards */}
          {content.periods && content.periods.length > 0 && (
            <>
              <div className="sp-section-label">The season so far</div>
              <div className="sp-periods">
                {content.periods.map((pd, i) => (
                  <div key={i} className="sp-period">
                    <div className="wk">{pd.week}</div>
                    <div
                      className="ti"
                      data-edit="period-title"
                      contentEditable={isOwner && mode === 'editing' ? true : undefined}
                      suppressContentEditableWarning
                    >
                      {pd.title}
                    </div>
                    <div
                      className="no"
                      data-edit="period-notes"
                      contentEditable={isOwner && mode === 'editing' ? true : undefined}
                      suppressContentEditableWarning
                    >
                      {pd.notes}
                    </div>
                    <span className={`tag ${periodCls[pd.status]}`}>{periodLabel[pd.status]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* reactions panel (owner only) */}
      {isOwner && (mode === 'editing') && (
        <div style={{ maxWidth: 940, margin: '24px auto 0', padding: '0 clamp(18px,4vw,36px)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.62)', border: '1.5px solid var(--sp-border)',
            borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(4px)',
          }}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', cursor: 'pointer' }}
              onClick={() => setRxOpen(o => !o)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(244,168,152,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d98b76' }}>
                  <Heart size={15} />
                </span>
                <div>
                  <div>3 people visited your space this week</div>
                  <div style={{ fontSize: 12, color: 'var(--app-text-muted)', fontWeight: 600 }}>
                    {reactions.length > 0 ? `${reactions.length} note${reactions.length > 1 ? 's' : ''} · tap to view` : 'No notes yet'}
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
