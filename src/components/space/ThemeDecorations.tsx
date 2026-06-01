'use client';

import type { SpaceMood } from '@/lib/utils';

interface Props { mood: SpaceMood; accent: string; accent2: string; }

export function ThemeDecorations({ mood, accent, accent2 }: Props) {
  switch (mood) {
    case 'lavender': return <LavenderDecorations accent={accent} accent2={accent2} />;
    case 'forest':   return <ForestDecorations   accent={accent} accent2={accent2} />;
    case 'midnight': return <MidnightDecorations accent={accent} accent2={accent2} />;
    case 'ocean':    return <OceanDecorations     accent={accent} accent2={accent2} />;
    case 'sand':     return <SandDecorations      accent={accent} accent2={accent2} />;
    case 'rose':     return <RoseDecorations      accent={accent} accent2={accent2} />;
    default:         return null;
  }
}

// ── Lavender: floating botanical / flower petals ──────────────────────────────
function LavenderDecorations({ accent, accent2 }: { accent: string; accent2: string }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <style>{`
        @keyframes sway1{0%,100%{transform:rotate(-3deg) translateX(-1px)}50%{transform:rotate(5deg) translateX(2px)}}
        @keyframes sway2{0%,100%{transform:rotate(4deg) translateX(1px)}50%{transform:rotate(-5deg) translateX(-2px)}}
        @keyframes drift{0%{transform:translateX(0) translateY(0) rotate(0deg)}100%{transform:translateX(160px) translateY(60px) rotate(180deg)}}
        .lav-s1{transform-origin:50px 120px;animation:sway1 3.4s ease-in-out infinite}
        .lav-s2{transform-origin:80px 120px;animation:sway2 2.9s ease-in-out infinite .2s}
        .lav-s3{transform-origin:110px 120px;animation:sway1 3.8s ease-in-out infinite .4s}
        .petal{position:absolute;border-radius:50% 0 50% 0;opacity:0.35;animation:drift 18s linear infinite}
      `}</style>
      {/* floating petals */}
      {[
        { top:'8%',  left:'5%',  w:10, h:16, color: accent,  delay:'0s',   dur:'20s' },
        { top:'25%', left:'92%', w:8,  h:12, color: accent2, delay:'5s',   dur:'17s' },
        { top:'60%', left:'3%',  w:12, h:18, color: accent,  delay:'10s',  dur:'22s' },
        { top:'15%', left:'78%', w:6,  h:10, color: accent2, delay:'3s',   dur:'25s' },
        { top:'70%', left:'88%', w:9,  h:14, color: accent,  delay:'7s',   dur:'19s' },
      ].map((p, i) => (
        <div key={i} className="petal" style={{ top: p.top, left: p.left, width: p.w, height: p.h, background: p.color, animationDelay: p.delay, animationDuration: p.dur }} />
      ))}
      {/* botanical stems bottom-left */}
      <svg style={{ position:'absolute', bottom:0, left:24, width:130, height:140 }} viewBox="0 0 130 140">
        <g className="lav-s1">
          <path d="M40 138 C36 100 40 62 45 24" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M41 82 C20 68 22 52 45 64" fill={accent2} opacity=".7"/>
          <path d="M43 55 C63 42 67 61 45 72" fill={accent} opacity=".6"/>
          <ellipse cx="45" cy="22" rx="7" ry="14" fill={accent2} opacity=".8"/>
          <ellipse cx="56" cy="30" rx="7" ry="14" fill={accent} opacity=".65" transform="rotate(62 56 30)"/>
          <ellipse cx="34" cy="30" rx="7" ry="14" fill={accent2} opacity=".75" transform="rotate(-62 34 30)"/>
          <circle cx="45" cy="21" r="5" fill="#F9D6B0" opacity=".9"/>
        </g>
        <g className="lav-s2" style={{ transformOrigin:'80px 120px' }}>
          <path d="M78 138 C73 95 79 56 83 18" stroke={accent2} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M78 90 C56 76 60 58 82 70" fill={accent} opacity=".6"/>
          <ellipse cx="83" cy="16" rx="6" ry="12" fill={accent} opacity=".8"/>
          <ellipse cx="93" cy="24" rx="6" ry="12" fill={accent2} opacity=".65" transform="rotate(62 93 24)"/>
          <circle cx="83" cy="15" r="4.5" fill="#F4A89A" opacity=".85"/>
        </g>
        <g className="lav-s3">
          <path d="M112 138 C116 100 108 68 113 32" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M112 78 C94 66 96 54 112 64" fill={accent2} opacity=".55"/>
          <circle cx="113" cy="30" r="10" fill={accent2} opacity=".4"/>
          <circle cx="113" cy="30" r="5" fill="#F9D6B0" opacity=".7"/>
        </g>
      </svg>
      {/* wind grass line */}
      <svg style={{ position:'absolute', bottom:0, left:0, right:0, width:'100%', height:24 }} viewBox="0 0 1200 24" preserveAspectRatio="none">
        <path d="M0 20 C150 8 300 20 450 10 S750 20 1000 8 S1150 18 1200 12" stroke={accent} strokeWidth="12" fill="none" opacity=".12" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ── Forest: tree silhouettes, leaf rain ───────────────────────────────────────
function ForestDecorations({ accent, accent2 }: { accent: string; accent2: string }) {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <style>{`
        @keyframes leaffall{0%{transform:translateY(-10px) rotate(0deg);opacity:0}10%{opacity:0.7}90%{opacity:0.4}100%{transform:translateY(280px) rotate(360deg);opacity:0}}
        .leaf{position:absolute;border-radius:50% 0;animation:leaffall linear infinite}
      `}</style>
      {/* falling leaves */}
      {[
        { left:'10%', w:8,  h:12, delay:'0s',  dur:'8s'  },
        { left:'30%', w:6,  h:9,  delay:'2s',  dur:'11s' },
        { left:'55%', w:10, h:15, delay:'5s',  dur:'9s'  },
        { left:'75%', w:7,  h:11, delay:'1s',  dur:'12s' },
        { left:'88%', w:9,  h:13, delay:'4s',  dur:'10s' },
        { left:'45%', w:5,  h:8,  delay:'7s',  dur:'8s'  },
      ].map((l, i) => (
        <div key={i} className="leaf" style={{ left: l.left, top: '-20px', width: l.w, height: l.h, background: accent, animationDelay: l.delay, animationDuration: l.dur }} />
      ))}
      {/* tree silhouettes */}
      <svg style={{ position:'absolute', bottom:0, right:24, width:180, height:200, opacity:0.18 }} viewBox="0 0 180 200">
        <path d="M90 200 L90 100 M90 100 L50 60 M90 100 L130 60 M90 80 L60 40 M90 80 L120 40 M90 60 L75 20 M90 60 L105 20" stroke={accent2} strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M50 60 C30 40 20 70 50 60Z M130 60 C150 40 160 70 130 60Z M60 40 C42 24 34 52 60 40Z M120 40 C138 24 146 52 120 40Z M75 20 C62 8 56 30 75 20Z M105 20 C118 8 124 30 105 20Z" fill={accent} opacity=".7"/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, left:16, width:100, height:160, opacity:0.14 }} viewBox="0 0 100 160">
        <path d="M50 160 L50 80 M50 80 L22 44 M50 80 L78 44 M50 64 L32 28 M50 64 L68 28 M50 48 L38 10 M50 48 L62 10" stroke={accent} strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M22 44 C8 28 4 52 22 44Z M78 44 C92 28 96 52 78 44Z" fill={accent2} opacity=".6"/>
      </svg>
    </div>
  );
}

// ── Midnight: stars + constellation ──────────────────────────────────────────
function MidnightDecorations({ accent, accent2 }: { accent: string; accent2: string }) {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 137.5) % 100, y: (i * 97.3) % 85,
    r: 0.5 + (i % 3) * 0.7,
    delay: `${(i * 0.4) % 4}s`,
    dur: `${2.5 + (i % 3)}s`,
  }));
  const conLines = [[10,15,28,32],[28,32,55,20],[55,20,72,40],[72,40,88,22],[35,60,55,20],[72,40,90,62]];

  return (
    <div aria-hidden style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <style>{`@keyframes twinkle{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* constellation lines */}
        {conLines.map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent2} strokeWidth="0.15" opacity="0.25"/>
        ))}
        {/* stars */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 5 === 0 ? accent2 : '#fff'}
            style={{ animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite` }} opacity="0.6"/>
        ))}
      </svg>
      {/* glowing orb */}
      <div style={{ position:'absolute', top:'10%', right:'8%', width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${accent}40, transparent 70%)`, filter:'blur(20px)' }}/>
      <div style={{ position:'absolute', bottom:'20%', left:'5%', width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${accent2}30, transparent 70%)`, filter:'blur(16px)' }}/>
    </div>
  );
}

// ── Ocean: wave layers ─────────────────────────────────────────────────────────
function OceanDecorations({ accent, accent2 }: { accent: string; accent2: string }) {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <style>{`
        @keyframes wave1{0%,100%{transform:translateX(0)}50%{transform:translateX(-40px)}}
        @keyframes wave2{0%,100%{transform:translateX(0)}50%{transform:translateX(30px)}}
      `}</style>
      <svg style={{ position:'absolute', bottom:0, left:'-5%', width:'110%', height:80, opacity:0.14 }} viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0 50 C150 20 300 60 450 35 S750 55 950 28 S1100 50 1200 32 L1200 80 L0 80Z" fill={accent} style={{ animation:'wave1 6s ease-in-out infinite' }}/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, left:'-5%', width:'110%', height:60, opacity:0.1 }} viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 38 C200 14 380 48 560 26 S860 44 1100 20 L1200 60 L0 60Z" fill={accent2} style={{ animation:'wave2 8s ease-in-out infinite' }}/>
      </svg>
      {/* bubble-like circles */}
      {[{ x:'15%',y:'70%',s:6 },{ x:'60%',y:'80%',s:4 },{ x:'85%',y:'65%',s:8 },{ x:'40%',y:'75%',s:5 }].map((b,i)=>(
        <div key={i} style={{ position:'absolute', left:b.x, top:b.y, width:b.s, height:b.s, borderRadius:'50%', background:accent2, opacity:0.2 }}/>
      ))}
    </div>
  );
}

// ── Sand: minimal horizon + dunes ─────────────────────────────────────────────
function SandDecorations({ accent, accent2 }: { accent: string; accent2: string }) {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <svg style={{ position:'absolute', bottom:0, left:0, right:0, width:'100%', height:60, opacity:0.18 }} viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 42 C200 28 380 52 600 34 S900 46 1200 30 L1200 60 L0 60Z" fill={accent}/>
        <path d="M0 50 C300 36 550 56 800 40 S1050 52 1200 44 L1200 60 L0 60Z" fill={accent2} opacity=".6"/>
      </svg>
      {/* sun/moon orb top right */}
      <div style={{ position:'absolute', top:16, right:20, width:48, height:48, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, ${accent2}, ${accent})`, opacity:0.22, boxShadow:`0 0 24px ${accent}44` }}/>
    </div>
  );
}

// ── Rose: soft petal scatter ───────────────────────────────────────────────────
function RoseDecorations({ accent, accent2 }: { accent: string; accent2: string }) {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <style>{`
        @keyframes petalFloat{0%{transform:translateY(0) rotate(0deg);opacity:0.6}50%{transform:translateY(-12px) rotate(12deg);opacity:0.4}100%{transform:translateY(0) rotate(0deg);opacity:0.6}}
      `}</style>
      {/* rose petals */}
      {[
        { left:'8%',  top:'60%', s:18, delay:'0s'  },
        { left:'22%', top:'20%', s:14, delay:'1.5s' },
        { left:'72%', top:'15%', s:20, delay:'0.8s' },
        { left:'88%', top:'55%', s:16, delay:'2.2s' },
        { left:'50%', top:'75%', s:12, delay:'3s'   },
      ].map((p, i) => (
        <svg key={i} style={{ position:'absolute', left:p.left, top:p.top, width:p.s, height:p.s, opacity:0.22, animation:`petalFloat 4s ${p.delay} ease-in-out infinite` }} viewBox="0 0 24 24">
          <path d="M12 2 C6 2 2 8 2 12 C2 18 12 22 12 22 C12 22 22 18 22 12 C22 8 18 2 12 2Z" fill={i % 2 === 0 ? accent : accent2}/>
          <path d="M12 2 C12 8 8 12 12 22 C16 12 12 8 12 2Z" fill="rgba(255,255,255,0.3)"/>
        </svg>
      ))}
      {/* radial glow center */}
      <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, ${accent}18, transparent 70%)`, pointerEvents:'none' }}/>
    </div>
  );
}
