import { ColorSchemeName } from 'react-native';

import { ThemeVariant } from './ThemeProvider';

// Farbpaletten für die verschiedenen Themes
const lumeColors = {
	light: {
		primary: '#f8d62b',
		backgroundForPrimary: '#383838',
		primaryHover: '#2980b9',
		primaryPressed: '#1f6da3',
		secondary: '#D4B200',
		secondaryHover: '#27ae60',
		secondaryPressed: '#229954',
		backgroundPage: '#ffffff',
		backgroundPrimary: '#ffffff',
		backgroundSecondary: '#eeeeee',
		backgroundTertiary: '#e8e8e8',
		backgroundError: '#FFEBEE',
		textPrimary: '#000000',
		textSecondary: '#666666',
		textTertiary: '#999999',
		borderPrimary: '#bbbbbb',
		borderSecondary: '#282828',
		textOnPrimary: '#000000',
		error: '#e74c3c',
		backgroundFree: '#95a5a6',
		backgroundPlus: '#f39c12',
		backgroundPro: '#f8d62b',
		backgroundUltra: '#e74c3c',
	},
	dark: {
		primary: '#f8d62b',
		backgroundForPrimary: '#383838',
		primaryHover: '#f8d62b',
		primaryPressed: '#1f6da3',
		secondary: '#695D01',
		secondaryHover: '#27ae60',
		secondaryPressed: '#229954',
		backgroundPage: '#121212',
		backgroundPrimary: '#1e1e1e',
		backgroundSecondary: '#2c2c2c',
		backgroundTertiary: '#383838',
		backgroundError: '#260000',
		textPrimary: '#ffffff',
		textSecondary: '#cccccc',
		textTertiary: '#999999',
		textOnPrimary: '#000000',
		borderPrimary: '#424242',
		borderSecondary: '#282828',
		error: '#e74c3c',
		backgroundFree: '#95a5a6',
		backgroundPlus: '#f39c12',
		backgroundPro: '#f8d62b',
		backgroundUltra: '#e74c3c',
	},
};

const natureColors = {
	light: {
		primary: '#81C784',
		backgroundForPrimary: '#2E7D32',
		primaryHover: '#66BB6A',
		primaryPressed: '#4CAF50',
		secondary: '#A5D6A7',
		secondaryHover: '#81C784',
		secondaryPressed: '#66BB6A',
		backgroundPage: '#F1F8E9',
		backgroundPrimary: '#FFFFFF',
		backgroundSecondary: '#F9FBE7',
		backgroundTertiary: '#F0F4C3',
		backgroundError: '#FFEBEE',
		textPrimary: '#1B5E20',
		textSecondary: '#33691E',
		textTertiary: '#558B2F',
		textOnPrimary: '#000000',
		borderPrimary: '#C8E6C9',
		borderSecondary: '#A5D6A7',
		error: '#E57373',
		backgroundFree: '#AED581',
		backgroundPlus: '#9CCC65',
		backgroundPro: '#8BC34A',
		backgroundUltra: '#7CB342',
	},
	dark: {
		primary: '#81C784',
		backgroundForPrimary: '#2E7D32',
		primaryHover: '#66BB6A',
		primaryPressed: '#4CAF50',
		secondary: '#A5D6A7',
		secondaryHover: '#695D01',
		secondaryPressed: '#66BB6A',
		backgroundPage: '#1B1B1B',
		backgroundPrimary: '#1E1E1E',
		backgroundSecondary: '#2C2C2C',
		backgroundTertiary: '#333333',
		backgroundError: '#CF6679',
		textPrimary: '#FFFFFF',
		textSecondary: '#C8E6C9',
		textTertiary: '#A5D6A7',
		textOnPrimary: '#000000',
		borderPrimary: '#2E7D32',
		borderSecondary: '#1B5E20',
		error: '#CF6679',
		backgroundFree: '#558B2F',
		backgroundPlus: '#7CB342',
		backgroundPro: '#8BC34A',
		backgroundUltra: '#9CCC65',
	},
};

const stoneColors = {
	light: {
		primary: '#90A4AE',
		backgroundForPrimary: '#455A64',
		primaryHover: '#78909C',
		primaryPressed: '#607D8B',
		secondary: '#B0BEC5',
		secondaryHover: '#90A4AE',
		secondaryPressed: '#78909C',
		backgroundPage: '#ECEFF1',
		backgroundPrimary: '#FFFFFF',
		backgroundSecondary: '#F5F5F5',
		backgroundTertiary: '#EEEEEE',
		backgroundError: '#FFEBEE',
		textPrimary: '#263238',
		textSecondary: '#37474F',
		textTertiary: '#455A64',
		textOnPrimary: '#000000',
		borderPrimary: '#CFD8DC',
		borderSecondary: '#B0BEC5',
		error: '#EF5350',
		backgroundFree: '#90A4AE',
		backgroundPlus: '#78909C',
		backgroundPro: '#607D8B',
		backgroundUltra: '#546E7A',
	},
	dark: {
		primary: '#90A4AE',
		backgroundForPrimary: '#455A64',
		primaryHover: '#78909C',
		primaryPressed: '#607D8B',
		secondary: '#B0BEC5',
		secondaryHover: '#90A4AE',
		secondaryPressed: '#78909C',
		backgroundPage: '#121212',
		backgroundPrimary: '#1A1A1A',
		backgroundSecondary: '#242424',
		backgroundTertiary: '#2C2C2C',
		backgroundError: '#CF6679',
		textPrimary: '#FFFFFF',
		textSecondary: '#B0BEC5',
		textTertiary: '#90A4AE',
		textOnPrimary: '#000000',
		borderPrimary: '#455A64',
		borderSecondary: '#37474F',
		error: '#CF6679',
		backgroundFree: '#546E7A',
		backgroundPlus: '#607D8B',
		backgroundPro: '#78909C',
		backgroundUltra: '#90A4AE',
	},
};

const oceanColors = {
	light: {
		primary: '#4FC3F7',
		backgroundForPrimary: '#0277BD',
		primaryHover: '#29B6F6',
		primaryPressed: '#03A9F4',
		secondary: '#81D4FA',
		secondaryHover: '#4FC3F7',
		secondaryPressed: '#29B6F6',
		backgroundPage: '#E1F5FE',
		backgroundPrimary: '#FFFFFF',
		backgroundSecondary: '#F5F5F5',
		backgroundTertiary: '#E3F2FD',
		backgroundError: '#FFEBEE',
		textPrimary: '#01579B',
		textSecondary: '#0277BD',
		textTertiary: '#0288D1',
		textOnPrimary: '#000000',
		borderPrimary: '#B3E5FC',
		borderSecondary: '#81D4FA',
		error: '#EF5350',
		backgroundFree: '#4FC3F7',
		backgroundPlus: '#29B6F6',
		backgroundPro: '#03A9F4',
		backgroundUltra: '#039BE5',
	},
	dark: {
		primary: '#4FC3F7',
		backgroundForPrimary: '#0277BD',
		primaryHover: '#29B6F6',
		primaryPressed: '#03A9F4',
		secondary: '#81D4FA',
		secondaryHover: '#4FC3F7',
		secondaryPressed: '#29B6F6',
		backgroundPage: '#121212',
		backgroundPrimary: '#1A1A1A',
		backgroundSecondary: '#242424',
		backgroundTertiary: '#2C2C2C',
		backgroundError: '#CF6679',
		textPrimary: '#FFFFFF',
		textSecondary: '#B3E5FC',
		textTertiary: '#81D4FA',
		textOnPrimary: '#000000',
		borderPrimary: '#0288D1',
		borderSecondary: '#0277BD',
		error: '#CF6679',
		backgroundFree: '#039BE5',
		backgroundPlus: '#03A9F4',
		backgroundPro: '#29B6F6',
		backgroundUltra: '#4FC3F7',
	},
};

// Basis-Theme-Eigenschaften
const baseTheme = {
	fontSizes: {
		// Base text sizes
		small: 14,
		body: 16,
		subtitle: 18,
		title: 20,

		// Heading sizes
		h1: 28,
		h2: 24,
		h3: 20,
		h4: 18,
		h5: 16,
		h6: 14,

		// Special markdown elements
		code: 14,
		blockquote: 16,
		caption: 12,
		footnote: 12,
	},
	fontWeights: {
		regular: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
	},
	spacing: {
		none: 0,
		xxs: 4,
		xsmall: 8,
		small: 12,
		medium: 16,
		large: 24,
		xl: 32,
		xxl: 48,
		xxxl: 64,
		horizontalPageMargin: 16,
		verticalPageMargin: 24,
		sectionSpacing: 40,
		elementSpacing: 20,
		inlineElementSpacing: 12,
		cardPadding: 16,
		headerHeight: 60,
	},
	borderRadius: {
		small: 4,
		medium: 12,
		large: 16,
		round: 9999,
	},
	shadows: {
		small: {
			shadowColor: '#000000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 4,
		},
		medium: {
			shadowColor: '#000000',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.15,
			shadowRadius: 8,
			elevation: 8,
		},
		large: {
			shadowColor: '#000000',
			shadowOffset: { width: 0, height: 6 },
			shadowOpacity: 0.2,
			shadowRadius: 12,
			elevation: 12,
		},
	},
	zIndex: {
		base: 1,
		dropdown: 1000,
		modal: 2000,
		tooltip: 3000,
	},
};

// Funktion zum Abrufen des Themes
export const getTheme = (colorScheme: ColorSchemeName, themeVariant: ThemeVariant = 'lume') => {
	let colors;
	const mode = colorScheme === 'dark' ? 'dark' : 'light';

	switch (themeVariant) {
		case 'nature':
			colors = natureColors[mode];
			break;
		case 'stone':
			colors = stoneColors[mode];
			break;
		case 'ocean':
			colors = oceanColors[mode];
			break;
		default:
			colors = lumeColors[mode];
	}

	return {
		...baseTheme,
		colors,
		dark: colorScheme === 'dark',
	};
};

export type Theme = ReturnType<typeof getTheme>;

// Exportiere das Standard-Theme
export const defaultTheme = getTheme('light', 'lume');
