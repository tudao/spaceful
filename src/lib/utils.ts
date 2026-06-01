import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(balance: number): string {
  return balance % 1 === 0 ? balance.toString() : balance.toFixed(2);
}

export function creditPillClass(balance: number): string {
  if (balance <= 0) return 'credit-pill zero';
  if (balance < 5)  return 'credit-pill low';
  return 'credit-pill';
}

export const SPACE_PALETTES = {
  lavender: { bg: '#F7F4FF', bg2: '#EDE8FF', surface: '#FFFFFF', accent: '#7C5CDB', accent2: '#B09EE8', text: '#1A1040', text2: '#6B5E8A', glow: 'rgba(124,92,219,0.25)' },
  sand:     { bg: '#FBF8F2', bg2: '#F5EDDA', surface: '#FFFFFF', accent: '#C8873A', accent2: '#E8C88A', text: '#2A1F0A', text2: '#7A6040', glow: 'rgba(200,135,58,0.25)' },
  forest:   { bg: '#0F1A14', bg2: '#152219', surface: '#1A2820', accent: '#5BAB7C', accent2: '#3D7A58', text: '#E8F2EC', text2: '#8FB8A0', glow: 'rgba(91,171,124,0.30)' },
  ocean:    { bg: '#F0F7FF', bg2: '#DCF0FF', surface: '#FFFFFF', accent: '#3A8CBF', accent2: '#7BB8D8', text: '#0A1A2A', text2: '#3A6080', glow: 'rgba(58,140,191,0.25)' },
  rose:     { bg: '#FFF4F6', bg2: '#FFE4E8', surface: '#FFFFFF', accent: '#C9485B', accent2: '#E8909A', text: '#2A0A10', text2: '#80404A', glow: 'rgba(201,72,91,0.25)' },
  midnight: { bg: '#0D0D1A', bg2: '#13132A', surface: '#1A1A30', accent: '#9D7DE8', accent2: '#6B50C8', text: '#F0F0FF', text2: '#A090C8', glow: 'rgba(157,125,232,0.30)' },
} as const;

export type SpaceMood = keyof typeof SPACE_PALETTES;

export const CREDIT_COSTS = {
  generation:  3,
  regeneration: 2,
  prompt:      0.25,
  og_regen:    0.5,
} as const;

export const USERNAME_BLOCKLIST = [
  'admin', 'support', 'help', 'gallery', 'pricing', 'account', 'spaces',
  'api', 'static', 'onboard', 'login', 'signup', 'logout', 'about', 'terms',
  'privacy', 'blog', 'press', 'careers', 'contact', 'www', 'mail', 'email',
  'spaceful', 'staff', 'team', 'moderator', 'mod', 'system', 'root',
];

export function isUsernameBlocked(username: string): boolean {
  return USERNAME_BLOCKLIST.includes(username.toLowerCase());
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/i.test(username) && !isUsernameBlocked(username);
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
