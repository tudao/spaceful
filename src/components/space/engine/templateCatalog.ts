import type { SpaceMood } from '@/lib/utils';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  moodAffinity: SpaceMood[];
  vibeKeywords: string[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'garden',
    name: 'Garden',
    description: 'Anime-inspired garden world with petals, fireflies, and warm glass cards',
    moodAffinity: ['lavender', 'rose', 'forest', 'sand'],
    vibeKeywords: ['dreamy', 'cozy', 'calm', 'creative', 'grounded', 'playful'],
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Anime-inspired cosmic world with stars, planets, and focused glass cards',
    moodAffinity: ['midnight', 'ocean', 'forest'],
    vibeKeywords: ['bold', 'focused', 'minimal', 'energetic'],
  },
  {
    id: 'sky',
    name: 'Sky',
    description: 'Anime-inspired sky island world with clouds and birds in motion',
    moodAffinity: ['ocean', 'lavender', 'sand'],
    vibeKeywords: ['calm', 'dreamy', 'minimal', 'playful', 'creative'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Anime-inspired underwater reef world with swimming fish and soft blue glass',
    moodAffinity: ['ocean', 'midnight', 'lavender'],
    vibeKeywords: ['calm', 'focused', 'grounded', 'creative', 'dreamy'],
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Warm anime-inspired study nook with big title energy and paper cards',
    moodAffinity: ['sand', 'lavender', 'rose'],
    vibeKeywords: ['calm', 'creative', 'minimal', 'dreamy', 'grounded'],
  },
];

export function pickTemplate(mood: SpaceMood, vibes: string[]): string {
  const candidates = TEMPLATES;
  const scores: Record<string, number> = {};
  for (const template of candidates) {
    scores[template.id] = 0;
    if (template.moodAffinity.includes(mood)) scores[template.id] += 3;
    for (const vibe of vibes) {
      if (template.vibeKeywords.includes(vibe.toLowerCase())) scores[template.id] += 2;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'garden';
}
