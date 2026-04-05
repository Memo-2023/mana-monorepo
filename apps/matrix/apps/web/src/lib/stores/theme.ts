import { createThemeStore } from '@mana/shared-theme';

export const theme = createThemeStore({
	appId: 'matrix',
	defaultVariant: 'lavender',
	primaryColor: {
		light: '270 70% 60%', // Purple/violet
		dark: '270 70% 60%',
	},
});
