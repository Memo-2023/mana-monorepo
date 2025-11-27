import { defaultTheme } from './default';
import { forestTheme } from './forest';
import { sunsetTheme } from './sunset';
import { Theme, ThemeName } from '~/types/theme';

export const themes: Record<ThemeName, Theme> = {
	default: defaultTheme,
	forest: forestTheme,
	sunset: sunsetTheme,
};

export const themeList: Theme[] = [defaultTheme, forestTheme, sunsetTheme];

export { defaultTheme, forestTheme, sunsetTheme };
