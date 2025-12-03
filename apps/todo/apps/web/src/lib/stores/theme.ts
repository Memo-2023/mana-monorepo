import { createThemeStore } from '@manacore/shared-theme';

// Create theme store with Todo's primary color (purple/violet)
export const theme = createThemeStore({
	appId: 'todo',
	defaultVariant: 'ocean',
});
