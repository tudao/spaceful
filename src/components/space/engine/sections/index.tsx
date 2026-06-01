'use client';

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Image as ImageIcon, PenLine, Quote } from 'lucide-react';
import type { SectionId, SectionProps } from '../types';

function GoalsSection({ content, editing, toggleGoal, updateGoalText, addGoal, styles }: SectionProps) {
  return (
    <section>
      <div style={styles.label}>What I&apos;m working toward</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {content.goals.map(g => (
          <span
            key={g.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 38, padding: '7px 15px',
              borderRadius: 999, border: `1px solid ${g.done ? 'var(--sp-accent)' : styles.border}`,
              background: g.done ? 'var(--sp-done-bg)' : 'var(--sp-chip-bg)', color: g.done ? 'var(--sp-accent)' : 'var(--sp-text2)',
              fontSize: 14, fontWeight: 700,
            }}
          >
            <button
              type="button"
              onClick={() => toggleGoal(g.id)}
              disabled={!editing}
              style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${g.done ? 'var(--sp-accent)' : 'var(--sp-muted)'}`, background: g.done ? 'var(--sp-accent)' : 'transparent', flexShrink: 0, cursor: editing ? 'pointer' : 'default', padding: 0 }}
            >
              {g.done && <Check size={10} color="#fff" strokeWidth={3} />}
            </button>
            <span
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => updateGoalText(g.id, e.currentTarget.innerText.trim())}
              style={{ outline: 'none', cursor: editing ? 'text' : 'default' }}
            >
              {g.text}
            </span>
          </span>
        ))}
        {editing && content.goals.length < 7 && (
          <button type="button" onClick={addGoal} style={{ minHeight: 38, padding: '0 15px', borderRadius: 999, border: `1px dashed ${styles.border}`, background: 'transparent', color: styles.muted, fontWeight: 800, cursor: 'pointer' }}>
            + add goal
          </button>
        )}
      </div>
    </section>
  );
}

function CurrentlySection({ content, tokens, editing, onUpdate, styles }: SectionProps) {
  return (
    <section>
      <span
        contentEditable={editing || undefined}
        suppressContentEditableWarning
        onBlur={e => onUpdate({ currently: e.currentTarget.innerText.trim() })}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 40, padding: '8px 17px', borderRadius: 999, background: 'var(--sp-chip-bg)', border: `1px solid ${styles.border}`, color: 'var(--sp-text2)', fontSize: 14, fontWeight: 700, outline: 'none' }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sp-accent2)', boxShadow: '0 0 12px var(--sp-accent2)', flexShrink: 0 }} />
        {content.currently || (editing ? tokens.currently_placeholder || 'Currently...' : '')}
      </span>
    </section>
  );
}

function FocusHeroSection({ content, tokens, editing, onUpdate, styles, nudgeDay }: SectionProps) {
  const titlePlaceholder =
    nudgeDay === 'monday'         ? 'New week — what matters most?' :
    nudgeDay === 'friday'         ? 'What was this week\'s big win?' :
    nudgeDay === 'sunday-evening' ? 'Week wrapping up — set an intention?' :
                                    tokens.hero_title_placeholder || 'What are you focused on this week?';
  const notesPlaceholder =
    nudgeDay === 'friday' ? 'Reflect on the week...' : 'Add some context...';
  const nudgeRing = nudgeDay === 'monday' && !content.heroTitle && editing;
  return (
    <section style={{ ...styles.card, padding: '22px 24px', position: 'relative', overflow: 'hidden', ...(nudgeRing ? { outline: `2px solid var(--sp-accent)`, outlineOffset: 1 } : {}) }}>
      <div style={{ position: 'absolute', right: -50, top: -50, width: 170, height: 170, borderRadius: '50%', background: 'radial-gradient(circle, var(--sp-glow), transparent 68%)' }} />
      <div style={styles.label}>This week / focus</div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div
          contentEditable={editing || undefined}
          suppressContentEditableWarning
          onBlur={e => onUpdate({ heroTitle: e.currentTarget.innerText.trim() })}
          style={{ fontSize: 22, lineHeight: 1.28, fontWeight: 800, color: 'var(--sp-text)', outline: 'none', minHeight: editing ? '1.28em' : 0 }}
        >
          {content.heroTitle}
        </div>
        {editing && !content.heroTitle && (
          <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 22, lineHeight: 1.28, fontWeight: 800, color: styles.muted, pointerEvents: 'none', userSelect: 'none' }}>
            {titlePlaceholder}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <p
          contentEditable={editing || undefined}
          suppressContentEditableWarning
          onBlur={e => onUpdate({ heroNotes: e.currentTarget.innerText.trim() })}
          style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: 'var(--sp-text2)', minHeight: editing ? 58 : 0, outline: 'none' }}
        >
          {content.heroNotes}
        </p>
        {editing && !content.heroNotes && (
          <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 14, lineHeight: 1.85, color: styles.muted, pointerEvents: 'none', userSelect: 'none' }}>
            {notesPlaceholder}
          </span>
        )}
      </div>
    </section>
  );
}

function NotepadSection({ content, tokens, editing, onUpdate, styles }: SectionProps) {
  const [tab, setTab] = useState<'free' | 'checklist' | 'bullets'>('free');
  const bullets = (content.notepad || '').split('\n').filter(Boolean).slice(0, 6);
  return (
    <section style={{ ...styles.card, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 18px', borderBottom: `1px solid ${styles.border}` }}>
        <span style={{ ...styles.label, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7 }}><PenLine size={14} /> Notepad</span>
        <div style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 999, background: 'var(--sp-chip-bg)', border: `1px solid ${styles.border}` }}>
          {(['free', 'checklist', 'bullets'] as const).map(nextTab => (
            <button key={nextTab} type="button" onClick={() => setTab(nextTab)} style={{ border: 0, borderRadius: 999, padding: '5px 10px', background: tab === nextTab ? 'var(--sp-accent)' : 'transparent', color: tab === nextTab ? '#fff' : 'var(--sp-text2)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              {nextTab}
            </button>
          ))}
        </div>
      </div>
      {tab === 'free' && (
        <div
          contentEditable={editing || undefined}
          suppressContentEditableWarning
          onBlur={e => onUpdate({ notepad: e.currentTarget.innerText.trim() })}
          style={{ padding: '16px 18px', fontSize: 14, lineHeight: 1.9, color: 'var(--sp-text2)', minHeight: 154, outline: 'none' }}
        >
          {content.notepad || (editing ? tokens.notepad_starter || 'Write something...' : '')}
        </div>
      )}
      {tab === 'checklist' && (
        <div style={{ padding: '12px 18px 16px', minHeight: 154 }}>
          {content.goals.slice(0, 5).map(goal => (
            <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${styles.border}` }}>
              <span style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${goal.done ? 'var(--sp-accent)' : styles.border}`, background: goal.done ? 'var(--sp-accent)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{goal.done && <Check size={11} color="#fff" />}</span>
              <span style={{ color: 'var(--sp-text2)', fontSize: 13, lineHeight: 1.5 }}>{goal.text}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'bullets' && (
        <div style={{ padding: '14px 18px 16px', minHeight: 154 }}>
          {(bullets.length ? bullets : ['Capture an idea', 'Name the next action', 'Keep one useful note']).map((bullet, index) => (
            <div key={`${bullet}-${index}`} style={{ display: 'flex', gap: 10, padding: '8px 0', color: 'var(--sp-text2)', fontSize: 13, lineHeight: 1.6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sp-accent2)', marginTop: 8, flexShrink: 0 }} />
              {bullet}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function isoWeek(d: Date): number {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfW1 = new Date(jan4);
  startOfW1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  return Math.floor((d.getTime() - startOfW1.getTime()) / 604800000) + 1;
}

function KanbanSection({ content, editing, onUpdate, styles }: SectionProps) {
  const periods = content.periods?.length ? content.periods : [
    { week: 'W1', title: content.heroTitle || 'Plan the next move', notes: content.heroNotes || 'Set a direction and keep it visible.', status: 'prog' as const },
    { week: 'W2', title: 'Build momentum', notes: 'Protect the main habit.', status: 'plan' as const },
    { week: 'W3', title: 'Review and adjust', notes: 'Keep what works, remove the rest.', status: 'blocked' as const },
    { week: 'W4', title: 'Launch the next version', notes: 'Show the work and collect feedback.', status: 'done' as const },
  ];
  const [page, setPage] = useState(() => {
    const week = isoWeek(new Date());
    const idx = periods.findIndex(p => p.week === `W${week}`);
    return idx === -1 ? 0 : Math.max(0, idx - 1);
  });
  const label = { done: 'Done', prog: 'In progress', plan: 'Planned', blocked: 'Blocked' } as const;
  const statuses = ['plan', 'prog', 'blocked', 'done'] as const;
  const visible = periods.slice(page, page + 3);

  function addPeriod() {
    const next = [...periods, { week: `W${periods.length + 1}`, title: 'New focus', notes: '', status: 'plan' as const }];
    onUpdate({ periods: next });
    setPage(Math.max(0, next.length - 3));
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ ...styles.label, margin: 0 }}>The season so far</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {editing && periods.length < 52 && (
            <button type="button" onClick={addPeriod} style={{ ...navButtonStyle(false), fontSize: 18, fontWeight: 300, paddingBottom: 1 }}>+</button>
          )}
          <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={navButtonStyle(page === 0)}><ChevronLeft size={15} /></button>
          <button type="button" disabled={page >= Math.max(0, periods.length - 3)} onClick={() => setPage(p => Math.min(Math.max(0, periods.length - 3), p + 1))} style={navButtonStyle(page >= Math.max(0, periods.length - 3))}><ChevronRight size={15} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {visible.map((period, index) => {
          const realIndex = page + index;
          return (
          <article key={`${period.week}-${realIndex}`} style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ height: 4, background: statusGradient(period.status) }} />
            <div style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: styles.muted, marginBottom: 10 }}>{period.week}</div>
            <div
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => onUpdate({ periods: periods.map((p, i) => i === realIndex ? { ...p, title: e.currentTarget.innerText.trim() } : p) })}
              style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.35, color: 'var(--sp-text)', outline: 'none' }}
            >
              {period.title}
            </div>
            <p
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => onUpdate({ periods: periods.map((p, i) => i === realIndex ? { ...p, notes: e.currentTarget.innerText.trim() } : p) })}
              style={{ minHeight: 58, fontSize: 13, lineHeight: 1.65, color: 'var(--sp-text2)', outline: 'none', margin: '8px 0 14px' }}
            >
              {period.notes}
            </p>
            <button
              type="button"
              disabled={!editing}
              onClick={() => {
                const current = statuses.indexOf(period.status);
                const nextPeriods = periods.map((p, i) => i === realIndex ? { ...p, status: statuses[(current + 1) % statuses.length] } : p);
                onUpdate({ periods: nextPeriods });
              }}
              style={{ border: `1px solid ${styles.border}`, borderRadius: 999, padding: '6px 11px', background: statusBg(period.status), color: statusColor(period.status), fontSize: 12, fontWeight: 800, cursor: editing ? 'pointer' : 'default' }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusColor(period.status), marginRight: 7 }} />
              {label[period.status]}
            </button>
            </div>
          </article>
        );})}
      </div>
    </section>
  );
}

function navButtonStyle(disabled: boolean): CSSProperties {
  return { width: 34, height: 34, borderRadius: 999, border: '1px solid var(--sp-border)', background: 'var(--sp-chip-bg)', color: 'var(--sp-text2)', display: 'grid', placeItems: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1 };
}

function statusColor(status: 'done' | 'prog' | 'plan' | 'blocked') {
  return status === 'done' ? '#3D7A58' : status === 'prog' ? 'var(--sp-accent)' : status === 'blocked' ? '#B4533F' : 'var(--sp-text2)';
}

function statusBg(status: 'done' | 'prog' | 'plan' | 'blocked') {
  return status === 'done' ? 'rgba(91,171,124,0.16)' : status === 'prog' ? 'var(--sp-done-bg)' : status === 'blocked' ? 'rgba(244,168,154,0.18)' : 'var(--sp-chip-bg)';
}

function statusGradient(status: 'done' | 'prog' | 'plan' | 'blocked') {
  return status === 'done' ? 'linear-gradient(90deg,#A8C5A0,#5BAB7C)' : status === 'prog' ? 'linear-gradient(90deg,var(--sp-accent2),var(--sp-accent))' : status === 'blocked' ? 'linear-gradient(90deg,#F9D6B0,#F4A89A)' : 'linear-gradient(90deg,rgba(255,255,255,.2),var(--sp-border))';
}

function StreakSection({ content, styles }: SectionProps) {
  const complete = content.goals.filter(g => g.done).length;
  return (
    <section style={{ ...styles.card, padding: 20 }}>
      <div style={styles.label}>Streak</div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
        <strong style={{ fontSize: 42, lineHeight: 1, color: 'var(--sp-text)' }}>{Math.max(complete, 1)}</strong>
        <span style={{ color: 'var(--sp-text2)', fontWeight: 800, paddingBottom: 5 }}>focused day{complete === 1 ? '' : 's'}</span>
      </div>
    </section>
  );
}

const HABIT_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function HabitSection({ content, editing, onUpdate, styles }: SectionProps) {
  // HABIT_DAYS starts Monday=0; JS getDay() is Sun=0 Mon=1…Sat=6
  const todayIndex = (new Date().getDay() + 6) % 7;
  const habits = content.habits?.length ? content.habits : [
    { id: 'h1', label: 'Deep work', days: [true, true, false, true, false, true, false] },
    { id: 'h2', label: 'Journal', days: [false, true, true, true, false, false, true] },
    { id: 'h3', label: 'Move', days: [true, false, true, false, true, true, false] },
  ];

  function toggle(habitIndex: number, dayIndex: number) {
    onUpdate({ habits: habits.map((h, i) => i === habitIndex ? { ...h, days: h.days.map((d, di) => di === dayIndex ? !d : d) } : h) });
  }

  function addHabit() {
    onUpdate({ habits: [...habits, { id: Date.now().toString(), label: 'New habit', days: Array(7).fill(false) as boolean[] }] });
  }

  const colTemplate = 'minmax(90px, 1fr) repeat(7, 28px)';

  return (
    <section style={{ ...styles.card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={styles.label}>Habit tracker</div>
        {editing && habits.length < 8 && (
          <button type="button" onClick={addHabit} style={{ border: `1px dashed ${styles.border}`, borderRadius: 999, padding: '4px 10px', background: 'transparent', color: styles.muted, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ add</button>
        )}
      </div>
      {/* day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 6, marginBottom: 6, alignItems: 'center' }}>
        <div />
        {HABIT_DAYS.map((d, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 900, textAlign: 'center', color: i === todayIndex ? 'var(--sp-accent)' : styles.muted }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {habits.map((habit, habitIndex) => (
          <div key={habit.id} style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 6, alignItems: 'center' }}>
            <div
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              onBlur={e => onUpdate({ habits: habits.map((h, i) => i === habitIndex ? { ...h, label: e.currentTarget.innerText.trim() } : h) })}
              style={{ fontSize: 13, fontWeight: 800, color: 'var(--sp-text2)', outline: 'none' }}
            >{habit.label}</div>
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const done = habit.days[dayIndex] ?? false;
              return (
                <button
                  key={dayIndex}
                  type="button"
                  disabled={!editing}
                  onClick={() => toggle(habitIndex, dayIndex)}
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${done ? 'var(--sp-accent)' : dayIndex === todayIndex ? 'var(--sp-accent)' : styles.border}`, background: done ? 'var(--sp-accent)' : 'var(--sp-chip-bg)', cursor: editing ? 'pointer' : 'default', transition: 'background 0.15s, border-color 0.15s', boxShadow: done ? `0 0 10px var(--sp-glow)` : dayIndex === todayIndex ? `0 0 6px var(--sp-glow)` : 'none', opacity: dayIndex === todayIndex && !done ? 1 : undefined }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

const READING_STATUSES = ['reading', 'queued', 'done'] as const;
const READING_STATUS_LABEL = { reading: 'Reading', queued: 'Queued', done: 'Done' } as const;

function ReadingListSection({ content, editing, onUpdate, styles }: SectionProps) {
  const items = content.readingList?.length ? content.readingList : [
    { id: 'r1', title: 'The current obsession', meta: 'Article / reference', status: 'reading' as const },
    { id: 'r2', title: 'Design notes', meta: 'Queued for later', status: 'queued' as const },
    { id: 'r3', title: 'Launch checklist', meta: 'Done', status: 'done' as const },
  ];

  function cycleStatus(index: number) {
    if (!editing) return;
    const cur = READING_STATUSES.indexOf(items[index].status ?? 'queued');
    const next = READING_STATUSES[(cur + 1) % READING_STATUSES.length];
    onUpdate({ readingList: items.map((r, i) => i === index ? { ...r, status: next } : r) });
  }

  function addItem() {
    onUpdate({ readingList: [...items, { id: Date.now().toString(), title: 'New title', meta: '', status: 'queued' as const }] });
  }

  return (
    <section style={{ ...styles.card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ ...styles.label, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7 }}><BookOpen size={14} /> Reading list</div>
        {editing && items.length < 10 && (
          <button type="button" onClick={addItem} style={{ border: `1px dashed ${styles.border}`, borderRadius: 999, padding: '4px 10px', background: 'transparent', color: styles.muted, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ add</button>
        )}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item, index) => (
          <article key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: item.status === 'reading' ? 'var(--sp-done-bg)' : 'var(--sp-chip-bg)', border: `1px solid ${item.status === 'reading' ? 'var(--sp-accent)' : styles.border}`, transition: 'background 0.2s, border-color 0.2s' }}>
            <div style={{ width: 36, height: 48, borderRadius: 6, background: item.status === 'done' ? `linear-gradient(135deg,rgba(91,171,124,0.4),rgba(61,122,88,0.5))` : `linear-gradient(135deg,var(--sp-accent2),var(--sp-accent))`, flexShrink: 0, opacity: item.status === 'done' ? 0.6 : 1 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div contentEditable={editing || undefined} suppressContentEditableWarning onBlur={e => onUpdate({ readingList: items.map((r, i) => i === index ? { ...r, title: e.currentTarget.innerText.trim() } : r) })} style={{ fontSize: 14, fontWeight: 900, color: 'var(--sp-text)', outline: 'none', textDecoration: item.status === 'done' ? 'line-through' : 'none', opacity: item.status === 'done' ? 0.55 : 1 }}>{item.title}</div>
              <div contentEditable={editing || undefined} suppressContentEditableWarning onBlur={e => onUpdate({ readingList: items.map((r, i) => i === index ? { ...r, meta: e.currentTarget.innerText.trim() } : r) })} style={{ fontSize: 12, color: styles.muted, marginTop: 3, outline: 'none' }}>{item.meta}</div>
            </div>
            <button
              type="button"
              disabled={!editing}
              onClick={() => cycleStatus(index)}
              title={editing ? 'Click to change status' : undefined}
              style={{ borderRadius: 999, padding: '5px 9px', background: item.status === 'reading' ? 'var(--sp-accent)' : 'transparent', border: `1px solid ${item.status === 'reading' ? 'var(--sp-accent)' : styles.border}`, color: item.status === 'reading' ? '#fff' : styles.muted, fontSize: 11, fontWeight: 900, cursor: editing ? 'pointer' : 'default', flexShrink: 0 }}
            >
              {READING_STATUS_LABEL[item.status ?? 'queued']}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuoteSection({ content, editing, onUpdate, styles }: SectionProps) {
  const quote = content.quote ?? { text: 'Make the next small thing beautiful enough to keep going.', attribution: 'Spaceful' };
  return (
    <section style={{ ...styles.card, padding: 22, position: 'relative', overflow: 'hidden' }}>
      <Quote size={52} style={{ position: 'absolute', right: 18, top: 14, color: 'var(--sp-accent)', opacity: 0.12 }} />
      <div contentEditable={editing || undefined} suppressContentEditableWarning onBlur={e => onUpdate({ quote: { ...quote, text: e.currentTarget.innerText.trim() } })} style={{ fontSize: 22, lineHeight: 1.45, fontWeight: 800, color: 'var(--sp-text)', outline: 'none', maxWidth: 680 }}>{quote.text}</div>
      <div contentEditable={editing || undefined} suppressContentEditableWarning onBlur={e => onUpdate({ quote: { ...quote, attribution: e.currentTarget.innerText.trim() } })} style={{ color: styles.muted, fontSize: 13, fontWeight: 800, marginTop: 12, outline: 'none' }}>{quote.attribution}</div>
    </section>
  );
}

function PhotoSection({ content, editing, onUpdate, styles }: SectionProps) {
  const photo = content.photo ?? { url: '', caption: 'A visual anchor for this season.' };
  return (
    <section style={{ ...styles.card, overflow: 'hidden' }}>
      <div style={{ minHeight: 220, position: 'relative', display: 'grid', placeItems: 'center', background: photo.url ? `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.08)), url(${photo.url}) center/cover` : 'linear-gradient(135deg,var(--sp-chip-bg),var(--sp-done-bg))', color: 'var(--sp-accent)' }}>
        {!photo.url && !editing && <ImageIcon size={42} opacity={0.5} />}
        {!photo.url && editing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <ImageIcon size={32} opacity={0.4} />
            <input
              type="url"
              placeholder="Paste an image URL…"
              onBlur={e => { if (e.target.value.trim()) onUpdate({ photo: { ...photo, url: e.target.value.trim() } }); }}
              style={{ border: `1px solid ${styles.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, background: 'var(--sp-chip-bg)', color: 'var(--sp-text)', outline: 'none', width: 260, textAlign: 'center' }}
            />
          </div>
        )}
        {photo.url && editing && (
          <button
            type="button"
            onClick={() => onUpdate({ photo: { ...photo, url: '' } })}
            style={{ position: 'absolute', top: 10, right: 10, border: 0, borderRadius: 999, padding: '4px 10px', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            Remove
          </button>
        )}
      </div>
      <div contentEditable={editing || undefined} suppressContentEditableWarning onBlur={e => onUpdate({ photo: { ...photo, caption: e.currentTarget.innerText.trim() } })} style={{ padding: '13px 16px', color: 'var(--sp-text2)', fontSize: 13, fontWeight: 800, outline: 'none' }}>{photo.caption}</div>
    </section>
  );
}

function PlaceholderSection({ styles }: SectionProps) {
  return (
    <section style={{ ...styles.card, padding: 20, color: 'var(--sp-text2)', fontWeight: 700 }}>
      This section is ready for content.
    </section>
  );
}

function DailyPulseSection({ content: _content, editing: _editing, onUpdate, styles, spaceId, isOwner }: SectionProps) {
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');
  const [savedMorning, setSavedMorning] = useState(false);
  const [savedEvening, setSavedEvening] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  // Load today's saved entries on mount
  useEffect(() => {
    if (!spaceId || !isOwner) return;
    fetch(`/api/pulse?space_id=${spaceId}&limit=5`)
      .then(r => r.json())
      .then(d => {
        const todayEntries: { period: string; body: string }[] = (d.entries ?? []).filter((e: { entry_date: string }) => e.entry_date === today);
        const m = todayEntries.find(e => e.period === 'morning');
        const ev = todayEntries.find(e => e.period === 'evening');
        if (m) { setMorning(m.body); setSavedMorning(true); }
        if (ev) { setEvening(ev.body); setSavedEvening(true); }
      })
      .catch(() => {});
  }, [spaceId, isOwner, today]);

  async function save(period: 'morning' | 'evening', body: string) {
    if (!body.trim() || !spaceId) return;
    await fetch('/api/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ space_id: spaceId, period, body: body.trim(), entry_date: today }),
    });
    if (period === 'morning') setSavedMorning(true);
    else setSavedEvening(true);
    onUpdate({});
  }

  const textareaStyle = { width: '100%', boxSizing: 'border-box' as const, resize: 'none' as const, background: 'var(--sp-chip-bg)', border: `1px solid ${styles.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, lineHeight: 1.65, color: 'var(--sp-text)', outline: 'none', minHeight: 64, fontFamily: "'Nunito',sans-serif" };
  const savedBadge = { fontSize: 11, fontWeight: 700, color: styles.muted, marginLeft: 6 };

  return (
    <section style={{ ...styles.card, padding: '20px 22px' }}>
      <div style={{ ...styles.label, marginBottom: 14 }}>Daily pulse · <span style={{ fontWeight: 600, textTransform: 'none' as const, letterSpacing: 0 }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: styles.muted, marginBottom: 6, display: 'flex', alignItems: 'center' }}>
            ☀️ Morning intention
            {savedMorning && <span style={savedBadge}>· saved</span>}
          </div>
          <textarea
            value={morning}
            onChange={e => { setMorning(e.target.value); setSavedMorning(false); }}
            onBlur={() => save('morning', morning)}
            placeholder="What's your intention for today?"
            maxLength={280}
            style={textareaStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: styles.muted, marginBottom: 6, display: 'flex', alignItems: 'center' }}>
            🌙 Evening reflection
            {savedEvening && <span style={savedBadge}>· saved</span>}
          </div>
          <textarea
            value={evening}
            onChange={e => { setEvening(e.target.value); setSavedEvening(false); }}
            onBlur={() => save('evening', evening)}
            placeholder="One thing you're proud of today."
            maxLength={280}
            style={textareaStyle}
          />
        </div>
      </div>
    </section>
  );
}

export const SECTIONS: Record<SectionId, React.ComponentType<SectionProps>> = {
  goals: GoalsSection,
  currently: CurrentlySection,
  focus_hero: FocusHeroSection,
  notepad: NotepadSection,
  kanban: KanbanSection,
  reading_list: ReadingListSection,
  habit_tracker: HabitSection,
  streak: StreakSection,
  quote: QuoteSection,
  photo: PhotoSection,
  daily_pulse: DailyPulseSection,
};
