/**
 * Central export for all themes
 */
import { defaultTheme } from './default';
import { sunsetTheme } from './sunset';
import { oceanTheme } from './ocean';
import { Theme, ThemeDefinition, ThemeVariant } from './types';

export * from './types';
export { defaultTheme } from './default';
export { sunsetTheme } from './sunset';
export { oceanTheme } from './ocean';

/**
 * All available theme definitions
 */
export const themes: Record<ThemeVariant, ThemeDefinition> = {
  default: defaultTheme,
  sunset: sunsetTheme,
  ocean: oceanTheme,
};

/**
 * Get a theme by variant and mode
 */
export function getTheme(variant: ThemeVariant, mode: 'light' | 'dark'): Theme {
  const themeDefinition = themes[variant];
  const themeData = mode === 'light' ? themeDefinition.light : themeDefinition.dark;

  return {
    name: themeDefinition.name,
    displayName: themeDefinition.displayName,
    ...themeData,
  };
}
