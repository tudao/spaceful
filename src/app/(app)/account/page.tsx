'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGES, type LanguageCode } from '@/lib/languages';

export default function AccountPage() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/profile/current')
      .then(r => r.json())
      .then(d => { if (d.preferred_language) setLanguage(d.preferred_language); })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: language }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 32 }}>Account settings</h1>

      <div style={{ border: '1px solid var(--sp-border, #ede9ff)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Globe size={18} strokeWidth={1.5} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Language</span>
        </div>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          Your companion, monthly letters, and generated content will respond in this language. UI stays in English.
        </p>
        <select
          value={language}
          onChange={e => { setLanguage(e.target.value as LanguageCode); setSaved(false); }}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d8d0f8', fontSize: 14, marginBottom: 16 }}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary btn-sm"
        >
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
