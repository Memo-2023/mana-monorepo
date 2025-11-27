/**
 * ManaDeck Theme Store
 *
 * Uses the shared theme system with ManaDeck's indigo primary color.
 */
import { createThemeStore } from '@manacore/shared-theme';

// Re-export types for convenience
export type { ThemeMode, ThemeVariant, EffectiveMode } from '@manacore/shared-theme';

/**
 * ManaDeck theme store instance
 *
 * - Default variant: ocean (blue)
 * - Custom primary: Indigo (#6366f1)
 * - All 4 theme variants available
 */
export const theme = createThemeStore({
	appId: 'manadeck',
	defaultVariant: 'ocean',
	primaryColor: {
		light: '239 84% 67%', // Indigo #6366f1
		dark: '239 84% 67%',
	},
});
