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

function MinimalDecoration() {
  return null;
}

function WavesDecoration({ palette, spec }: DecorationProps) {
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
      {Array.from({ length: spec.decoration.density === 'lush' ? 11 : 6 }).map((_, i) => (
        <svg key={`fish-${i}`} viewBox="0 0 42 18" style={{
          position: 'absolute',
          width: 34 + (i % 3) * 10,
          height: 18,
          left: '-8%',
          top: `${38 + (i * 7) % 42}%`,
          color: i % 2 ? palette.accent : palette.accent2,
          opacity: 0.22 + (i % 3) * 0.08,
          animation: spec.decoration.animated ? `sp-fish ${18 + (i % 5) * 3}s linear ${-(i * 2)}s infinite` : undefined,
        }}>
          <path d="M3 9 C10 2 25 2 34 9 C25 16 10 16 3 9Z" fill="currentColor" />
          <path d="M34 9 L41 4 L41 14Z" fill="currentColor" />
          <circle cx="12" cy="7" r="1.2" fill="rgba(255,255,255,.8)" />
        </svg>
      ))}
    </div>
  );
}

function CloudsDecoration({ palette, spec }: DecorationProps) {
  const count = spec.decoration.density === 'lush' ? 9 : spec.decoration.density === 'medium' ? 6 : 3;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`cloud-${i}`} style={{
          position: 'absolute',
          left: `${-18 + (i * 23) % 120}%`,
          top: `${7 + (i * 13) % 42}%`,
          width: 110 + (i % 3) * 44,
          height: 42 + (i % 3) * 12,
          borderRadius: 999,
          background: `linear-gradient(135deg, rgba(255,255,255,.74), ${hexA(palette.accent2, 0.18)})`,
          boxShadow: `28px 4px 0 ${hexA('#ffffff', 0.58)}, 58px 10px 0 ${hexA(palette.accent2, 0.13)}`,
          filter: 'blur(.2px)',
          opacity: 0.52,
          animation: spec.decoration.animated ? `sp-cloud ${24 + (i % 4) * 7}s linear ${-(i * 5)}s infinite` : undefined,
        }} />
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
  dunes: WavesDecoration,
  petals: BotanicalDecoration,
  forest: BotanicalDecoration,
  aurora: AuroraDecoration,
  geometric: GeometricDecoration,
  rain: StarfieldDecoration,
  smoke: AuroraDecoration,
  minimal: MinimalDecoration,
  clouds: CloudsDecoration,
};
