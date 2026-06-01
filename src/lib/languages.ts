export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文（简体）' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

export function languageName(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? 'English';
}

/** Returns an empty string for English (no instruction needed), or a directive for other languages. */
export function languagePrompt(code: string): string {
  if (!code || code === 'en') return '';
  return `\nAlways respond in ${languageName(code)}. Do not switch to English.`;
}
