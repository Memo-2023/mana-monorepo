/**
 * Maerchenzauber (Storyteller) Theme Store
 *
 * Uses the shared theme system with a magical purple primary color.
 */
import { createThemeStore } from '@manacore/shared-theme';

// Re-export types for convenience
export type { ThemeMode, ThemeVariant, EffectiveMode } from '@manacore/shared-theme';

/**
 * Maerchenzauber theme store instance
 *
 * - Default variant: nature (green - enchanted forest feel)
 * - Custom primary: Purple (magical storytelling)
 * - All 4 theme variants available
 */
export const theme = createThemeStore({
	appId: 'maerchenzauber',
	defaultVariant: 'nature',
	primaryColor: {
		light: '280 60% 55%', // Purple - magical/storytelling
		dark: '280 60% 60%',
	},
});
