import type { SpaceMood } from '@/lib/utils';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  moodAffinity: SpaceMood[];
  vibeKeywords: string[];
  domain?: string;
  companionArchetype?: string;
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
    id: 'laki-world',
    name: "Laki's World",
    description: 'Anime-inspired lavender garden world with denser spacing and stronger card presence',
    moodAffinity: ['lavender', 'rose', 'ocean'],
    vibeKeywords: ['playful', 'creative', 'focused', 'dreamy', 'energetic'],
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
  // Domain templates
  {
    id: 'founder',
    name: 'Founder',
    description: 'Startup-focused space with kanban, focus hero, daily pulse, and goals',
    moodAffinity: ['midnight', 'ocean', 'lavender'],
    vibeKeywords: ['focused', 'bold', 'energetic', 'minimal'],
    domain: 'Work',
    companionArchetype: 'coach',
  },
  {
    id: 'athlete',
    name: 'Athlete',
    description: 'Training-focused space with habit tracker, goals, streak, and daily pulse',
    moodAffinity: ['forest', 'ocean', 'sand'],
    vibeKeywords: ['energetic', 'focused', 'bold', 'grounded'],
    domain: 'Health',
    companionArchetype: 'challenger',
  },
  {
    id: 'student',
    name: 'Student',
    description: 'Learning-focused space with reading list, kanban, goals, and daily pulse',
    moodAffinity: ['lavender', 'sand', 'rose'],
    vibeKeywords: ['calm', 'focused', 'creative', 'grounded'],
    domain: 'Learning',
    companionArchetype: 'sage',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Creative space with notepad, photo, goals, and daily pulse for makers',
    moodAffinity: ['rose', 'lavender', 'sand'],
    vibeKeywords: ['creative', 'dreamy', 'playful', 'cozy'],
    domain: 'Creative',
    companionArchetype: 'poet',
  },
];

export function pickTemplate(mood: SpaceMood, vibes: string[]): string {
  // Domain templates are opt-in only — exclude from auto-pick
  const candidates = TEMPLATES.filter(t => !t.domain);
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
