'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Globe, ShieldAlert, Flag,
  Gem, Bot, Image, Settings, ExternalLink,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/admin',             icon: LayoutDashboard },
  { label: 'Users',      href: '/admin/users',        icon: Users },
  { label: 'Spaces',     href: '/admin/spaces',       icon: Globe },
  { label: 'Moderation', href: '/admin/moderation',   icon: ShieldAlert },
  { label: 'Reports',    href: '/admin/reports',      icon: Flag },
  { label: 'Credits',    href: '/admin/credits',      icon: Gem },
  { label: 'AI',         href: '/admin/ai',           icon: Bot },
  { label: 'Gallery',    href: '/admin/gallery',      icon: Image },
  { label: 'Settings',   href: '/admin/settings',     icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--app-surface)',
      borderRight: '1px solid var(--app-border)',
      padding: '20px 12px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ padding: '4px 8px 20px', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>
        Spaceful Admin
      </div>

      {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 10px', height: 38, borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            color: pathname === href ? 'var(--app-accent-ink)' : 'var(--app-text-2)',
            background: pathname === href ? 'var(--app-accent-soft)' : 'transparent',
            transition: 'var(--t-fast)',
          }}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}

      <div style={{ marginTop: 'auto' }}>
        <Link
          href="/spaces"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 10px', height: 38, borderRadius: 10,
            fontSize: 14, fontWeight: 600, color: 'var(--app-text-muted)',
          }}
        >
          <ExternalLink size={16} />
          Exit admin
        </Link>
      </div>
    </aside>
  );
}
