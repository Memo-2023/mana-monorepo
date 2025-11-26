/**
 * Nutriphi Theme Store
 *
 * Uses the shared theme system with Nutriphi's green primary color.
 */
import { createThemeStore } from '@manacore/shared-theme';

export type { ThemeMode, ThemeVariant, EffectiveMode } from '@manacore/shared-theme';

/**
 * Nutriphi theme store instance
 *
 * - Default variant: nature (green)
 * - Custom primary: Green (#22c55e)
 * - All 4 theme variants available
 */
export const theme = createThemeStore({
  appId: 'nutriphi',
  defaultVariant: 'nature',
  primaryColor: {
    light: '142 71% 45%', // Green #22c55e
    dark: '142 71% 45%'
  }
});
