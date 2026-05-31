'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, Check, RefreshCw } from 'lucide-react';
import { MiniSpace } from '@/components/space/MiniSpace';
import { Fireflies } from '@/components/space/Fireflies';
import { SPACE_PALETTES, type SpaceMood, CREDIT_COSTS } from '@/lib/utils';
import { TEMPLATES } from '@/components/space/engine/templateCatalog';
import type { TemplateSpecOverride } from '@/components/space/engine/types';
import { publishSpace } from './actions';

const VIBES = ['calm','creative','focused','cozy','bold','playful','minimal','dreamy','grounded','energetic'];
const MOODS = Object.keys(SPACE_PALETTES) as SpaceMood[];

const GEN_STEPS = [
  'Choosing your palette',
  'Setting the atmosphere',
  'Adding your goals',
  'Composing the layout',
];

type Phase = 'steps' | 'generating' | 'publish';

interface State {
  name: string;
  vibes: string[];
  goal: string;
  mood: SpaceMood;
  layout: 'spacious' | 'rich';
  templateId: string; // '' = let AI surprise
}

// Shape returned by /api/generate when stage === 'done'
interface GeneratedTokens {
  mood: SpaceMood;
  layout_variant: 'spacious' | 'rich';
  animation_level: string;
  template_id?: string;
  spec_override?: TemplateSpecOverride;
  palette: Record<string, string>;
  tagline: string;
  hero_title_placeholder: string;
  notepad_starter: string;
  currently_placeholder: string;
}

export default function OnboardPage() {
  const router = useRouter();

  const [step, setStep]   = useState(0);
  const [phase, setPhase] = useState<Phase>('steps');
  const [state, setState] = useState<State>({ name: '', vibes: [], goal: '', mood: 'lavender', layout: 'rich', templateId: '' });
  const [publishError, setPublishError] = useState('');
  const [isPending, startTransition] = useTransition();

  // generation SSE state
  const [currentStage, setCurrentStage] = useState('');
  const [stagesDone,   setStagesDone]   = useState<string[]>([]);
  const [genTokens, setGenTokens]       = useState<GeneratedTokens | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const TOTAL = 5;
  const p = SPACE_PALETTES[state.mood];

  const ambientStyle: React.CSSProperties = {
    background: `linear-gradient(160deg, ${p.bg}, ${p.bg2})`,
  };

  function goTo(n: number) { setStep(Math.max(0, Math.min(TOTAL - 1, n))); }

  function toggleVibe(v: string) {
    setState(s => {
      if (s.vibes.includes(v)) return { ...s, vibes: s.vibes.filter(x => x !== v) };
      if (s.vibes.length >= 3) return s;
      return { ...s, vibes: [...s.vibes, v] };
    });
  }

  async function startGeneration() {
    setPhase('generating');
    setCurrentStage('');
    setStagesDone([]);
    setGenTokens(null);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, template_id: state.templateId || undefined }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event = JSON.parse(line.slice(6)) as {
            stage: string; progress?: number; tokens?: GeneratedTokens;
          };

          if (event.stage === 'done' && event.tokens) {
            setGenTokens(event.tokens);
            setStagesDone(prev => [...prev, currentStage]);
            setCurrentStage('');
            setPhase('publish');
          } else {
            setStagesDone(prev => currentStage && !prev.includes(currentStage) ? [...prev, currentStage] : prev);
            setCurrentStage(event.stage);
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error('[onboard] generation error', err);
      // Fall through to publish with no AI tokens — publishSpace uses fallback
      setGenTokens(null);
      setPhase('publish');
    }
  }

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const moodColor = p.accent;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', transition: 'background 1.2s var(--ease)', ...ambientStyle }}>
      {/* ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: '60vw', height: '60vw', top: '-15vw', left: '-10vw', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.55, background: p.accent, transition: 'background 1.2s var(--ease)' }} />
        <div style={{ position: 'absolute', width: '55vw', height: '55vw', bottom: '-20vw', right: '-12vw', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.55, background: p.accent2, transition: 'background 1.2s var(--ease)' }} />
      </div>

      {/* top chrome */}
      {phase === 'steps' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(18px,3vw,28px) clamp(18px,4vw,36px)' }}>
          <button
            onClick={() => step > 0 ? goTo(step - 1) : router.back()}
            className="btn btn-ghost btn-sm"
            style={{ visibility: step === 0 ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.6)' }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span key={i} style={{ width: i === step ? 26 : 9, height: 9, borderRadius: 99, background: i === step ? 'var(--app-accent)' : 'var(--app-border-strong)', transition: 'var(--t)' }} />
            ))}
          </div>

          <button
            onClick={() => goTo(step + 1)}
            className="btn btn-ghost btn-sm"
            style={{ visibility: step === 2 ? 'visible' : 'hidden', background: 'rgba(255,255,255,0.6)' }}
          >
            Skip
          </button>
        </div>
      )}

      {/* steps */}
      {phase === 'steps' && (
        <div style={{ position: 'relative', zIndex: 5, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '90px 24px 40px' }}>
          <div style={{ width: '100%', maxWidth: 640 }} className="fade-up">

            {/* Step 1 — name */}
            {step === 0 && (
              <div>
                <div style={{ fontSize: 'clamp(26px,4.4vw,38px)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center' }}>
                  What shall we call your space?
                </div>
                <div style={{ fontSize: 15, color: 'var(--app-text-2)', textAlign: 'center', marginBottom: 30 }}>This will appear at the top of your page.</div>
                <input
                  className="ob-big-input"
                  value={state.name}
                  onChange={e => setState(s => ({ ...s, name: e.target.value }))}
                  maxLength={40}
                  placeholder="Laki's World"
                  autoFocus
                  style={{ width: '100%', fontFamily: 'var(--font)', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, textAlign: 'center', color: 'var(--app-text)', background: 'rgba(255,255,255,0.7)', border: '2px solid var(--app-border-strong)', borderRadius: 16, padding: '18px 22px', outline: 'none', transition: 'var(--t-fast)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => goTo(1)}>Continue <ArrowRight size={18} /></button>
                </div>
              </div>
            )}

            {/* Step 2 — vibes */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: 'clamp(26px,4.4vw,38px)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center' }}>
                  Pick up to 3 words for your vibe.
                </div>
                <div style={{ fontSize: 15, color: 'var(--app-text-2)', textAlign: 'center', marginBottom: 30 }}>These guide the mood of your design.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                  {VIBES.map(v => (
                    <button
                      key={v}
                      className={`chip${state.vibes.includes(v) ? ' selected' : ''}${state.vibes.length >= 3 && !state.vibes.includes(v) ? ' disabled' : ''}`}
                      onClick={() => toggleVibe(v)}
                    >{v}</button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 18, minHeight: 20, fontSize: 14, color: 'var(--app-text-2)' }}>
                  Selected: <strong style={{ color: 'var(--app-accent-ink)' }}>{state.vibes.join(' · ') || '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => goTo(2)}>Continue <ArrowRight size={18} /></button>
                </div>
              </div>
            )}

            {/* Step 3 — goal (optional) */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: 'clamp(26px,4.4vw,38px)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center' }}>
                  What's your current big goal?
                </div>
                <div style={{ fontSize: 15, color: 'var(--app-text-2)', textAlign: 'center', marginBottom: 30 }}>We'll feature this on your space. (Optional)</div>
                <input
                  value={state.goal}
                  onChange={e => setState(s => ({ ...s, goal: e.target.value }))}
                  maxLength={80}
                  placeholder="Write my first novel by December"
                  style={{ width: '100%', fontFamily: 'var(--font)', fontSize: 'clamp(18px,2.4vw,24px)', fontWeight: 800, textAlign: 'center', color: 'var(--app-text)', background: 'rgba(255,255,255,0.7)', border: '2px solid var(--app-border-strong)', borderRadius: 16, padding: '18px 22px', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => goTo(3)}>Continue <ArrowRight size={18} /></button>
                </div>
              </div>
            )}

            {/* Step 4 — colour mood */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: 'clamp(26px,4.4vw,38px)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center' }}>
                  Choose a colour mood.
                </div>
                <div style={{ fontSize: 15, color: 'var(--app-text-2)', textAlign: 'center', marginBottom: 30 }}>Here's a live preview of how it feels.</div>
                <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                  {MOODS.map(m => {
                    const mp = SPACE_PALETTES[m];
                    return (
                      <div
                        key={m}
                        onClick={() => setState(s => ({ ...s, mood: m }))}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      >
                        <div style={{
                          width: 54, height: 54, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${mp.accent2}, ${mp.accent})`,
                          border: `3px solid ${state.mood === m ? 'var(--app-text)' : 'transparent'}`,
                          transform: state.mood === m ? 'scale(1.12)' : 'scale(1)',
                          boxShadow: 'var(--shadow-soft)', transition: 'var(--t-fast)',
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: state.mood === m ? 'var(--app-text)' : 'var(--app-text-2)' }}>{m}</span>
                      </div>
                    );
                  })}
                </div>
                {/* live preview */}
                <div style={{ width: 260, height: 170, margin: '0 auto', borderRadius: 14, boxShadow: 'var(--shadow-card)', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
                  <MiniSpace
                    palette={state.mood}
                    title={state.name || "Your Space"}
                    goals={state.vibes.length ? state.vibes : ['calm', 'focused']}
                    style={{ height: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => goTo(4)}>Continue <ArrowRight size={18} /></button>
                </div>
              </div>
            )}

            {/* Step 5 — template picker */}
            {step === 4 && (
              <div>
                <div style={{ fontSize: 'clamp(26px,4.4vw,38px)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center' }}>
                  Pick a world to start from.
                </div>
                <div style={{ fontSize: 15, color: 'var(--app-text-2)', textAlign: 'center', marginBottom: 26 }}>
                  AI will personalise it for you. Or let it choose.
                </div>

                {/* 3-col template grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {TEMPLATES.map(t => {
                    const selected = state.templateId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setState(s => ({ ...s, templateId: t.id }))}
                        style={{
                          padding: 0, cursor: 'pointer', textAlign: 'left',
                          borderRadius: 14, overflow: 'hidden',
                          border: `2.5px solid ${selected ? 'var(--app-accent)' : 'transparent'}`,
                          boxShadow: selected ? 'var(--shadow-card)' : '0 2px 8px rgba(0,0,0,0.08)',
                          transform: selected ? 'scale(1.03)' : 'scale(1)',
                          transition: 'var(--t-fast)',
                          background: 'none',
                        }}
                      >
                        <div style={{ position: 'relative', height: 106, overflow: 'hidden' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/templates/${t.id}-anime.jpg`}
                            alt={t.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                          {selected && (
                            <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--app-accent)', display: 'grid', placeItems: 'center' }}>
                              <Check size={13} color="#fff" strokeWidth={3} />
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 8, left: 10, color: '#fff', fontSize: 13, fontWeight: 800, lineHeight: 1 }}>
                            {t.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Surprise me */}
                <button
                  type="button"
                  onClick={() => setState(s => ({ ...s, templateId: '' }))}
                  style={{
                    width: '100%', marginTop: 12, padding: '13px 20px',
                    borderRadius: 14, cursor: 'pointer',
                    border: `2px dashed ${state.templateId === '' ? 'var(--app-accent)' : 'var(--app-border-strong)'}`,
                    background: state.templateId === '' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'var(--t-fast)',
                  }}
                >
                  <Sparkles size={18} style={{ color: 'var(--app-accent)' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--app-text)' }}>Let AI surprise me</span>
                  {state.templateId === '' && <Check size={16} style={{ color: 'var(--app-accent)', marginLeft: 4 }} />}
                </button>

                {/* compact density toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 }}>
                  <span style={{ fontSize: 13, color: 'var(--app-text-2)', fontWeight: 700 }}>Density:</span>
                  {(['spacious', 'rich'] as const).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setState(s => ({ ...s, layout: key }))}
                      style={{ padding: '5px 14px', borderRadius: 99, border: `1.5px solid ${state.layout === key ? 'var(--app-accent)' : 'var(--app-border-strong)'}`, background: state.layout === key ? 'rgba(255,255,255,0.85)' : 'transparent', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: state.layout === key ? 'var(--app-accent-ink)' : 'var(--app-text-2)', transition: 'var(--t-fast)' }}
                    >{key === 'spacious' ? 'Spacious' : 'Rich'}</button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
                  <button className="btn btn-primary btn-lg" onClick={startGeneration}>
                    <Sparkles size={18} /> Generate my space
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* generation loading screen — driven by real SSE events */}
      {phase === 'generating' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <Fireflies color={`${p.accent}e6`} count={30} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 'clamp(26px,4vw,34px)', fontWeight: 800, marginBottom: 34, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ animation: 'spin 3s linear infinite', display: 'inline-block' }}>
                <Sparkles size={32} style={{ color: p.accent }} />
              </span>
              Creating your space…
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 340, maxWidth: '90vw' }}>
              {/* completed stages */}
              {stagesDone.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 1 }}>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 700, color: 'var(--app-text)' }}>{label}</span>
                  <Check size={18} style={{ color: 'var(--app-success)', flexShrink: 0 }} />
                </div>
              ))}
              {/* in-progress stage */}
              {currentStage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp .4s ease' }}>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 700, color: 'var(--app-text)' }}>{currentStage}</span>
                  <span style={{ width: 70, height: 6, borderRadius: 99, background: 'var(--app-border)', overflow: 'hidden', flexShrink: 0 }}>
                    <span style={{ display: 'block', height: '100%', width: '60%', background: p.accent, borderRadius: 99, transition: 'width 0.8s ease', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* publish screen */}
      {phase === 'publish' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '70px 24px 30px', overflow: 'auto' }} className="fade-up">
          <h2 style={{ fontSize: 'clamp(24px,3.4vw,30px)', marginBottom: 6, textAlign: 'center' }}>
            Here's your space{state.name ? `, ${state.name.split(' ')[0]}` : ''}.
          </h2>
          <div style={{ color: 'var(--app-text-2)', marginBottom: 22, textAlign: 'center' }}>
            Take it in. You can fine-tune everything once it's live.
          </div>
          {/* scaled preview frame */}
          <div style={{ width: 760, maxWidth: '94vw', height: 460, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--app-border)', boxShadow: 'var(--shadow-lift)', background: '#fff', position: 'relative' }}>
            <MiniSpace
              palette={state.mood}
              title={state.name || 'Your Space'}
              goals={[...(state.goal ? [state.goal.slice(0, 20)] : []), ...state.vibes].slice(0, 3)}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={isPending}
              onClick={() => {
                setPublishError('');
                startTransition(async () => {
                  const result = await publishSpace({ ...state, generatedTokens: genTokens ?? undefined });
                  if (result?.error === 'insufficient_credits') {
                    setPublishError("You don't have enough credits. Buy more to publish.");
                  } else if (result?.error) {
                    setPublishError(result.error);
                  }
                });
              }}
            >
              {isPending ? 'Publishing…' : <><Check size={18} /> It&apos;s perfect → Publish</>}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={startGeneration} disabled={isPending}>
              <RefreshCw size={18} /> Regenerate · {CREDIT_COSTS.regeneration} credits
            </button>
          </div>
          {publishError && (
            <div style={{ fontSize: 13, color: 'var(--app-danger)', marginTop: 12, textAlign: 'center' }}>{publishError}</div>
          )}
          <div style={{ fontSize: 13, color: 'var(--app-text-2)', marginTop: 16 }}>
            Your space will be live at <strong style={{ color: 'var(--app-accent-ink)' }}>spaceful.io/{state.name?.toLowerCase().replace(/\s+/g, '-') || 'your-space'}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
