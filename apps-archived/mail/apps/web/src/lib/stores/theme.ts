import { createTheme, type ThemeStore } from '@manacore/shared-theme';

export const theme: ThemeStore = createTheme({
	storagePrefix: 'mail',
	variants: ['default', 'ocean', 'blue', 'purple', 'green', 'orange'],
});
