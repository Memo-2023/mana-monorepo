import { createThemeStore } from '@manacore/shared-theme';

// Create theme store with Calendar's primary color (blue)
export const theme = createThemeStore({
	appId: 'calendar',
	defaultVariant: 'ocean',
});
