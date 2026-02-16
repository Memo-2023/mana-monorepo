import { createThemeStore, type HSLValue, type ThemeVariant } from '@manacore/shared-theme';

/**
 * LightWrite theme store
 *
 * Uses blue primary color matching the waveform progress color
 */
export const theme = createThemeStore({
	appId: 'lightwrite',
	defaultVariant: 'ocean' as ThemeVariant,
	primaryColor: {
		light: '217 91% 60%' as HSLValue, // Blue #3b82f6
		dark: '217 91% 60%' as HSLValue,
	},
});
