import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';
import type { SpacePalette } from '../SpacePage';
import type { TemplateSpec, TemplateSpecOverride } from './types';

export function hexA(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function isDarkMood(mood: SpaceMood): boolean {
  return mood === 'forest' || mood === 'midnight';
}

export function mergeSpec(base: TemplateSpec, override?: TemplateSpecOverride): TemplateSpec {
  if (!override) return base;
  return {
    version: 1,
    layout: { ...base.layout, ...override.layout },
    decoration: { ...base.decoration, ...override.decoration },
    cards: { ...base.cards, ...override.cards },
    typography: { ...base.typography, ...override.typography },
  };
}

export const BASE_TEMPLATE_SPECS: Record<string, TemplateSpec> = {
  garden: {
    version: 1,
    layout: { header_style: 'botanical', sections: ['goals', 'currently', 'focus_hero', 'notepad', 'kanban'], max_width: 980, density: 'rich' },
    decoration: { type: 'botanicals', density: 'lush', animated: true, fixed_background: true },
    cards: { style: 'glass', radius: 20, shadow: 'soft' },
    typography: { title_scale: 'xl', weight: 800, header_uppercase: false },
  },
  cosmos: {
    version: 1,
    layout: { header_style: 'cosmic', sections: ['goals', 'currently', 'focus_hero', 'notepad', 'streak'], max_width: 980, density: 'balanced' },
    decoration: { type: 'starfield', density: 'medium', animated: true, fixed_background: true },
    cards: { style: 'glass', radius: 20, shadow: 'medium' },
    typography: { title_scale: '2xl', weight: 800, header_uppercase: false },
  },
  journal: {
    version: 1,
    layout: { header_style: 'editorial', sections: ['goals', 'currently', 'focus_hero', 'notepad', 'quote'], max_width: 860, density: 'spacious' },
    decoration: { type: 'minimal', density: 'minimal', animated: false, fixed_background: false },
    cards: { style: 'paper', radius: 16, shadow: 'soft' },
    typography: { title_scale: 'display', weight: 800, header_uppercase: false },
  },
};

export function resolveSpec(templateId?: string, override?: TemplateSpecOverride): TemplateSpec {
  return mergeSpec(BASE_TEMPLATE_SPECS[templateId ?? 'garden'] ?? BASE_TEMPLATE_SPECS.garden, override);
}

export function paletteFor(mood: SpaceMood, palette?: SpacePalette): SpacePalette {
  return palette ?? SPACE_PALETTES[mood];
}

