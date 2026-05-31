'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { type SpaceContent, type SpacePalette } from '@/components/space/SpacePage';
import { OwnerChrome } from '@/components/space/OwnerChrome';
import { SettingsDrawer } from '@/components/space/SettingsDrawer';
import { SharePopover } from '@/components/space/SharePopover';
import { ReactionForm } from '@/components/space/ReactionForm';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { saveSpaceContent, saveCompanionArchetype, remixThisSpace } from './actions';
import { switchTemplate } from './switchTemplate';
import { SpecRenderer } from '@/components/space/engine/SpecRenderer';
import type { EngineTokens, TemplateSpec, TemplateSpecOverride } from '@/components/space/engine/types';
import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';
import { TabNav, type TabId } from '@/components/space/TabNav';
import { JournalTab } from '@/components/space/JournalTab';
import { CompanionTab } from '@/components/space/CompanionTab';
import { TimelineView } from '@/components/space/TimelineView';

interface SpaceRow {
  id: string;
  slug: string;
  display_name: string | null;
  design_tokens: Record<string, unknown> | null;
  content_json: Record<string, unknown> | null;
  visibility: string;
  reactions_enabled: boolean;
  companion_archetype?: string;
}

interface ReactionRow {
  id: string;
  message: string;
  created_at: string;
}

interface Props {
  username: string;
  isPrivate?: boolean;
  space?: SpaceRow;
  isOwner?: boolean;
  isLoggedIn?: boolean;
  reactions?: ReactionRow[];
  creditBalance?: number;
  templateSpec?: TemplateSpec | null;
}

// Reads ?tab= and ?view= from URL — must be in a component wrapped by Suspense (Next.js 15 requirement)
function TabReader({ onTab, onView }: { onTab: (t: TabId) => void; onView: (v: string) => void }) {
  const sp = useSearchParams();
  const tab  = (sp.get('tab')  ?? 'space') as TabId;
  const view = sp.get('view') ?? '';
  useEffect(() => { onTab(tab); },  [tab,  onTab]);
  useEffect(() => { onView(view); }, [view, onView]);
  return null;
}

function computeTimeState() {
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun, 1=Mon … 6=Sat
  const greeting =
    h < 5  ? 'Late night' :
    h < 12 ? 'Good morning' :
    h < 18 ? 'Good afternoon' :
    h < 23 ? 'Good evening' :
             'Late night';
  const animSpeed = (h >= 19 || h < 5) ? 0.65 : 1.0;
  const nudgeDay: 'monday' | 'friday' | 'sunday-evening' | null =
    day === 1            ? 'monday' :
    day === 5            ? 'friday' :
    day === 0 && h >= 20 ? 'sunday-evening' :
                           null;
  return { greeting, animSpeed, nudgeDay };
}

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function buildContent(space: SpaceRow): SpaceContent {
  const cj = (space.content_json ?? {}) as Record<string, unknown>;
  const title = (cj.title as string) || space.display_name || 'My Space';
  const goals = Array.isArray(cj.goals)
    ? (cj.goals as { id: string; text: string; done: boolean }[])
    : [];
  return {
    title,
    subtitle:   (cj.subtitle   as string) || '',
    monogram:   title.slice(0, 2).toUpperCase(),
    goals:      goals.length ? goals : [],
    currently:  (cj.currently  as string) || '',
    heroTitle:  (cj.hero_title as string) || '',
    heroNotes:  (cj.hero_notes as string) || '',
    notepad:    (cj.notepad    as string) || '',
    periods:    Array.isArray(cj.periods) ? (cj.periods as SpaceContent['periods']) : [],
    habits:     Array.isArray(cj.habits) ? (cj.habits as SpaceContent['habits']) : [],
    readingList: Array.isArray(cj.reading_list) ? (cj.reading_list as SpaceContent['readingList']) : [],
    quote:      typeof cj.quote === 'object' && cj.quote ? (cj.quote as SpaceContent['quote']) : undefined,
    photo:      typeof cj.photo === 'object' && cj.photo ? (cj.photo as SpaceContent['photo']) : undefined,
    progressPct: 0,
  };
}

export function SpaceView({ username, isPrivate, space, isOwner = false, isLoggedIn = false, reactions = [], creditBalance = 0, templateSpec = null }: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'editing' | 'preview'>('editing');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen]       = useState(false);
  const [regenOpen, setRegenOpen]       = useState(false);
  const [gateOpen, setGateOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // These depend on `space` but must be before any early returns (Rules of Hooks).
  const dtRaw      = (space?.design_tokens ?? {}) as Record<string, unknown>;
  const templateId = (dtRaw.template_id as string) ?? 'garden';
  const [activeTemplateId, setActiveTemplateId]     = useState(templateId);
  const [activeTemplateSpec, setActiveTemplateSpec] = useState<TemplateSpec | null>(templateSpec);
  const [activeSpecOverride, setActiveSpecOverride] = useState<TemplateSpecOverride | undefined>(
    dtRaw.spec_override as TemplateSpecOverride | undefined,
  );
  const [localContent, setLocalContent] = useState<SpaceContent>(
    space ? buildContent(space) : { title: '', goals: [] },
  );
  const [timeState, setTimeState] = useState(computeTimeState);
  const [activeTab, setActiveTab]   = useState<TabId>('space');
  const [activeView, setActiveView] = useState('');
  const [pulseStreak, setPulseStreak] = useState(0);
  const [hasJournal, setHasJournal] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [remixMsg, setRemixMsg] = useState('');

  useEffect(() => {
    const id = setInterval(() => setTimeState(computeTimeState()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (isPrivate) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Link href="/" style={{ position: 'fixed', top: 22, left: 24, display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 18, textDecoration: 'none', color: 'var(--app-text)' }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#9D7DE8,#7C5CDB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#fff" />
          </span>
          Spaceful
        </Link>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 110, height: 110, margin: '0 auto 28px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, var(--app-accent-soft))', border: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: '1px dashed var(--app-border-strong)', opacity: 0.6 }} />
              <Lock size={42} style={{ color: 'var(--app-accent)' }} />
            </div>
            <h1 style={{ fontSize: 28, marginBottom: 10 }}>This space is private</h1>
            <p style={{ color: 'var(--app-text-2)', fontSize: 16, lineHeight: 1.6, marginBottom: 26 }}>
              The owner hasn&apos;t shared this space publicly yet.
            </p>
            <Link href="/gallery" className="btn btn-primary btn-lg">Explore the gallery →</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!space) return null;

  const content = buildContent(space);
  const mood    = (dtRaw.mood as SpaceMood) ?? 'lavender';

  const tokens: EngineTokens = {
    mood,
    layout_variant:         ((dtRaw.layout_variant as string) === 'spacious' ? 'spacious' : 'rich'),
    animation_level:        ((dtRaw.animation_level as string) ?? 'subtle') as 'none' | 'subtle' | 'full',
    template_id:            activeTemplateId,
    spec_override:          activeSpecOverride,
    palette:                (dtRaw.palette as SpacePalette) ?? SPACE_PALETTES[mood],
    tagline:                (dtRaw.tagline as string) ?? '',
    hero_title_placeholder: (dtRaw.hero_title_placeholder as string) ?? '',
    notepad_starter:        (dtRaw.notepad_starter as string) ?? '',
    currently_placeholder:  (dtRaw.currently_placeholder as string) ?? '',
  };

  const spaceName = content.title;

  const mappedReactions = reactions.map(r => ({
    id: r.id, message: r.message, ago: timeAgo(r.created_at),
    initial: r.message.charAt(0).toUpperCase(),
  }));

  async function handleSave(updated: SpaceContent) {
    return saveSpaceContent(space!.id, updated);
  }

  function handleRegenerate() {
    setSettingsOpen(false);
    if (creditBalance < 2) { setGateOpen(true); return; }
    setRegenOpen(true);
  }

  const palette = tokens.palette;

  return (
    <>
      {/* Read ?tab= and ?view= from URL; Suspense required in Next.js 15 for useSearchParams() */}
      <Suspense fallback={null}>
        <TabReader onTab={setActiveTab} onView={setActiveView} />
      </Suspense>

      {/* owner chrome overlay — works for all templates */}
      {isOwner && <OwnerChrome
        mode={mode}
        onModeChange={setMode}
        creditBalance={creditBalance}
        onOpenShare={() => setShareOpen(s => !s)}
        onOpenSettings={() => setSettingsOpen(true)}
      />}

      {activeTab === 'space' && (
        <>
          <SpecRenderer
            content={localContent}
            tokens={tokens}
            spec={activeTemplateSpec ?? undefined}
            isOwner={isOwner}
            mode={mode}
            onUpdate={(patch) => setLocalContent(c => ({ ...c, ...patch }))}
            onSave={handleSave}
            username={username}
            greeting={timeState.greeting}
            animSpeed={timeState.animSpeed}
            nudgeDay={isOwner ? timeState.nudgeDay : null}
            streak={isOwner ? pulseStreak : undefined}
          />
          {!isOwner && space.reactions_enabled && (
            <ReactionForm username={username} spaceId={space.id} goals={localContent.goals} />
          )}
          {/* Remix button — shown to logged-in non-owners */}
          {!isOwner && isLoggedIn && (
            <div style={{ position: 'fixed', bottom: 90, right: 24, zIndex: 50 }}>
              {remixMsg && (
                <div style={{ marginBottom: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--app-accent-soft)', border: '1.5px solid var(--app-accent)', fontSize: 13, fontWeight: 700, color: 'var(--app-accent-ink)', textAlign: 'center' }}>
                  {remixMsg}
                </div>
              )}
              <button
                onClick={async () => {
                  setRemixing(true);
                  const result = await remixThisSpace(space!.id);
                  setRemixMsg(result?.error ? result.error : 'Layout applied to your space ✦');
                  setRemixing(false);
                  setTimeout(() => setRemixMsg(''), 4000);
                }}
                disabled={remixing}
                style={{ padding: '10px 18px', borderRadius: 99, border: '1.5px solid var(--app-border)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-card)', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: 'var(--app-text)', opacity: remixing ? 0.6 : 1 }}
              >
                ✦ {remixing ? 'Remixing…' : 'Remix layout'}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'journal' && activeView !== 'timeline' && (
        <JournalTab
          spaceId={space.id}
          palette={{ bg: palette.bg, bg2: palette.bg2, accent: palette.accent, text: palette.text, text2: palette.text2, surface: palette.surface }}
          streak={pulseStreak}
        />
      )}

      {activeTab === 'journal' && activeView === 'timeline' && isOwner && (
        <TimelineView
          spaceId={space.id}
          palette={{ bg: palette.bg, bg2: palette.bg2, accent: palette.accent, text: palette.text, text2: palette.text2, surface: palette.surface }}
        />
      )}

      {activeTab === 'companion' && isOwner && (
        <CompanionTab
          spaceId={space.id}
          palette={{ bg: palette.bg, bg2: palette.bg2, accent: palette.accent, text: palette.text, text2: palette.text2, surface: palette.surface }}
        />
      )}

      <TabNav
        activeTab={activeTab}
        hasJournal={hasJournal || isOwner}
        isOwner={isOwner}
      />

      {isOwner && (
        <SharePopover open={shareOpen} onClose={() => setShareOpen(false)} username={username} slug={space.slug} />
      )}

      {isOwner && (
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          spaceName={spaceName}
          currentTemplateId={activeTemplateId}
          currentArchetype={space.companion_archetype ?? 'sage'}
          onRegenerate={handleRegenerate}
          onDelete={() => { setSettingsOpen(false); setDeleteOpen(true); }}
          onSwitchTemplate={async (id) => {
            setActiveTemplateId(id);
            setActiveSpecOverride(undefined);
            const result = await switchTemplate(space!.id, id);
            if (result && 'templateSpec' in result) {
              setActiveTemplateSpec(result.templateSpec ?? null);
            }
          }}
          onSwitchArchetype={(id) => { saveCompanionArchetype(space!.id, id); }}
        />
      )}

      <Modal open={regenOpen} onClose={() => setRegenOpen(false)}>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Regenerate your theme?</h3>
        <p style={{ color: 'var(--app-text-2)', marginBottom: 20 }}>
          This will use <strong style={{ color: 'var(--app-text)' }}>2 credits</strong>. Your content stays exactly as it is.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRegenOpen(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setRegenOpen(false); toast('Regenerating your theme…', 'success'); }}>
            <Sparkles size={15} /> Regenerate
          </button>
        </div>
      </Modal>

      <Modal open={gateOpen} onClose={() => setGateOpen(false)}>
        <h3 style={{ fontSize: 20, marginBottom: 6 }}>Not enough credits</h3>
        <p style={{ color: 'var(--app-text-2)', marginBottom: 20 }}>You need 2 credits to regenerate. Top up to continue.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/account/credits" className="btn btn-primary btn-block" onClick={() => setGateOpen(false)}>Buy credits</Link>
          <button className="btn btn-ghost btn-block" onClick={() => setGateOpen(false)}>Maybe later</button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteConfirm(''); }}>
        <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--app-danger)' }}>Delete this space?</h3>
        <p style={{ color: 'var(--app-text-2)', marginBottom: 16 }}>
          This cannot be undone. Type <strong>{spaceName}</strong> to confirm.
        </p>
        <input className="input" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={spaceName} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); }}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} disabled={deleteConfirm !== spaceName} onClick={() => { toast('Space deleted', 'error'); setDeleteOpen(false); }}>
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
