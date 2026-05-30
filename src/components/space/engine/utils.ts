import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';
import type { SpacePalette } from '../SpacePage';
import type { TemplateSpec, TemplateSpecOverride } from './types';

const CORE_SECTIONS = ['goals', 'currently', 'focus_hero', 'notepad', 'kanban', 'habit_tracker', 'reading_list', 'photo', 'quote'] as const;

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
    scene: base.scene || override.scene ? { ...base.scene, ...override.scene } as TemplateSpec['scene'] : undefined,
    cards: { ...base.cards, ...override.cards },
    typography: { ...base.typography, ...override.typography },
  };
}

export const BASE_TEMPLATE_SPECS: Record<string, TemplateSpec> = {
  garden: {
    version: 1,
    layout: { header_style: 'botanical', sections: [...CORE_SECTIONS], max_width: 980, density: 'rich' },
    decoration: { type: 'botanicals', density: 'lush', animated: true, fixed_background: true },
    scene: { image: '/templates/garden-anime.jpg', position: 'right', overlay: 'light' },
    cards: { style: 'glass', radius: 20, shadow: 'soft' },
    typography: { title_scale: 'xl', weight: 800, header_uppercase: false },
  },
  'laki-world': {
    version: 1,
    layout: { header_style: 'botanical', sections: [...CORE_SECTIONS], max_width: 1100, density: 'rich' },
    decoration: { type: 'botanicals', density: 'lush', animated: true, fixed_background: true },
    scene: { image: '/templates/laki-world-anime.jpg', position: 'right', overlay: 'light' },
    cards: { style: 'glass', radius: 20, shadow: 'medium' },
    typography: { title_scale: 'xl', weight: 800, header_uppercase: false },
  },
  cosmos: {
    version: 1,
    layout: { header_style: 'cosmic', sections: [...CORE_SECTIONS], max_width: 980, density: 'balanced' },
    decoration: { type: 'starfield', density: 'medium', animated: true, fixed_background: true },
    scene: { image: '/templates/cosmos-anime.jpg', position: 'right', overlay: 'dark' },
    cards: { style: 'glass', radius: 20, shadow: 'medium' },
    typography: { title_scale: '2xl', weight: 800, header_uppercase: false },
  },
  sky: {
    version: 1,
    layout: { header_style: 'minimal', sections: [...CORE_SECTIONS], max_width: 980, density: 'balanced' },
    decoration: { type: 'clouds', density: 'medium', animated: true, fixed_background: true },
    scene: { image: '/templates/sky-anime.jpg', position: 'right', overlay: 'light' },
    cards: { style: 'solid', radius: 20, shadow: 'soft' },
    typography: { title_scale: 'xl', weight: 800, header_uppercase: false },
  },
  ocean: {
    version: 1,
    layout: { header_style: 'wave', sections: [...CORE_SECTIONS], max_width: 980, density: 'rich' },
    decoration: { type: 'waves', density: 'lush', animated: true, fixed_background: true },
    scene: { image: '/templates/ocean-anime.jpg', position: 'right', overlay: 'medium' },
    cards: { style: 'glass', radius: 20, shadow: 'soft' },
    typography: { title_scale: 'xl', weight: 800, header_uppercase: false },
  },
  journal: {
    version: 1,
    layout: { header_style: 'editorial', sections: [...CORE_SECTIONS], max_width: 860, density: 'spacious' },
    decoration: { type: 'minimal', density: 'minimal', animated: false, fixed_background: false },
    scene: { image: '/templates/journal-anime.jpg', position: 'right', overlay: 'light' },
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
