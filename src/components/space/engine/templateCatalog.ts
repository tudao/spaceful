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
    description: 'Botanical header with animated stems and petals, warm glass cards',
    moodAffinity: ['lavender', 'rose', 'forest', 'sand'],
    vibeKeywords: ['dreamy', 'cozy', 'calm', 'creative', 'grounded', 'playful'],
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Dark starfield with glowing orbs, editorial typography',
    moodAffinity: ['midnight', 'ocean', 'forest'],
    vibeKeywords: ['bold', 'focused', 'minimal', 'energetic'],
  },
  {
    id: 'laki-world',
    name: "Laki's World",
    description: 'Dense personal dashboard with carousel goals, tabbed notes, habits, and media',
    moodAffinity: ['lavender', 'rose', 'ocean'],
    vibeKeywords: ['playful', 'creative', 'focused', 'dreamy', 'energetic'],
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Warm editorial with big title energy and ruled notepad',
    moodAffinity: ['sand', 'lavender', 'rose'],
    vibeKeywords: ['calm', 'creative', 'minimal', 'dreamy', 'grounded'],
  },
];

export function pickTemplate(mood: SpaceMood, vibes: string[]): string {
  const scores: Record<string, number> = {};
  for (const template of TEMPLATES) {
    scores[template.id] = 0;
    if (template.moodAffinity.includes(mood)) scores[template.id] += 3;
    for (const vibe of vibes) {
      if (template.vibeKeywords.includes(vibe.toLowerCase())) scores[template.id] += 2;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'garden';
}

