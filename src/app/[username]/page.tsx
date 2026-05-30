'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { SpacePage } from '@/components/space/SpacePage';
import { SettingsDrawer } from '@/components/space/SettingsDrawer';
import { SharePopover } from '@/components/space/SharePopover';
import { ReactionForm } from '@/components/space/ReactionForm';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { use } from 'react';

interface Props {
  params: Promise<{ username: string }>;
}

// Simulated data — replace with createClient() + DB query once schema is applied
const DEMO_SPACE = {
  isPublic: true,
  ownerUsername: 'laki',
  id: 'demo-space-id',
  content: {
    title: "Laki's World",
    subtitle: 'A quiet corner for a slow novel, long runs, and the books that keep me company.',
    monogram: 'LW',
    goals: [
      { id: '1', text: 'Write my first novel',    done: true },
      { id: '2', text: 'Run 3× a week',           done: true },
      { id: '3', text: 'Read 24 books',            done: false },
      { id: '4', text: 'Learn film photography',   done: false },
    ],
    currently: 'Currently reading The Creative Act',
    heroTitle: 'Finish chapter three before Sunday',
    heroNotes: 'The hard middle. Marisol finally tells him the truth and I keep flinching away from it. The goal is to stop editing as I go and just let the scene be messy.',
    notepad: 'Slept badly but got to the desk by seven. Coffee, then 600 words before the noise of the day.\n\nRan the long loop by the reservoir — first time it felt easy this year. Saw two herons.\n\nReading before bed instead of the phone. Small thing, big difference.',
    periods: [
      { week: 'Week 20', title: 'Outline the ending',       notes: 'Mapped the last three chapters on index cards. It finally has a shape.', status: 'done' as const },
      { week: 'Week 21', title: 'Build the running habit',  notes: 'Three runs, no excuses. Laid clothes out the night before.',             status: 'prog' as const },
      { week: 'Week 22', title: 'A roll of film a week',    notes: 'Picked up the old Pentax. Learning to see light again.',                 status: 'plan' as const },
    ],
    progressPct: 64,
  },
  reactions: [
    { id: '1', message: 'This made me want to start writing again. Thank you for sharing it. 💛', ago: '2 hours ago', initial: 'A' },
    { id: '2', message: 'the herons detail got me. so calm here.', ago: 'yesterday', initial: '·' },
    { id: '3', message: 'good luck with chapter three!', ago: '3 days ago', initial: 'M' },
  ],
};

export default function UserSpacePage({ params }: Props) {
  const { username } = use(params);
  const { toast }    = useToast();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen]       = useState(false);
  const [regenOpen, setRegenOpen]       = useState(false);
  const [gateOpen, setGateOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // In production: derive from session + DB query
  const isOwner = username === DEMO_SPACE.ownerUsername;
  const isPrivate = false; // set from DB

  if (isPrivate && !isOwner) {
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
              The owner hasn't shared this space publicly yet. But there are plenty of others to wander through.
            </p>
            <Link href="/gallery" className="btn btn-primary btn-lg">Explore the gallery →</Link>
          </div>
        </div>
      </div>
    );
  }

  function handleRegenerate() {
    setSettingsOpen(false);
    // check credits — demo has 14
    if (14 < 2) { setGateOpen(true); return; }
    setRegenOpen(true);
  }

  function handleDelete() {
    setSettingsOpen(false);
    setDeleteOpen(true);
  }

  return (
    <>
      <SpacePage
        content={DEMO_SPACE.content}
        mood="lavender"
        isOwner={isOwner}
        username={username}
        reactions={DEMO_SPACE.reactions}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShare={() => setShareOpen(s => !s)}
      />

      {/* visitor reaction form */}
      {!isOwner && (
        <ReactionForm username={username} spaceId={DEMO_SPACE.id} />
      )}

      {/* share popover */}
      {isOwner && (
        <SharePopover open={shareOpen} onClose={() => setShareOpen(false)} username={username} />
      )}

      {/* settings drawer */}
      {isOwner && (
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onRegenerate={handleRegenerate}
          onDelete={handleDelete}
        />
      )}

      {/* regenerate confirm modal */}
      <Modal open={regenOpen} onClose={() => setRegenOpen(false)}>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Regenerate your theme?</h3>
        <p style={{ color: 'var(--app-text-2)', marginBottom: 20 }}>
          This will use <strong style={{ color: 'var(--app-text)' }}>2 credits</strong>. Your content — goals, notes, plans — will be kept exactly as it is.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary grow" style={{ flex: 1 }} onClick={() => setRegenOpen(false)}>Cancel</button>
          <button className="btn btn-primary grow" style={{ flex: 1 }} onClick={() => { setRegenOpen(false); toast('Regenerating your theme…', 'success'); }}>
            <Sparkles size={15} /> Regenerate
          </button>
        </div>
      </Modal>

      {/* credit gate modal */}
      <Modal open={gateOpen} onClose={() => setGateOpen(false)}>
        <h3 style={{ fontSize: 20, marginBottom: 6 }}>You need 2 credits</h3>
        <p style={{ color: 'var(--app-text-2)', marginBottom: 20 }}>You have <strong style={{ color: 'var(--app-text)' }}>0</strong> remaining. Top up to keep creating.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/account/credits" className="btn btn-primary btn-block" onClick={() => setGateOpen(false)}>
            Buy 10 credits — $5
          </Link>
          <Link href="/account/credits" className="btn btn-secondary btn-block" onClick={() => setGateOpen(false)}>
            Subscribe $15/mo — 20 credits/month
          </Link>
          <div style={{ height: 1, background: 'var(--app-border)', margin: '8px 0' }} />
          <button className="btn btn-ghost btn-block" onClick={() => setGateOpen(false)}>Maybe later</button>
        </div>
      </Modal>

      {/* delete confirm modal */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteConfirm(''); }}>
        <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--app-danger)' }}>Delete this space?</h3>
        <p style={{ color: 'var(--app-text-2)', marginBottom: 16 }}>This cannot be undone. Type <strong>{DEMO_SPACE.content.title}</strong> to confirm.</p>
        <input
          className="input"
          value={deleteConfirm}
          onChange={e => setDeleteConfirm(e.target.value)}
          placeholder={DEMO_SPACE.content.title}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); }}>Cancel</button>
          <button
            className="btn btn-danger"
            style={{ flex: 1 }}
            disabled={deleteConfirm !== DEMO_SPACE.content.title}
            onClick={() => { toast('Space deleted', 'error'); setDeleteOpen(false); }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
