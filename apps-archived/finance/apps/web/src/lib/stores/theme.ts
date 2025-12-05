import { createTheme, type ThemeStore } from '@manacore/shared-theme';

export const theme: ThemeStore = createTheme({
	storagePrefix: 'finance',
	variants: ['default', 'blue', 'green', 'purple', 'orange', 'pink'],
});
