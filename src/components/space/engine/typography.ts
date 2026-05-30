import type { TemplateSpec } from './types';

export function titleFontSize(scale: TemplateSpec['typography']['title_scale']) {
  const sizes = {
    lg: 'clamp(28px,4vw,40px)',
    xl: 'clamp(32px,5vw,52px)',
    '2xl': 'clamp(38px,6vw,64px)',
    display: 'clamp(42px,7vw,76px)',
  };
  return sizes[scale];
}

