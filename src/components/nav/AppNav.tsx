'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Gem } from 'lucide-react';

interface AppNavProps {
  authenticated?: boolean;
  creditBalance?: number;
  userInitial?: string;
}

export function AppNav({ authenticated, creditBalance = 14, userInitial = 'L' }: AppNavProps) {
  const pathname = usePathname();

  const creditClass = creditBalance === 0 ? 'zero' : creditBalance < 5 ? 'low' : '';

  return (
    <nav className="app-nav">
      <Link href={authenticated ? '/spaces' : '/'} className="logo">
        <span className="mark"><Sparkles size={17} /></span>
        Spaceful
      </Link>

      <div className="nav-links">
        {authenticated && (
          <Link href="/spaces" className={pathname.startsWith('/spaces') ? 'active' : ''}>My Spaces</Link>
        )}
        <Link href="/gallery" className={pathname === '/gallery' ? 'active' : ''}>Gallery</Link>
        {!authenticated && <a href="/#pricing">Pricing</a>}
      </div>

      <span className="spacer" />

      {authenticated ? (
        <>
          <Link href="/account/credits" className={`credit-pill ${creditClass}`}>
            <Gem className="gem" size={15} />
            {creditBalance === 0 ? 'Buy credits' : creditBalance}
          </Link>
          <div className="avatar">{userInitial}</div>
        </>
      ) : (
        <>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Start for free</Link>
        </>
      )}
    </nav>
  );
}
