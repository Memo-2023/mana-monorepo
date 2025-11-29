/**
 * Memoro Theme Store
 *
 * Uses the shared theme system with Memoro's gold primary color.
 */
import { createThemeStore } from '@manacore/shared-theme';

// Re-export types for convenience
export type { ThemeMode, ThemeVariant, EffectiveMode } from '@manacore/shared-theme';

/**
 * Memoro theme store instance
 *
 * - Default variant: lume (gold)
 * - Custom primary: Gold (#f8d62b)
 * - All 4 theme variants available
 */
export const theme = createThemeStore({
	appId: 'memoro',
	defaultVariant: 'lume',
	primaryColor: {
		light: '47 95% 58%', // Gold #f8d62b
		dark: '47 95% 58%',
	},
});
