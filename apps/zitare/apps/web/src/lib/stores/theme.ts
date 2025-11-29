import { createThemeStore } from '@manacore/shared-theme';

// Create theme store with Zitare's primary color (amber)
export const theme = createThemeStore({
	defaultVariant: 'lume',
	storagePrefix: 'zitare',
});
