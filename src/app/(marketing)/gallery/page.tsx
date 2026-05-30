'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { MiniSpace } from '@/components/space/MiniSpace';
import type { SpaceMood } from '@/lib/utils';

const TAGS = ['all', 'calm', 'focused', 'creative', 'cozy', 'bold', 'dreamy', 'grounded'];

const MOOD_COLOR: Record<SpaceMood, string> = {
  lavender: '#8A64C8', sand: '#C9954A', forest: '#6FBF8E',
  ocean: '#3F8FC4', rose: '#C96A86', midnight: '#8E7CF0',
};

interface GalleryCard {
  palette: SpaceMood;
  name: string;
  who: string;
  tag: string;
  username: string;
}

const FEATURED: GalleryCard[] = [
  { palette: 'lavender', name: "Laki's World",  who: '@laki',  tag: 'dreamy',   username: 'laki' },
  { palette: 'forest',   name: 'Deep Green',    who: '@arbor', tag: 'grounded', username: 'arbor' },
  { palette: 'midnight', name: 'Night Shift',   who: '@vex',   tag: 'bold',     username: 'vex' },
];

const RECENT: GalleryCard[] = [
  { palette: 'sand',     name: 'Slow Mornings',      who: '@mira',  tag: 'cozy',     username: 'mira' },
  { palette: 'rose',     name: "Nina's Notebook",    who: '@nina',  tag: 'creative', username: 'nina' },
  { palette: 'ocean',    name: 'Koa Drifts',         who: '@koa',   tag: 'calm',     username: 'koa' },
  { palette: 'lavender', name: 'Quiet Hours',        who: '@sol',   tag: 'calm',     username: 'sol' },
  { palette: 'forest',   name: 'Trail Notes',        who: '@fern',  tag: 'grounded', username: 'fern' },
  { palette: 'rose',     name: 'Bloom Journal',      who: '@rosa',  tag: 'creative', username: 'rosa' },
  { palette: 'midnight', name: 'After Dark',         who: '@nyx',   tag: 'bold',     username: 'nyx' },
  { palette: 'ocean',    name: 'Tide Table',         who: '@wave',  tag: 'focused',  username: 'wave' },
];

function GCard({ s, featured }: { s: GalleryCard; featured?: boolean }) {
  return (
    <Link
      href={`/${s.username}`}
      data-tag={s.tag}
      style={{ borderRadius: 'var(--r-card)', overflow: 'hidden', border: '1px solid var(--app-border)', background: '#fff', boxShadow: 'var(--shadow-soft)', cursor: 'pointer', transition: 'var(--t)', display: 'block', textDecoration: 'none' }}
    >
      <div style={{ height: featured ? 220 : 160, position: 'relative' }}>
        <MiniSpace palette={s.palette} title={s.name} goals={['make', 'rest', 'focus']} style={{ height: '100%' }} />
      </div>
      <div style={{ padding: '13px 15px' }}>
        <div style={{ fontWeight: 800, fontSize: featured ? 19 : 16 }}>{s.name}</div>
        <div style={{ fontSize: 13, color: 'var(--app-text-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: MOOD_COLOR[s.palette], flexShrink: 0 }} />
          {s.who} · {s.tag}
        </div>
      </div>
    </Link>
  );
}

export default function GalleryPage() {
  const [activeTag, setActiveTag] = useState('all');

  function matches(card: GalleryCard) {
    return activeTag === 'all' || card.tag === activeTag;
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1 className="t-h1">Explore spaces</h1>
      </div>

      {/* tag filters */}
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4, marginBottom: 32, scrollbarWidth: 'none' }}>
        {TAGS.map(t => (
          <button
            key={t}
            className={`chip${activeTag === t ? ' selected' : ''}`}
            style={{ flexShrink: 0, height: 36 }}
            onClick={() => setActiveTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* featured */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Featured</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 48 }}>
        {FEATURED.filter(matches).map(s => <GCard key={s.name} s={s} featured />)}
        {FEATURED.filter(matches).length === 0 && (
          <p style={{ color: 'var(--app-text-muted)', gridColumn: '1/-1' }}>No featured spaces match this tag yet.</p>
        )}
      </div>

      {/* recently added */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Recently added</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
        {RECENT.filter(matches).map(s => <GCard key={s.name + s.who} s={s} />)}
        {RECENT.filter(matches).length === 0 && (
          <p style={{ color: 'var(--app-text-muted)', gridColumn: '1/-1' }}>No spaces match this tag yet.</p>
        )}
      </div>

      {RECENT.filter(matches).length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <button className="btn btn-secondary">Load more</button>
        </div>
      )}

      {/* footer CTA */}
      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 40, borderTop: '1px solid var(--app-border)' }}>
        <h3 style={{ fontSize: 22, marginBottom: 14 }}>Like what you see?</h3>
        <Link href="/signup" className="btn btn-primary btn-lg">Create your own →</Link>
      </div>
    </main>
  );
}
