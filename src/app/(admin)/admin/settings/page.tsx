'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Settings {
  companion_credit_cost:    number;
  daily_login_credits:      number;
  generation_credit_cost:   number;
  regeneration_credit_cost: number;
  signup_gift_credits:      number;
}

const LABELS: Record<keyof Settings, string> = {
  companion_credit_cost:    'Companion chat cost (credits/message)',
  daily_login_credits:      'Daily login grant (credits)',
  generation_credit_cost:   'Space generation cost (credits)',
  regeneration_credit_cost: 'Theme regeneration cost (credits)',
  signup_gift_credits:      'Signup gift (credits)',
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dirty, setDirty]       = useState<Partial<Settings>>({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''}` },
    })
      .then(r => r.json())
      .then(setSettings);
  }, []);

  function onChange(key: keyof Settings, val: string) {
    const num = parseFloat(val);
    if (!isNaN(num)) setDirty(d => ({ ...d, [key]: num }));
  }

  async function save() {
    if (!Object.keys(dirty).length) return;
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''}`,
      },
      body: JSON.stringify(dirty),
    });
    const updated = await res.json();
    setSettings(updated);
    setDirty({});
    toast('Settings saved', 'success');
    setSaving(false);
  }

  if (!settings) return <div style={{ padding: 40, color: 'var(--app-text-2)' }}>Loading…</div>;

  const current = { ...settings, ...dirty };

  return (
    <div style={{ padding: '28px clamp(20px,3vw,40px) 60px', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Platform settings</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={save}
          disabled={saving || !Object.keys(dirty).length}
        >
          <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(Object.keys(LABELS) as (keyof Settings)[]).map(key => (
          <div key={key} style={{ background: 'var(--app-surface)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{LABELS[key]}</div>
              <div style={{ fontSize: 12, color: 'var(--app-text-2)' }}>Default: {settings[key]}</div>
            </div>
            <input
              type="number"
              min="0"
              step="0.1"
              value={current[key]}
              onChange={e => onChange(key, e.target.value)}
              style={{ width: 90, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${key in dirty ? 'var(--app-accent)' : 'var(--app-border)'}`, fontSize: 16, fontWeight: 800, textAlign: 'right', fontFamily: 'var(--font)', background: 'var(--app-bg)', color: 'var(--app-text)' }}
            />
          </div>
        ))}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--app-text-muted)' }}>
        Changes take effect immediately. Existing sessions are not affected until next request.
      </p>
    </div>
  );
}
