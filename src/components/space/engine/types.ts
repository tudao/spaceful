import type { SpaceContent, SpacePalette } from '../SpacePage';
import type { SpaceMood } from '@/lib/utils';
import type { CSSProperties } from 'react';

export const SECTION_IDS = [
  'goals',
  'currently',
  'focus_hero',
  'notepad',
  'kanban',
  'reading_list',
  'habit_tracker',
  'streak',
  'quote',
  'photo',
] as const;

export const DECORATION_IDS = [
  'botanicals',
  'starfield',
  'waves',
  'dunes',
  'petals',
  'forest',
  'aurora',
  'geometric',
  'rain',
  'smoke',
  'minimal',
  'clouds',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type DecorationId = (typeof DECORATION_IDS)[number];

export interface TemplateSpec {
  version: 1;
  layout: {
    header_style: 'botanical' | 'cosmic' | 'minimal' | 'editorial' | 'wave' | 'nature' | 'geometric' | 'aurora';
    sections: SectionId[];
    max_width: 860 | 980 | 1100;
    density: 'spacious' | 'balanced' | 'rich';
  };
  decoration: {
    type: DecorationId;
    density: 'minimal' | 'medium' | 'lush';
    animated: boolean;
    fixed_background: boolean;
  };
  cards: {
    style: 'glass' | 'solid' | 'outlined' | 'paper';
    radius: 8 | 12 | 16 | 20 | 24;
    shadow: 'none' | 'soft' | 'medium' | 'dramatic';
  };
  typography: {
    title_scale: 'lg' | 'xl' | '2xl' | 'display';
    weight: 700 | 800;
    header_uppercase: boolean;
  };
}

export type TemplateSpecOverride = Partial<{
  layout: Partial<TemplateSpec['layout']>;
  decoration: Partial<TemplateSpec['decoration']>;
  cards: Partial<TemplateSpec['cards']>;
  typography: Partial<TemplateSpec['typography']>;
}>;

export interface EngineTokens {
  mood: SpaceMood;
  layout_variant: 'spacious' | 'rich';
  animation_level: 'none' | 'subtle' | 'full';
  template_id?: string;
  spec_override?: TemplateSpecOverride;
  palette: SpacePalette;
  tagline?: string;
  hero_title_placeholder?: string;
  notepad_starter?: string;
  currently_placeholder?: string;
}

export interface SectionProps {
  content: SpaceContent;
  tokens: EngineTokens;
  spec: TemplateSpec;
  isOwner: boolean;
  mode: 'editing' | 'preview';
  editing: boolean;
  onUpdate: (patch: Partial<SpaceContent>) => void;
  updateGoalText: (id: string, text: string) => void;
  toggleGoal: (id: string) => void;
  addGoal: () => void;
  styles: {
    card: CSSProperties;
    label: CSSProperties;
    muted: string;
    border: string;
  };
}

export interface DecorationProps {
  palette: SpacePalette;
  spec: TemplateSpec;
  mood: SpaceMood;
}
