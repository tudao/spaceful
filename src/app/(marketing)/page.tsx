import Link from 'next/link';
import { MessageCircleHeart, Sparkles, Link2, Check } from 'lucide-react';
import { MiniSpace } from '@/components/space/MiniSpace';

const TRIO = [
  { palette: 'ocean'    as const, title: 'Koa Drifts',       goals: ['surf', 'build', 'rest'] },
  { palette: 'lavender' as const, title: "Laki's World",      goals: ['write', 'run', 'read'] },
  { palette: 'rose'     as const, title: "Nina's Notebook",   goals: ['paint', 'plant', 'poetry'] },
];

const GALLERY_TEASER = [
  { palette: 'forest'   as const, title: 'Deep Green',       who: '@arbor · grounded' },
  { palette: 'sand'     as const, title: 'Slow Mornings',    who: '@mira · cozy' },
  { palette: 'midnight' as const, title: 'Night Shift',      who: '@vex · bold' },
  { palette: 'ocean'    as const, title: 'Koa Drifts',       who: '@koa · calm' },
  { palette: 'rose'     as const, title: "Nina's Notebook",  who: '@nina · creative' },
  { palette: 'lavender' as const, title: "Laki's World",     who: '@laki · dreamy' },
];

const STEPS = [
  { icon: MessageCircleHeart, title: 'Answer 5 questions',  desc: 'Tell us your vibe, your goal, your colours.' },
  { icon: Sparkles,           title: 'AI designs your space', desc: 'A unique theme, made just for you, in seconds.' },
  { icon: Link2,              title: 'Share your link',     desc: 'One link that actually shows who you are.' },
];

export default function LandingPage() {
  return (
    <>
      {/* hero */}
      <section style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', padding: 'clamp(56px,9vw,110px) 24px clamp(40px,6vw,72px)' }}>
        {/* ambient glow */}
        <div style={{ position: 'absolute', width: '80vw', height: '80vw', maxWidth: 900, maxHeight: 900, top: '-40%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, var(--app-accent-soft), transparent 62%)', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(34px,6.5vw,60px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: '14ch', margin: '0 auto 18px' }}>
            Your personal space on the internet.
          </h1>
          <p style={{ fontSize: 'clamp(16px,2.4vw,21px)', color: 'var(--app-text-2)', maxWidth: '38ch', margin: '0 auto 30px' }}>
            AI-designed. Uniquely yours. Share it with a link.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Start for free <span style={{ marginLeft: 4 }}>→</span>
            </Link>
            <Link href="/gallery" className="btn btn-secondary btn-lg">Explore gallery</Link>
          </div>

          {/* trio */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'clamp(40px,7vw,72px)', perspective: 1400 }}>
            {TRIO.map((s, i) => {
              const isCenter = i === 1;
              return (
                <div
                  key={i}
                  style={{
                    width: 300, height: 380, borderRadius: 20, overflow: 'hidden', flexShrink: 0,
                    boxShadow: 'var(--shadow-lift)', border: '1px solid var(--app-border)', background: '#fff',
                    transform: isCenter
                      ? 'translateY(-14px) scale(1.02)'
                      : i === 0 ? 'rotateY(14deg) translateX(40px) scale(.9)' : 'rotateY(-14deg) translateX(-40px) scale(.9)',
                    zIndex: isCenter ? 3 : 1,
                    transition: 'transform .5s var(--ease)',
                  }}
                >
                  <MiniSpace palette={s.palette} title={s.title} goals={s.goals} style={{ height: '100%' }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(48px,8vw,90px) clamp(18px,5vw,48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 42 }}>
          <h2 style={{ fontSize: 'clamp(26px,3.6vw,34px)', fontWeight: 800, letterSpacing: '-0.01em' }}>Three questions, one beautiful page.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {STEPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ textAlign: 'center', padding: '30px 22px' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16, background: 'var(--app-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-accent)', boxShadow: 'var(--shadow-soft)' }}>
                <Icon size={26} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h3>
              <p style={{ color: 'var(--app-text-2)', fontSize: 15 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* gallery teaser */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(18px,5vw,48px) clamp(48px,8vw,90px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 42 }}>
          <h2 style={{ fontSize: 'clamp(26px,3.6vw,34px)', fontWeight: 800, letterSpacing: '-0.01em' }}>See what people are creating</h2>
          <p style={{ color: 'var(--app-text-2)', fontSize: 17, marginTop: 8 }}>Real spaces, real moods.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          {GALLERY_TEASER.map(g => (
            <Link
              key={g.title + g.who}
              href="/gallery"
              style={{ borderRadius: 'var(--r-card)', overflow: 'hidden', border: '1px solid var(--app-border)', background: '#fff', boxShadow: 'var(--shadow-soft)', textDecoration: 'none', display: 'block', transition: 'var(--t)' }}
            >
              <div style={{ height: 170, position: 'relative' }}>
                <MiniSpace palette={g.palette} title={g.title} goals={['focus', 'make', 'rest']} style={{ height: '100%' }} />
              </div>
              <div style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{g.title}</span>
                <span style={{ fontSize: 13, color: 'var(--app-text-2)' }}>{g.who}</span>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <Link href="/gallery" className="btn btn-secondary">Explore the gallery →</Link>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" style={{ background: 'var(--app-bg-2)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(48px,8vw,90px) clamp(18px,5vw,48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 42 }}>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,34px)', fontWeight: 800, letterSpacing: '-0.01em' }}>Simple pricing</h2>
            <p style={{ color: 'var(--app-text-2)', fontSize: 17, marginTop: 8 }}>Start free. Upgrade when you're ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 760, margin: '0 auto' }}>
            {/* free */}
            <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 20, padding: 30, boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Free</div>
              <div style={{ fontSize: 36, fontWeight: 800, margin: '6px 0 18px' }}>$0</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
                {['3 trial credits', '1 space', 'Pre-built templates', 'Edit & share'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--app-text-2)' }}>
                    <Check size={18} style={{ color: 'var(--app-success)', flexShrink: 0, marginTop: 2 }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-secondary btn-block">Get started free</Link>
            </div>
            {/* pro */}
            <div style={{ background: '#fff', border: '2px solid var(--app-accent)', borderRadius: 20, padding: 30, boxShadow: 'var(--shadow-card)', position: 'relative' }}>
              <span className="badge" style={{ position: 'absolute', top: -12, right: 24 }}>Most loved</span>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Subscriber</div>
              <div style={{ fontSize: 36, fontWeight: 800, margin: '6px 0 18px' }}>
                $15<span style={{ fontSize: 15, color: 'var(--app-text-2)', fontWeight: 600 }}> / month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
                {['20 credits / month, rolls over', 'Up to 5 spaces', 'AI generation + journaling prompts', 'Gallery listing + OG share cards'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--app-text-2)' }}>
                    <Check size={18} style={{ color: 'var(--app-success)', flexShrink: 0, marginTop: 2 }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary btn-block">Subscribe</Link>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer style={{ borderTop: '1px solid var(--app-border)', padding: '40px clamp(18px,5vw,48px)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', color: 'var(--app-text-2)', fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800 }}>Spaceful</span>
            <span style={{ color: 'var(--app-text-muted)' }}>© 2026</span>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <Link href="/gallery">Gallery</Link>
            <a href="#pricing">Pricing</a>
            <a href="#">Privacy</a>
            <a href="#">Twitter</a>
          </div>
        </div>
      </footer>
    </>
  );
}
