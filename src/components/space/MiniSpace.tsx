'use client';

import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';

interface MiniSpaceProps {
  palette: SpaceMood;
  title?: string;
  goals?: string[];
  style?: React.CSSProperties;
  className?: string;
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function MiniSpace({ palette, title = 'A Space', goals = ['goal', 'goal'], style, className }: MiniSpaceProps) {
  const p = SPACE_PALETTES[palette] ?? SPACE_PALETTES.lavender;
  const dark = palette === 'forest' || palette === 'midnight';

  const goalChips = goals.slice(0, 3).map((g, i) => (
    <span
      key={i}
      style={{
        display: 'inline-block', fontSize: 6.5, fontWeight: 700, padding: '2px 6px',
        borderRadius: 99, background: hexA(p.accent, 0.16), color: p.accent,
        border: `1px solid ${hexA(p.accent, 0.3)}`,
      }}
    >
      {g}
    </span>
  ));

  return (
    <div
      className={className}
      style={{
        position: 'relative', overflow: 'hidden', width: '100%', height: '100%',
        ...style,
      }}
    >
      {/* background gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 70% 10%, ${hexA(p.accent2, 0.25)}, transparent 55%), linear-gradient(160deg, ${p.bg}, ${p.bg2})`,
      }} />
      {/* content */}
      <div style={{
        position: 'relative', height: '100%', padding: '11px 12px',
        display: 'flex', flexDirection: 'column', gap: 7,
        fontFamily: "'Nunito', sans-serif",
      }}>
        {/* brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 13, height: 13, borderRadius: '50%',
            background: `linear-gradient(135deg, ${p.accent2}, ${p.accent})`,
          }} />
          <div style={{ fontSize: 9, fontWeight: 800, color: p.text }}>{title}</div>
        </div>
        {/* goal chips */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{goalChips}</div>
        {/* notepad placeholder */}
        <div style={{
          flex: 1, borderRadius: 7,
          background: dark ? hexA('#ffffff', 0.06) : hexA('#ffffff', 0.6),
          border: `1px solid ${hexA(p.accent, 0.18)}`,
          padding: '7px 8px', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ height: 4, width: '80%', borderRadius: 99, background: hexA(p.accent, 0.35) }} />
          <div style={{ height: 3, width: '95%', borderRadius: 99, background: hexA(p.text2, 0.3) }} />
          <div style={{ height: 3, width: '70%', borderRadius: 99, background: hexA(p.text2, 0.3) }} />
          <div style={{ height: 3, width: '88%', borderRadius: 99, background: hexA(p.text2, 0.22) }} />
        </div>
      </div>
    </div>
  );
}
