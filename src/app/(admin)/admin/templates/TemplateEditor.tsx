'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { SpecRenderer } from '@/components/space/engine/SpecRenderer';
import type { TemplateSpec } from '@/components/space/engine/types';
import { BASE_TEMPLATE_SPECS } from '@/components/space/engine/utils';
import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';
import type { SpaceContent } from '@/components/space/SpacePage';

interface TemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  spec: TemplateSpec;
  preview_mood: SpaceMood;
  tags: string[];
  mood_affinity: string[];
  vibe_keywords: string[];
  is_active: boolean;
  is_featured: boolean;
}

interface Props {
  initialTemplates: TemplateRow[];
}

const PREVIEW_CONTENT: SpaceContent = {
  title: "Laki's World",
  subtitle: 'A focused little world for weekly goals, thoughts, and momentum.',
  monogram: 'LW',
  goals: [
    { id: '1', text: 'Ship the template engine', done: true },
    { id: '2', text: 'Plan the next launch', done: false },
    { id: '3', text: 'Write every Friday', done: false },
  ],
  currently: 'Currently building in public',
  heroTitle: 'Make the space feel personal and alive',
  heroNotes: 'Keep the controls simple, the renderer trusted, and the visual system flexible.',
  notepad: 'A spec should describe atmosphere and structure, never arbitrary code.',
  periods: [
    { week: 'W1', title: 'Core renderer', notes: 'Specs, registries, and content editing.', status: 'done' },
    { week: 'W2', title: 'Admin flow', notes: 'Create and preview templates.', status: 'prog' },
    { week: 'W3', title: 'Catalog', notes: 'Let users choose a base world.', status: 'plan' },
  ],
};

function draftTemplate(): TemplateRow {
  return {
    id: '',
    slug: 'new-template',
    name: 'New Template',
    description: '',
    spec: BASE_TEMPLATE_SPECS.garden,
    preview_mood: 'lavender',
    tags: [],
    mood_affinity: [],
    vibe_keywords: [],
    is_active: true,
    is_featured: false,
  };
}

export function TemplateEditor({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? 'draft');
  const selected = templates.find(t => t.id === selectedId) ?? templates[0] ?? draftTemplate();
  const [draft, setDraft] = useState<TemplateRow>(selected);
  const [specInput, setSpecInput] = useState(JSON.stringify(selected.spec, null, 2));
  const [status, setStatus] = useState('');

  function selectTemplate(template: TemplateRow) {
    setSelectedId(template.id || 'draft');
    setDraft(template);
    setSpecInput(JSON.stringify(template.spec, null, 2));
    setStatus('');
  }

  useEffect(() => {
    setSpecInput(JSON.stringify(draft.spec, null, 2));
  }, [draft.id]);

  async function save() {
    setStatus('Saving...');
    const method = draft.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/templates', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error ?? 'Save failed');
      return;
    }
    setStatus('Saved');
    const saved = json.template as TemplateRow;
    setTemplates(prev => draft.id ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
    setSelectedId(saved.id);
    setDraft(saved);
  }

  async function remove() {
    if (!draft.id) return;
    setStatus('Deleting...');
    const res = await fetch(`/api/admin/templates?id=${draft.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      setStatus(json.error ?? 'Delete failed');
      return;
    }
    const next = templates.filter(t => t.id !== draft.id);
    setTemplates(next);
    selectTemplate(next[0] ?? draftTemplate());
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(360px, 1fr) minmax(360px, 0.9fr)', gap: 18, padding: '28px clamp(20px,3vw,40px) 60px', alignItems: 'start' }}>
      <aside style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--app-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Templates</strong>
          <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px' }} onClick={() => selectTemplate(draftTemplate())}><Plus size={14} /> New</button>
        </div>
        {templates.map(template => (
          <button key={template.id} onClick={() => selectTemplate(template)} style={{ width: '100%', textAlign: 'left', border: 0, background: selectedId === template.id ? 'var(--app-accent-soft)' : '#fff', borderBottom: '1px solid var(--app-border)', padding: 14, cursor: 'pointer' }}>
            <div style={{ fontWeight: 800 }}>{template.name}</div>
            <div style={{ fontSize: 12, color: 'var(--app-text-2)', marginTop: 3 }}>{template.slug}</div>
          </button>
        ))}
      </aside>

      <section style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 8, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Template Editor</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {draft.id && <button className="btn btn-secondary" onClick={remove}><Trash2 size={15} /> Delete</button>}
            <button className="btn btn-primary" onClick={save}><Save size={15} /> Save</button>
          </div>
        </div>
        {status && <div style={{ fontSize: 13, color: 'var(--app-text-2)', marginBottom: 12 }}>{status}</div>}
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Name<input className="input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Slug<input className="input" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} /></label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Description<input className="input" value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Preview mood
            <select className="input" value={draft.preview_mood} onChange={e => setDraft(d => ({ ...d, preview_mood: e.target.value as SpaceMood }))}>
              {Object.keys(SPACE_PALETTES).map(mood => <option key={mood} value={mood}>{mood}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 700 }}><input type="checkbox" checked={draft.is_active} onChange={e => setDraft(d => ({ ...d, is_active: e.target.checked }))} /> Active</label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 700 }}><input type="checkbox" checked={draft.is_featured} onChange={e => setDraft(d => ({ ...d, is_featured: e.target.checked }))} /> Featured</label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Spec JSON
            <textarea
              className="input"
              value={specInput}
              onChange={e => {
                setSpecInput(e.target.value);
                try {
                  setDraft(d => ({ ...d, spec: JSON.parse(e.target.value) }));
                  setStatus('');
                } catch {
                  setStatus('Spec JSON is invalid');
                }
              }}
              style={{ minHeight: 360, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.5 }}
            />
          </label>
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--app-border)', fontSize: 13, fontWeight: 800 }}>Live Preview</div>
        <div style={{ height: 720, overflow: 'auto' }}>
          <SpecRenderer
            content={PREVIEW_CONTENT}
            tokens={{ mood: draft.preview_mood, layout_variant: 'rich', animation_level: 'subtle', template_id: draft.slug, palette: SPACE_PALETTES[draft.preview_mood] }}
            spec={draft.spec}
            isOwner={false}
            mode="preview"
            onUpdate={() => undefined}
            onSave={async () => undefined}
          />
        </div>
      </section>
    </div>
  );
}
