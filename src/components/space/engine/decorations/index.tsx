import type { DecorationId, DecorationProps } from '../types';
import { hexA } from '../utils';

function BotanicalDecoration({ palette, spec }: DecorationProps) {
  const count = spec.decoration.density === 'lush' ? 18 : spec.decoration.density === 'medium' ? 11 : 6;
  return (
    <div aria-hidden style={{ position: spec.decoration.fixed_background ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
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
  clouds: WavesDecoration,
};

