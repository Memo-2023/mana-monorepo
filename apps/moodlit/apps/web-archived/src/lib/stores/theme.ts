import { createThemeStore } from '@manacore/shared-theme';

// Create the theme store for Moodlit
export const theme = createThemeStore({
	appId: 'moodlit',
	defaultMode: 'system',
	defaultVariant: 'lume',
});
