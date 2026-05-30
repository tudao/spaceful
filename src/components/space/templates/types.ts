import type { SpaceContent, SpacePalette } from '../SpacePage';
import type { SpaceMood } from '@/lib/utils';

export interface DesignTokens {
  mood: SpaceMood;
  layout_variant: 'spacious' | 'rich';
  animation_level: 'none' | 'subtle' | 'full';
  template_id?: string;
  palette: SpacePalette;
  tagline?: string;
  hero_title_placeholder?: string;
  notepad_starter?: string;
  currently_placeholder?: string;
}

export interface TemplateProps {
  content: SpaceContent;
  tokens: DesignTokens;
  isOwner: boolean;
  mode: 'editing' | 'preview';
  onUpdate: (patch: Partial<SpaceContent>) => void;
  onSave: (c: SpaceContent) => Promise<unknown>;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  /** Which moods this template looks best with */
  moodAffinity: SpaceMood[];
  /** Which vibes lean toward this template */
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

/** Pick the best template for this mood + vibes combination */
export function pickTemplate(mood: SpaceMood, vibes: string[]): string {
  const scores: Record<string, number> = {};
  for (const t of TEMPLATES) {
    scores[t.id] = 0;
    if (t.moodAffinity.includes(mood)) scores[t.id] += 3;
    for (const v of vibes) {
      if (t.vibeKeywords.includes(v.toLowerCase())) scores[t.id] += 2;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'garden';
}
