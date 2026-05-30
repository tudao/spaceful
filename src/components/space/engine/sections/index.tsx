import { Check, PenLine } from 'lucide-react';
import type { SectionId, SectionProps } from '../types';

function GoalsSection({ content, editing, toggleGoal, updateGoalText, addGoal, styles }: SectionProps) {
  return (
    <section>
      <div style={styles.label}>What I&apos;m working toward</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {content.goals.map(g => (
          <span
            key={g.id}
            onClick={() => toggleGoal(g.id)}
            contentEditable={editing || undefined}
            suppressContentEditableWarning
            onBlur={e => updateGoalText(g.id, e.currentTarget.innerText.trim())}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 38, padding: '7px 15px',
              borderRadius: 999, border: `1px solid ${g.done ? 'var(--sp-accent)' : styles.border}`,
              background: g.done ? 'var(--sp-done-bg)' : 'var(--sp-chip-bg)', color: g.done ? 'var(--sp-accent)' : 'var(--sp-text2)',
              fontSize: 14, fontWeight: 700, cursor: editing ? 'pointer' : 'default', outline: 'none',
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${g.done ? 'var(--sp-accent)' : 'var(--sp-muted)'}`, background: g.done ? 'var(--sp-accent)' : 'transparent', flexShrink: 0 }}>
              {g.done && <Check size={10} color="#fff" strokeWidth={3} />}
            </span>
            {g.text}
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

function FocusHeroSection({ content, tokens, editing, onUpdate, styles }: SectionProps) {
  return (
    <section style={{ ...styles.card, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -50, top: -50, width: 170, height: 170, borderRadius: '50%', background: 'radial-gradient(circle, var(--sp-glow), transparent 68%)' }} />
      <div style={styles.label}>This week / focus</div>
      <div
        contentEditable={editing || undefined}
        suppressContentEditableWarning
        onBlur={e => onUpdate({ heroTitle: e.currentTarget.innerText.trim() })}
        style={{ position: 'relative', fontSize: 22, lineHeight: 1.28, fontWeight: 800, marginBottom: 12, color: 'var(--sp-text)', outline: 'none' }}
      >
        {content.heroTitle || (editing ? tokens.hero_title_placeholder || 'What are you focused on this week?' : '')}
      </div>
      <p
        contentEditable={editing || undefined}
        suppressContentEditableWarning
        onBlur={e => onUpdate({ heroNotes: e.currentTarget.innerText.trim() })}
        style={{ position: 'relative', margin: 0, fontSize: 14, lineHeight: 1.85, color: 'var(--sp-text2)', minHeight: editing ? 58 : 0, outline: 'none' }}
      >
        {content.heroNotes || (editing ? 'Add some context...' : '')}
      </p>
    </section>
  );
}

function NotepadSection({ content, tokens, editing, onUpdate, styles }: SectionProps) {
  return (
    <section style={{ ...styles.card, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 18px', borderBottom: `1px solid ${styles.border}` }}>
        <span style={{ ...styles.label, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7 }}><PenLine size={14} /> Notepad</span>
        <span style={{ fontSize: 12, color: styles.muted, fontWeight: 700 }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <div
        contentEditable={editing || undefined}
        suppressContentEditableWarning
        onBlur={e => onUpdate({ notepad: e.currentTarget.innerText.trim() })}
        style={{ padding: '16px 18px', fontSize: 14, lineHeight: 1.9, color: 'var(--sp-text2)', minHeight: 126, outline: 'none' }}
      >
        {content.notepad || (editing ? tokens.notepad_starter || 'Write something...' : '')}
      </div>
    </section>
  );
}

function KanbanSection({ content, editing, onUpdate, styles }: SectionProps) {
  const periods = content.periods?.length ? content.periods : [
    { week: 'W1', title: content.heroTitle || 'Plan the next move', notes: content.heroNotes || 'Set a direction and keep it visible.', status: 'prog' as const },
    { week: 'W2', title: 'Build momentum', notes: 'Protect the main habit.', status: 'plan' as const },
    { week: 'W3', title: 'Review and adjust', notes: 'Keep what works, remove the rest.', status: 'plan' as const },
  ];
  const label = { done: 'Done', prog: 'In progress', plan: 'Planned' } as const;
  return (
    <section>
      <div style={styles.label}>The season so far</div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
        {periods.map((period, index) => (
          <article key={`${period.week}-${index}`} style={{ ...styles.card, minWidth: 220, padding: 18, scrollSnapAlign: 'start' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: styles.muted, marginBottom: 10 }}>{period.week}</div>
            <div contentEditable={editing || undefined} suppressContentEditableWarning style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, color: 'var(--sp-text)', outline: 'none' }}>{period.title}</div>
            <p contentEditable={editing || undefined} suppressContentEditableWarning style={{ minHeight: 44, fontSize: 13, lineHeight: 1.6, color: 'var(--sp-text2)', outline: 'none' }}>{period.notes}</p>
            <button
              type="button"
              disabled={!editing}
              onClick={() => {
                const statuses = ['plan', 'prog', 'done'] as const;
                const current = statuses.indexOf(period.status);
                const nextPeriods = periods.map((p, i) => i === index ? { ...p, status: statuses[(current + 1) % statuses.length] } : p);
                onUpdate({ periods: nextPeriods });
              }}
              style={{ border: 0, borderRadius: 999, padding: '6px 10px', background: 'var(--sp-done-bg)', color: 'var(--sp-accent)', fontSize: 12, fontWeight: 800, cursor: editing ? 'pointer' : 'default' }}
            >
              {label[period.status]}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
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

function PlaceholderSection({ styles }: SectionProps) {
  return (
    <section style={{ ...styles.card, padding: 20, color: 'var(--sp-text2)', fontWeight: 700 }}>
      This section is ready for content.
    </section>
  );
}

export const SECTIONS: Record<SectionId, React.ComponentType<SectionProps>> = {
  goals: GoalsSection,
  currently: CurrentlySection,
  focus_hero: FocusHeroSection,
  notepad: NotepadSection,
  kanban: KanbanSection,
  reading_list: PlaceholderSection,
  habit_tracker: StreakSection,
  streak: StreakSection,
  quote: PlaceholderSection,
  photo: PlaceholderSection,
};
