/**
 * Mana Theme Store
 *
 * Uses the shared theme system with Mana's indigo primary color.
 */
import { createThemeStore } from '@mana/shared-theme';

// Re-export types for convenience
export type { ThemeMode, ThemeVariant, EffectiveMode } from '@mana/shared-theme';

/**
 * Mana theme store instance
 *
 * - Default variant: ocean (blue)
 * - Custom primary: Indigo (#6366f1)
 * - All 4 theme variants available
 */
export const theme = createThemeStore({
	appId: 'mana',
	defaultVariant: 'ocean',
	primaryColor: {
		light: '239 84% 67%', // Indigo #6366f1
		dark: '239 84% 67%',
	},
});
