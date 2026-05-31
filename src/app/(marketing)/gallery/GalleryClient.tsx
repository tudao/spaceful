'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MiniSpace } from '@/components/space/MiniSpace';
import type { SpaceMood } from '@/lib/utils';

export interface GallerySpace {
  id: string;
  slug: string;
  display_name: string;
  username: string;
  mood: SpaceMood;
  vibes: string[];
  gallery_featured_at: string | null;
  remix_count: number;
}

const TAGS = ['all', 'calm', 'focused', 'creative', 'cozy', 'bold', 'dreamy', 'grounded'];

const MOOD_COLOR: Record<SpaceMood, string> = {
  lavender: '#8A64C8', sand: '#C9954A', forest: '#6FBF8E',
  ocean: '#3F8FC4', rose: '#C96A86', midnight: '#8E7CF0',
};

// Fallback mock data shown when gallery has no approved spaces yet
const MOCK_FEATURED: GallerySpace[] = [
  { id: '1', slug: 'laki', display_name: "Laki's World",  username: 'laki',  mood: 'lavender', vibes: ['dreamy'],   gallery_featured_at: '2024-01-01', remix_count: 12 },
  { id: '2', slug: 'arbor', display_name: 'Deep Green',   username: 'arbor', mood: 'forest',   vibes: ['grounded'], gallery_featured_at: '2024-01-01', remix_count: 5 },
  { id: '3', slug: 'vex', display_name: 'Night Shift',    username: 'vex',   mood: 'midnight', vibes: ['bold'],     gallery_featured_at: '2024-01-01', remix_count: 8 },
];

const MOCK_RECENT: GallerySpace[] = [
  { id: '4', slug: 'mira', display_name: 'Slow Mornings',   username: 'mira',  mood: 'sand',     vibes: ['cozy'],     gallery_featured_at: null, remix_count: 3 },
  { id: '5', slug: 'nina', display_name: "Nina's Notebook", username: 'nina',  mood: 'rose',     vibes: ['creative'], gallery_featured_at: null, remix_count: 7 },
  { id: '6', slug: 'koa',  display_name: 'Koa Drifts',      username: 'koa',   mood: 'ocean',    vibes: ['calm'],     gallery_featured_at: null, remix_count: 2 },
  { id: '7', slug: 'sol',  display_name: 'Quiet Hours',     username: 'sol',   mood: 'lavender', vibes: ['calm'],     gallery_featured_at: null, remix_count: 4 },
];

function GCard({ space, featured, onRemix, remixing }: {
  space: GallerySpace;
  featured?: boolean;
  onRemix?: (spaceId: string, templateId: string) => void;
  remixing?: boolean;
}) {
  return (
    <div style={{ borderRadius: 'var(--r-card)', overflow: 'hidden', border: '1px solid var(--app-border)', background: '#fff', boxShadow: 'var(--shadow-soft)', position: 'relative' }}>
      <Link href={`/${space.username}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: featured ? 220 : 160, position: 'relative' }}>
          <MiniSpace palette={space.mood} title={space.display_name} goals={space.vibes} style={{ height: '100%' }} />
          {space.gallery_featured_at && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, letterSpacing: '0.05em' }}>
              ⭐ FEATURED
            </div>
          )}
        </div>
        <div style={{ padding: '13px 15px 10px' }}>
          <div style={{ fontWeight: 800, fontSize: featured ? 18 : 15 }}>{space.display_name}</div>
          <div style={{ fontSize: 13, color: 'var(--app-text-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: MOOD_COLOR[space.mood] ?? '#999', flexShrink: 0 }} />
            @{space.username} · {space.vibes[0] ?? space.mood}
            {space.remix_count > 0 && <span style={{ marginLeft: 'auto', color: 'var(--app-text-muted)', fontSize: 11 }}>{space.remix_count} remixes</span>}
          </div>
        </div>
      </Link>
      {onRemix && (
        <div style={{ padding: '0 15px 13px' }}>
          <button
            onClick={() => onRemix(space.id, space.mood)}
            disabled={remixing}
            style={{
              width: '100%', padding: '8px', borderRadius: 8,
              border: '1.5px solid var(--app-border)', background: 'var(--app-surface)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--app-text-2)',
              transition: 'var(--t-fast)', opacity: remixing ? 0.5 : 1,
            }}
          >
            {remixing ? 'Remixing…' : '✦ Remix this layout'}
          </button>
        </div>
      )}
    </div>
  );
}

interface GalleryClientProps {
  featured: GallerySpace[];
  recent: GallerySpace[];
  isLoggedIn: boolean;
}

export function GalleryClient({ featured: dbFeatured, recent: dbRecent, isLoggedIn }: GalleryClientProps) {
  const [activeTag, setActiveTag] = useState('all');
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [remixMessage, setRemixMessage] = useState('');

  const featured = dbFeatured.length > 0 ? dbFeatured : MOCK_FEATURED;
  const recent   = dbRecent.length   > 0 ? dbRecent   : MOCK_RECENT;
  const isMock   = dbFeatured.length === 0 && dbRecent.length === 0;

  function matches(space: GallerySpace) {
    if (activeTag === 'all') return true;
    return space.vibes.includes(activeTag) || space.mood === activeTag;
  }

  async function handleRemix(spaceId: string, mood: string) {
    if (!isLoggedIn || isMock) { window.location.href = '/signup'; return; }
    setRemixingId(spaceId);
    try {
      const { remixSpace } = await import('./actions');
      const result = await remixSpace(spaceId);
      if (result?.error) {
        setRemixMessage(result.error);
      } else {
        setRemixMessage('Layout remixed! Check your space. ✦');
      }
    } catch {
      setRemixMessage('Something went wrong.');
    } finally {
      setRemixingId(null);
      setTimeout(() => setRemixMessage(''), 4000);
    }
    void mood;
  }

  const featuredFiltered = featured.filter(matches);
  const recentFiltered   = recent.filter(matches);

  return (
    <main className="page">
      <div className="page-head">
        <h1 className="t-h1">Explore spaces</h1>
      </div>

      {remixMessage && (
        <div style={{ padding: '12px 18px', borderRadius: 12, background: 'var(--app-accent-soft)', border: '1.5px solid var(--app-accent)', marginBottom: 20, fontSize: 14, fontWeight: 700, color: 'var(--app-accent-ink)' }}>
          {remixMessage}
        </div>
      )}

      {/* tag filters */}
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4, marginBottom: 32, scrollbarWidth: 'none' }}>
        {TAGS.map(t => (
          <button key={t} className={`chip${activeTag === t ? ' selected' : ''}`} style={{ flexShrink: 0, height: 36 }} onClick={() => setActiveTag(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* featured */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Featured</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 48 }}>
        {featuredFiltered.map(s => (
          <GCard key={s.id} space={s} featured onRemix={isLoggedIn ? handleRemix : undefined} remixing={remixingId === s.id} />
        ))}
        {featuredFiltered.length === 0 && <p style={{ color: 'var(--app-text-muted)', gridColumn: '1/-1' }}>No featured spaces match this tag yet.</p>}
      </div>

      {/* recently added */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 16 }}>Recently added</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
        {recentFiltered.map(s => (
          <GCard key={s.id} space={s} onRemix={isLoggedIn ? handleRemix : undefined} remixing={remixingId === s.id} />
        ))}
        {recentFiltered.length === 0 && <p style={{ color: 'var(--app-text-muted)', gridColumn: '1/-1' }}>No spaces match this tag yet.</p>}
      </div>

      {recentFiltered.length > 0 && (
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
