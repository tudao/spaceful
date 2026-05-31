'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

interface Quote {
  text: string;
  author?: string;
}

interface DailyData {
  message: string;
  archetype: string;
  quote: Quote;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface CompanionTabProps {
  spaceId: string;
  palette: { bg: string; bg2: string; accent: string; text: string; text2: string; surface: string };
}

const ARCHETYPE_LABELS: Record<string, string> = {
  stoic:      'The Stoic',
  coach:      'The Coach',
  poet:       'The Poet',
  sage:       'The Sage',
  challenger: 'The Challenger',
};

export function CompanionTab({ spaceId, palette: p }: CompanionTabProps) {
  const [daily, setDaily]     = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput]     = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/companion/daily?space_id=${spaceId}`)
      .then(r => r.json())
      .then(d => { if (d.message) setDaily(d); })
      .finally(() => setLoading(false));
  }, [spaceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setError('');
    const newHistory: ChatMessage[] = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setSending(true);

    // Add streaming placeholder
    setHistory(h => [...h, { role: 'assistant', content: '', streaming: true }]);

    try {
      const resp = await fetch('/api/companion/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          space_id: spaceId,
          message:  text,
          history:  newHistory.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 402) {
        setHistory(h => h.slice(0, -1)); // remove placeholder
        setError('Not enough credits for companion chat.');
        setSending(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = JSON.parse(line.slice(6));
          if (json.chunk) {
            setHistory(h => {
              const updated = [...h];
              const last = updated[updated.length - 1];
              if (last?.streaming) updated[updated.length - 1] = { ...last, content: last.content + json.chunk };
              return updated;
            });
          }
          if (json.done || json.error) {
            setHistory(h => {
              const updated = [...h];
              const last = updated[updated.length - 1];
              if (last?.streaming) updated[updated.length - 1] = { ...last, streaming: false };
              return updated;
            });
          }
        }
      }
    } catch {
      setHistory(h => h.slice(0, -1));
      setError('Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  }

  const border = `1px solid ${p.surface}`;
  const archetype = daily?.archetype ?? 'sage';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(170deg, ${p.bg}, ${p.bg2})`, color: p.text, fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto', padding: '80px clamp(20px,5vw,60px) 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Companion</h2>
        <p style={{ fontSize: 14, color: p.text2 }}>{ARCHETYPE_LABELS[archetype] ?? 'Your guide'}</p>
      </div>

      {/* Daily message */}
      {loading && (
        <div style={{ height: 100, borderRadius: 16, background: p.surface, opacity: 0.5, marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
      )}
      {!loading && daily && (
        <div style={{ background: p.surface, borderRadius: 20, padding: '20px 22px', marginBottom: 20, border }}>
          <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: p.text, fontStyle: 'italic' }}>{daily.message}</p>
        </div>
      )}

      {/* Quote */}
      {!loading && daily?.quote && (
        <div style={{ borderLeft: `3px solid ${p.accent}`, paddingLeft: 16, marginBottom: 28 }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: p.text2, margin: '0 0 4px', fontStyle: 'italic' }}>"{daily.quote.text}"</p>
          {daily.quote.author && <p style={{ fontSize: 12, color: p.text2, margin: 0, fontWeight: 700 }}>— {daily.quote.author}</p>}
        </div>
      )}

      {/* Chat history */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingBottom: 140 }}>
        {history.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? p.accent : p.surface,
              color: msg.role === 'user' ? '#fff' : p.text,
              fontSize: 14,
              lineHeight: 1.65,
              border: msg.role === 'assistant' ? border : 'none',
              opacity: msg.streaming && !msg.content ? 0.5 : 1,
            }}>
              {msg.content || (msg.streaming ? '…' : '')}
            </div>
          </div>
        ))}
        {error && <p style={{ fontSize: 13, color: 'var(--app-danger)', textAlign: 'center' }}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 680, padding: '0 clamp(20px,5vw,60px)', background: `linear-gradient(to top, ${p.bg} 80%, transparent)`, paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your companion…"
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 14,
              border,
              background: p.surface,
              color: p.text,
              fontFamily: 'inherit',
              outline: 'none',
              maxHeight: 120,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: input.trim() ? p.accent : p.surface,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            <Send size={18} color={input.trim() ? '#fff' : p.text2} />
          </button>
        </div>
      </div>
    </div>
  );
}
