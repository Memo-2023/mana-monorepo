import { createThemeStore } from '@manacore/shared-theme';

export const theme = createThemeStore({
  appId: 'chat',
  defaultVariant: 'ocean',
  primaryColor: {
    light: '217 91% 60%', // Blue
    dark: '217 91% 60%',
  },
});
