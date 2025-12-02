import { createThemeStore } from '@manacore/shared-theme';

// Create theme store with Contacts' primary color (blue)
export const theme = createThemeStore({
	appId: 'contacts',
	defaultVariant: 'lume',
});
