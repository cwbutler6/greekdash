/**
 * Calculate the luminance of a color to determine if it's light or dark
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5;
}

/**
 * Get appropriate text color (black or white) for a background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}

/**
 * Get chapter colors with intelligent defaults
 */
export interface ChapterColors {
  primary: string;
  secondary: string;
  primaryText: string;
  secondaryText: string;
}

export function getChapterColors(
  primaryColor?: string | null,
  secondaryColor?: string | null
): ChapterColors {
  const primary = primaryColor || '#1d4ed8';
  const secondary = secondaryColor || '#ffffff';
  
  return {
    primary,
    secondary,
    primaryText: getContrastTextColor(primary),
    secondaryText: getContrastTextColor(secondary),
  };
}

/**
 * Generate CSS custom properties for chapter colors
 */
export function getChapterColorVariables(colors: ChapterColors): Record<string, string> {
  return {
    '--chapter-primary': colors.primary,
    '--chapter-secondary': colors.secondary,
    '--chapter-primary-text': colors.primaryText,
    '--chapter-secondary-text': colors.secondaryText,
  };
}