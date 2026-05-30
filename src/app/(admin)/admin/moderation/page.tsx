'use client';

import { useState } from 'react';
import { Check, X, Flag, ArrowDown, CheckCheck } from 'lucide-react';
import { MiniSpace } from '@/components/space/MiniSpace';
import { useToast } from '@/components/ui/Toast';

const QUEUE = [
  {
    id: '1', username: '@laki', spaceName: "Laki's World",
    submitted: '2 hours ago',
    tags: ['calm', 'cozy', 'dreamy'],
    goalsExcerpt: 'Write my first novel · Run 3× a week · Read 24 books',
    notepadExcerpt: '"Slept badly but got to the desk by seven. Coffee, then 600 words before the noise of the day. Ran the long loop by the reservoir…"',
    palette: 'lavender' as const,
  },
  {
    id: '2', username: '@arbor', spaceName: 'Deep Green',
    submitted: '4 hours ago',
    tags: ['grounded', 'calm'],
    goalsExcerpt: 'Hike every weekend · Start a garden · Read nature writing',
    notepadExcerpt: '"Found a trail I hadn\'t done before. Three hours. No phone signal. Exactly what I needed."',
    palette: 'forest' as const,
  },
];

const REJECTION_REASONS = [
  'Content violates community guidelines',
  'Space is not yet complete enough for gallery',
  'Requested tags don\'t match content',
  'Custom…',
];

export default function ModerationPage() {
  const { toast } = useToast();
  const [idx, setIdx]         = useState(0);
  const [filter, setFilter]   = useState('pending');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason]   = useState(REJECTION_REASONS[0]);
  const [queue, setQueue]     = useState(QUEUE);

  const item = queue[idx];
  const total = queue.length;

  function approve() {
    toast(`Approved — ${item.spaceName} is now live in gallery`, 'success');
    advance();
  }
  function reject() {
    if (!rejectOpen) { setRejectOpen(true); return; }
    toast(`Rejected with reason sent`, 'error');
    advance();
  }
  function flag() { toast(`Flagged for second review`); advance(); }
  function advance() {
    setRejectOpen(false);
    if (idx < queue.length - 1) setIdx(i => i + 1);
    else toast('Queue cleared');
  }

  if (!item) {
    return (
      <div style={{ padding: '28px clamp(20px,3vw,40px) 60px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Moderation</h1>
        <p style={{ color: 'var(--app-text-2)' }}>Queue is empty.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px clamp(20px,3vw,40px) 60px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          Moderation <span className="badge badge-warning">{queue.length} pending</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['pending', 'approved', 'rejected', 'flagged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                color: filter === f ? 'var(--app-accent-ink)' : 'var(--app-text-2)',
                background: filter === f ? 'var(--app-accent-soft)' : '#fff',
                border: '1.5px solid var(--app-border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => toast('Bulk approved')}>
            <CheckCheck size={15} /> Bulk approve
          </button>
        </div>
      </div>

      {/* two-col review */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 22, alignItems: 'start' }}>
        {/* space preview */}
        <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--app-border)', fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: 'var(--app-text-2)' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {[...Array(3)].map((_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--app-border-strong)' }} />)}
            </div>
            spaceful.io/{item.username.replace('@', '')}
          </div>
          <div style={{ height: 440, overflow: 'hidden', position: 'relative' }}>
            <MiniSpace
              palette={item.palette}
              title={item.spaceName}
              goals={item.tags}
              style={{ height: '100%', transform: 'scale(1)', transformOrigin: 'top left' }}
            />
          </div>
        </div>

        {/* review info */}
        <div>
          <div className="card" style={{ padding: 20 }}>
            {[
              { k: 'Submitted by', v: item.username },
              { k: 'Submitted',    v: item.submitted },
              { k: 'Requested tags', v: item.tags.join(' · ') },
            ].map(row => (
              <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', fontSize: 14, borderBottom: '1px solid var(--app-border)' }}>
                <span style={{ color: 'var(--app-text-2)' }}>{row.k}</span>
                <span style={{ fontWeight: 700, textAlign: 'right' }}>{row.v}</span>
              </div>
            ))}

            <div style={{ background: 'var(--app-bg-2)', borderRadius: 12, padding: '14px 16px', margin: '14px 0', fontSize: 13.5, color: 'var(--app-text-2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--app-text)' }}>Goals:</strong> {item.goalsExcerpt}
              <br /><br />
              <strong style={{ color: 'var(--app-text)' }}>Notepad:</strong> {item.notepadExcerpt}
            </div>

            {/* action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 6 }}>
              <button onClick={approve}   style={{ background: 'var(--app-success-soft)', color: '#3f8159', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: 11, cursor: 'pointer', border: '1.5px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'var(--t-fast)' }}>
                <Check size={17} /> Approve
              </button>
              <button onClick={reject}    style={{ background: 'var(--app-danger-soft)', color: '#a8384a', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: 11, cursor: 'pointer', border: '1.5px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'var(--t-fast)' }}>
                <X size={17} /> Reject
              </button>
              <button onClick={flag}      style={{ background: 'var(--app-warning-soft)', color: '#a06d22', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: 11, cursor: 'pointer', border: '1.5px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'var(--t-fast)' }}>
                <Flag size={17} /> Flag
              </button>
            </div>

            {/* rejection reason */}
            {rejectOpen && (
              <div style={{ marginTop: 14, animation: 'fadeUp .3s var(--ease)' }}>
                <label className="field-label" style={{ marginTop: 14 }}>Rejection reason (shown to user)</label>
                <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
                  {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <button className="btn btn-danger btn-sm btn-block" style={{ marginTop: 10 }} onClick={reject}>
                  Confirm rejection
                </button>
              </div>
            )}

            {/* queue nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--app-border)' }}>
              <span style={{ fontSize: 14, color: 'var(--app-text-2)' }}>
                Item <strong style={{ color: 'var(--app-text)' }}>{idx + 1}</strong> of {total}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={advance} disabled={idx >= total - 1}>
                Next item <ArrowDown size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
