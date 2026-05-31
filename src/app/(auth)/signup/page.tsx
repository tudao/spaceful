'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isValidUsername } from '@/lib/utils';

export default function SignupPage() {
  const router   = useRouter();

  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null);

  async function checkUsername(val: string) {
    setUsername(val);
    setUsernameOk(null);
    if (!isValidUsername(val)) return;
    setChecking(true);
    const res = await fetch(`/api/check-username?username=${encodeURIComponent(val)}`);
    const { available } = await res.json() as { available: boolean };
    setUsernameOk(available);
    setChecking(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUsername(username)) { setError('Username must be 3–20 chars, letters/numbers/hyphens only.'); return; }
    setError(''); setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: `${location.origin}/auth/callback?next=/onboard`,
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/onboard');
  }

  const usernameValid = isValidUsername(username);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 20, marginBottom: 40, textDecoration: 'none', color: 'var(--app-text)' }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#9D7DE8,#7C5CDB)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(124,92,219,0.35)' }}>
          <Sparkles size={18} color="#fff" />
        </span>
        Spaceful
      </Link>

      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create your space</h1>
        <p style={{ fontSize: 14, color: 'var(--app-text-2)', marginBottom: 28 }}>Start free — 3 credits on us.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>

          <div>
            <label className="field-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                value={username}
                onChange={e => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="yourname"
                required
                maxLength={20}
                style={{ paddingRight: 40 }}
              />
              {username.length > 2 && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  {checking ? (
                    <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>…</span>
                  ) : usernameOk && usernameValid ? (
                    <Check size={16} style={{ color: 'var(--app-success)' }} />
                  ) : !usernameValid ? (
                    <X size={16} style={{ color: 'var(--app-danger)' }} />
                  ) : null}
                </span>
              )}
            </div>
            {username && (
              <p style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 5 }}>
                Your space: <span style={{ color: 'var(--app-accent-ink)', fontWeight: 700 }}>spaceful.io/{username || '…'}</span>
                {' '}— <span style={{ color: 'var(--app-warning)', fontSize: 11 }}>permanent · can't be changed</span>
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--app-danger)' }}>{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading || !usernameValid} style={{ marginTop: 4 }}>
            {loading ? 'Creating your account…' : 'Create account — it\'s free'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
          By signing up you agree to our{' '}
          <a href="#" style={{ color: 'var(--app-accent)' }}>Terms</a> &amp;{' '}
          <a href="#" style={{ color: 'var(--app-accent)' }}>Privacy Policy</a>.
        </p>
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: 'var(--app-text-2)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--app-accent)', fontWeight: 700 }}>Sign in</Link>
      </p>
    </div>
  );
}
