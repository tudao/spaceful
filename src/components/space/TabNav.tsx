'use client';

import { useRouter } from 'next/navigation';

export type TabId = 'space' | 'journal' | 'companion';

interface TabNavProps {
  activeTab: TabId;
  username: string;
  hasJournal: boolean;
  isOwner: boolean;
}

export function TabNav({ activeTab, username, hasJournal, isOwner }: TabNavProps) {
  const router = useRouter();

  function go(tab: TabId) {
    const url = tab === 'space' ? `/${username}` : `/${username}?tab=${tab}`;
    router.push(url);
  }

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: 'space', label: 'Space', show: true },
    { id: 'journal', label: 'Journal', show: hasJournal },
    { id: 'companion', label: 'Companion', show: isOwner },
  ];

  const visible = tabs.filter(t => t.show);
  if (visible.length <= 1) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
      display: 'inline-flex', gap: 4, padding: 5,
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(18px)',
      border: '1.5px solid rgba(255,255,255,0.7)',
      borderRadius: 999,
      boxShadow: '0 8px 32px rgba(26,16,64,0.18)',
    }}>
      {visible.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => go(id)}
          style={{
            border: 'none', borderRadius: 999, padding: '9px 20px',
            background: activeTab === id ? 'var(--app-accent)' : 'transparent',
            color: activeTab === id ? '#fff' : 'var(--app-text-2)',
            fontSize: 14, fontWeight: 800, fontFamily: 'var(--font)',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: activeTab === id ? '0 2px 12px rgba(124,111,224,0.4)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
