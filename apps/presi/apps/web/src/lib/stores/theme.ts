import { createThemeStore } from '@manacore/shared-theme';

export const theme = createThemeStore({
	appId: 'presi',
	defaultVariant: 'stone',
	primaryColor: {
		light: '220 9% 46%',
		dark: '220 9% 56%',
	},
});
