/**
 * Theme type definitions
 */

export type ThemeVariant = 'memoro' | 'blue' | 'purple' | 'beige';

export interface ThemeColorSet {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	contentBackground: string;
	contentBackgroundHover: string;
	text: string;
	subtext: string;
	border: string;
	shadow: string;
	error: string;
	success: string;
	warning: string;
	info: string;
}

export interface ThemeColors {
	memoro: ThemeColorSet;
	blue: ThemeColorSet;
	purple: ThemeColorSet;
	beige: ThemeColorSet;
	dark: {
		memoro: ThemeColorSet;
		blue: ThemeColorSet;
		purple: ThemeColorSet;
		beige: ThemeColorSet;
	};
}

export interface Theme {
	colors: ThemeColors;
	spacing: {
		xs: number;
		sm: number;
		md: number;
		lg: number;
		xl: number;
		xxl: number;
	};
	borderRadius: {
		sm: number;
		md: number;
		lg: number;
		xl: number;
		full: number;
	};
	fontSize: {
		xs: number;
		sm: number;
		base: number;
		lg: number;
		xl: number;
		'2xl': number;
		'3xl': number;
	};
	fontFamily: {
		regular: string;
		medium: string;
		semibold: string;
		bold: string;
	};
}

/**
 * Get theme colors based on dark mode and variant
 */
export function getThemeColors(
	isDark: boolean,
	variant: ThemeVariant,
	colors: ThemeColors
): ThemeColorSet {
	if (isDark) {
		return colors.dark[variant];
	}
	return colors[variant];
}

/**
 * Type-safe theme color accessor
 */
export function getThemeColor(
	colors: ThemeColors,
	isDark: boolean,
	variant: ThemeVariant,
	colorKey: keyof ThemeColorSet
): string {
	const themeColors = getThemeColors(isDark, variant, colors);
	return themeColors[colorKey];
}
