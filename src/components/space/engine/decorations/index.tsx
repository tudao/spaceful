import type { DecorationId, DecorationProps } from '../types';
import { hexA } from '../utils';

function BotanicalDecoration({ palette, spec }: DecorationProps) {
  const count = spec.decoration.density === 'lush' ? 18 : spec.decoration.density === 'medium' ? 11 : 6;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '46%', opacity: 0.28 }}>
        {Array.from({ length: spec.decoration.density === 'lush' ? 10 : 6 }).map((_, i) => {
          const x = i * 11 - 5;
          return (
            <g key={i} style={{ transformOrigin: `${x + 6}% 100%`, animation: spec.decoration.animated ? `sp-tree-sway ${5 + (i % 4)}s ease-in-out infinite alternate` : undefined }}>
              <path d={`M${x + 5},100 C${x + 6},78 ${x + 5},58 ${x + 7},34`} stroke={hexA(palette.accent, 0.55)} strokeWidth="0.7" fill="none" />
              <ellipse cx={x + 5} cy="44" rx="5" ry="13" fill={hexA(palette.accent, 0.18)} />
              <ellipse cx={x + 10} cy="38" rx="6" ry="15" fill={hexA(palette.accent2, 0.16)} />
              <ellipse cx={x + 2} cy="34" rx="4" ry="12" fill={hexA(palette.accent, 0.14)} />
            </g>
          );
        })}
      </svg>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${(i * 13) % 96}%`,
          top: `${8 + ((i * 17) % 82)}%`,
          width: 58 + (i % 4) * 22,
          height: 160 + (i % 5) * 22,
          borderLeft: `2px solid ${hexA(palette.accent, 0.24)}`,
          borderRadius: '50%',
          transform: `rotate(${-18 + (i % 8) * 6}deg)`,
          opacity: 0.55,
          animation: spec.decoration.animated ? `sp-sway ${5 + (i % 4)}s ease-in-out infinite alternate` : undefined,
        }}>
          <span style={{
            position: 'absolute',
            top: 18 + (i % 6) * 14,
            left: -7,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: i % 2 ? palette.accent2 : palette.accent,
            boxShadow: `0 0 24px ${palette.glow}`,
          }} />
        </span>
      ))}
      {Array.from({ length: spec.decoration.density === 'lush' ? 14 : 8 }).map((_, i) => (
        <span key={`petal-${i}`} style={{
          position: 'absolute',
          left: `${(i * 19) % 100}%`,
          top: `${16 + (i * 11) % 52}%`,
          width: 8,
          height: 5,
          borderRadius: '70% 40% 70% 40%',
          background: hexA(i % 2 ? palette.accent2 : palette.accent, 0.45),
          animation: spec.decoration.animated ? `sp-petal ${8 + (i % 5)}s ease-in-out ${-(i % 7)}s infinite` : undefined,
        }} />
      ))}
    </div>
  );
}

function StarfieldDecoration({ palette, spec }: DecorationProps) {
  const count = spec.decoration.density === 'lush' ? 90 : spec.decoration.density === 'medium' ? 58 : 28;
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} cx={(i * 137.5) % 100} cy={(i * 97.3) % 94} r={0.18 + (i % 4) * 0.18} fill={i % 8 === 0 ? palette.accent2 : '#fff'} opacity={0.25 + (i % 4) * 0.12}>
          {spec.decoration.animated && <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${2.2 + (i % 4) * 0.7}s`} repeatCount="indefinite" />}
        </circle>
      ))}
      {[[12, 22, 34, 38], [34, 38, 58, 24], [58, 24, 75, 44], [75, 44, 91, 30], [38, 64, 58, 24]].map(([x1, y1, x2, y2], i) => (
        <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.accent2} strokeWidth="0.11" opacity="0.22" />
      ))}
    </svg>
  );
}

function AuroraDecoration({ palette, spec }: DecorationProps) {
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: `${8 + i * 9}%`,
          left: '-10%',
          width: '120%',
          height: '34%',
          background: `linear-gradient(100deg, transparent, ${hexA(i === 1 ? palette.accent2 : palette.accent, 0.22)}, transparent)`,
          filter: 'blur(24px)',
          transform: `rotate(${-8 + i * 6}deg)`,
          animation: spec.decoration.animated ? `sp-drift ${10 + i * 4}s ease-in-out infinite alternate` : undefined,
        }} />
      ))}
    </div>
  );
}

function GeometricDecoration({ palette, spec }: DecorationProps) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.5 }}>
      {Array.from({ length: spec.decoration.density === 'lush' ? 34 : 20 }).map((_, i) => {
        const x = (i * 19) % 100;
        const y = (i * 31) % 100;
        return <polygon key={i} points={`${x},${y} ${x + 18},${y + 6} ${x + 7},${y + 20}`} fill={i % 2 ? hexA(palette.accent, 0.09) : hexA(palette.accent2, 0.12)} stroke={hexA(palette.accent, 0.08)} strokeWidth="0.12" />;
      })}
    </svg>
  );
}

function DunesDecoration({ palette, spec }: DecorationProps) {
  const particleCount = spec.decoration.density === 'lush' ? 32 : spec.decoration.density === 'medium' ? 18 : 0;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* sun orb */}
      <div style={{
        position: 'absolute', right: '11%', top: '7%',
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle at 38% 38%, ${hexA(palette.accent2, 0.88)}, ${hexA(palette.accent, 0.48)} 52%, transparent 72%)`,
        filter: 'blur(6px)',
        animation: spec.decoration.animated ? `sp-drift 22s ease-in-out infinite alternate` : undefined,
      }} />
      {/* dune ridge layers */}
      {[0, 1, 2].map(i => (
        <svg key={i} viewBox="0 0 1000 320" preserveAspectRatio="none" style={{
          position: 'absolute', bottom: `${-18 + i * 13}%`, left: 0, width: '100%', height: '52%',
          animation: spec.decoration.animated ? `sp-drift ${16 + i * 6}s ease-in-out infinite alternate` : undefined,
        }}>
          <path
            d={`M0 ${210 - i * 22} C180 ${95 + i * 28} 380 ${250 - i * 38} 580 ${155 + i * 18} C740 ${88 + i * 22} 860 ${228 - i * 28} 1000 ${185 + i * 12} L1000 320 L0 320Z`}
            fill={hexA(i === 1 ? palette.accent2 : palette.accent, 0.09 + i * 0.04)}
          />
        </svg>
      ))}
      {/* sand particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${(i * 19) % 100}%`,
          bottom: `${4 + (i * 13) % 28}%`,
          width: 2 + (i % 3), height: 2 + (i % 3),
          borderRadius: '50%',
          background: hexA(palette.accent, 0.28 + (i % 4) * 0.08),
          animation: spec.decoration.animated ? `sp-drift ${3 + (i % 5)}s ease-in-out ${-(i * 0.6)}s infinite alternate` : undefined,
        }} />
      ))}
    </div>
  );
}

function RainDecoration({ palette, spec }: DecorationProps) {
  const count = spec.decoration.density === 'lush' ? 64 : spec.decoration.density === 'medium' ? 38 : 20;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* subtle dark wash for moody feel */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${hexA(palette.bg, 0.14)}, transparent 50%)` }} />
      {/* rain streaks */}
      {Array.from({ length: count }).map((_, i) => {
        const len = 14 + (i % 5) * 6;
        const speed = 0.55 + (i % 7) * 0.14;
        const delay = -((i * 0.23) % speed);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 11.3) % 100}%`,
            top: `${-8 - (i % 3) * 5}%`,
            width: 1.5,
            height: len,
            background: `linear-gradient(180deg, transparent, ${hexA(i % 4 === 0 ? palette.accent2 : palette.accent, 0.38)})`,
            borderRadius: 1,
            transform: 'rotate(12deg)',
            animation: spec.decoration.animated ? `sp-rain ${speed}s linear ${delay}s infinite` : undefined,
          }} />
        );
      })}
      {/* puddle ripples at bottom */}
      {spec.decoration.density !== 'minimal' && [0, 1, 2, 3].map(i => (
        <div key={`ripple-${i}`} style={{
          position: 'absolute',
          bottom: `${2 + (i * 7) % 12}%`,
          left: `${10 + (i * 23) % 72}%`,
          width: 28 + i * 14,
          height: 8 + i * 4,
          borderRadius: '50%',
          border: `1px solid ${hexA(palette.accent, 0.18)}`,
          animation: spec.decoration.animated ? `sp-ripple ${1.8 + i * 0.6}s ease-out ${-(i * 0.7)}s infinite` : undefined,
        }} />
      ))}
    </div>
  );
}

function MinimalDecoration() {
  return null;
}

function WavesDecoration({ palette, spec }: DecorationProps) {
  const fishCount = spec.decoration.density === 'lush' ? 12 : 7;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          left: '-10%',
          right: '-10%',
          bottom: `${-10 + i * 7}%`,
          height: 120,
          borderRadius: '50% 50% 0 0',
          background: hexA(i === 1 ? palette.accent2 : palette.accent, 0.10 + i * 0.03),
          animation: spec.decoration.animated ? `sp-drift ${8 + i * 2}s ease-in-out infinite alternate` : undefined,
        }} />
      ))}
      {Array.from({ length: fishCount }).map((_, i) => (
        <svg key={`fish-${i}`} viewBox="0 0 48 20" style={{
          position: 'absolute',
          width: 38 + (i % 3) * 12,
          height: 20,
          left: `${-18 - (i % 4) * 10}%`,
          top: `${38 + (i * 7) % 42}%`,
          color: i % 2 ? palette.accent : palette.accent2,
          opacity: 0.24 + (i % 3) * 0.08,
          animation: spec.decoration.animated ? `sp-fish ${20 + (i % 5) * 4}s linear ${-(i * 3)}s infinite` : undefined,
        }}>
          <path d="M5 10 L14 4 L14 16 Z" fill="currentColor" opacity=".78" />
          <path d="M12 10 C21 1 39 3 45 10 C39 17 21 19 12 10Z" fill="currentColor" />
          <path d="M22 6 C26 9 26 11 22 15" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="38.5" cy="8" r="1.25" fill="rgba(255,255,255,.86)" />
          <circle cx="39" cy="8" r=".45" fill="rgba(20,35,52,.45)" />
        </svg>
      ))}
      {Array.from({ length: spec.decoration.density === 'lush' ? 22 : 12 }).map((_, i) => (
        <span key={`bubble-${i}`} style={{
          position: 'absolute',
          left: `${(i * 17) % 98}%`,
          bottom: `${-4 + (i % 4) * 2}%`,
          width: 4 + (i % 4) * 3,
          height: 4 + (i % 4) * 3,
          borderRadius: '50%',
          border: `1px solid ${hexA('#ffffff', 0.38)}`,
          opacity: 0.25,
          animation: spec.decoration.animated ? `sp-bubble ${9 + (i % 6) * 1.8}s ease-in ${-(i % 7)}s infinite` : undefined,
        }} />
      ))}
    </div>
  );
}

function CloudsDecoration({ palette, spec }: DecorationProps) {
  const count = spec.decoration.density === 'lush' ? 9 : spec.decoration.density === 'medium' ? 6 : 3;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={`cloud-${i}`} viewBox="0 0 180 70" style={{
          position: 'absolute',
          left: `${-26 + (i * 23) % 132}%`,
          top: `${7 + (i * 13) % 42}%`,
          width: 134 + (i % 3) * 54,
          height: 54 + (i % 3) * 15,
          opacity: 0.44 + (i % 3) * 0.08,
          filter: 'drop-shadow(0 16px 22px rgba(87,124,160,.12))',
          animation: spec.decoration.animated ? `sp-cloud ${24 + (i % 4) * 7}s linear ${-(i * 5)}s infinite` : undefined,
        }}>
          <path
            d="M45 55H137C158 55 171 45 171 32C171 20 160 11 145 12C140 5 129 1 117 5C108 -2 91 0 83 11C72 8 60 12 55 22C42 21 31 29 31 40C31 49 37 55 45 55Z"
            fill="rgba(255,255,255,.78)"
          />
          <path
            d="M51 55H139C153 55 165 49 169 39C156 45 135 47 103 45C77 44 52 47 36 39C36 48 42 55 51 55Z"
            fill={hexA(palette.accent2, 0.16)}
          />
        </svg>
      ))}
      {Array.from({ length: spec.decoration.density === 'lush' ? 10 : 6 }).map((_, i) => (
        <svg key={`bird-${i}`} viewBox="0 0 28 12" style={{
          position: 'absolute',
          left: '-8%',
          top: `${12 + (i * 9) % 38}%`,
          width: 24 + (i % 3) * 8,
          height: 12,
          color: hexA(palette.text2, 0.34),
          animation: spec.decoration.animated ? `sp-bird ${16 + (i % 5) * 4}s linear ${-(i * 3)}s infinite` : undefined,
        }}>
          <path d="M2 8 Q7 2 14 8 Q21 2 26 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}

export const DECORATIONS: Record<DecorationId, React.ComponentType<DecorationProps>> = {
  botanicals: BotanicalDecoration,
  starfield: StarfieldDecoration,
  waves: WavesDecoration,
  dunes: DunesDecoration,
  petals: BotanicalDecoration,
  forest: BotanicalDecoration,
  aurora: AuroraDecoration,
  geometric: GeometricDecoration,
  rain: RainDecoration,
  smoke: AuroraDecoration,
  minimal: MinimalDecoration,
  clouds: CloudsDecoration,
};
