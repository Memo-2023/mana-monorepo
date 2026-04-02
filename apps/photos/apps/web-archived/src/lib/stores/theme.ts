import { createThemeStore } from '@manacore/shared-theme';

// Create theme store with Photos' primary color
export const theme = createThemeStore({
	appId: 'photos',
	defaultVariant: 'lume',
});
