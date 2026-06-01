import type { TemplateSpec } from './types';
import type { SpacePalette } from '../SpacePage';
import { hexA, isDarkMood } from './utils';
import type { SpaceMood } from '@/lib/utils';
import type { CSSProperties } from 'react';

export function cardStyle(spec: TemplateSpec, palette: SpacePalette, mood: SpaceMood): CSSProperties {
  const isDark = isDarkMood(mood);
  const border = `1px solid ${hexA(palette.accent, spec.cards.style === 'outlined' ? 0.52 : 0.26)}`;
  const shadows = {
    none: 'none',
    soft: `0 8px 28px ${hexA(palette.accent, 0.10)}`,
    medium: `0 14px 42px ${hexA(palette.accent, 0.16)}`,
    dramatic: `0 22px 60px ${hexA(palette.accent, 0.24)}`,
  };
  const backgrounds = {
    glass: isDark ? hexA(palette.surface, 0.42) : 'rgba(255,255,255,0.68)',
    solid: palette.surface,
    outlined: 'transparent',
    paper: isDark ? hexA(palette.surface, 0.74) : 'rgba(255,255,255,0.78)',
  };

  return {
    background: backgrounds[spec.cards.style],
    border,
    borderRadius: spec.cards.radius,
    boxShadow: shadows[spec.cards.shadow],
    backdropFilter: spec.cards.style === 'glass' ? 'blur(12px)' : undefined,
  };
}
