import { ColorSchemeName } from 'react-native';

// Theme types
export type ThemeVariant = 'lume' | 'nature' | 'stone';

export const THEME_PATTERNS: Record<ThemeVariant, any> = {
	lume: require('../assets/images/patterns/memo-theme-tile.png'),
	nature: require('../assets/images/patterns/nature-theme-tile.png'),
	stone: require('../assets/images/patterns/stone-theme-tile.png'),
};

export const THEME_NAMES: Record<ThemeVariant, string> = {
	lume: 'Lume',
	nature: 'Nature',
	stone: 'Stone',
};

// Farbpalette
export const lightColors = {
	primary: '#f8d62b',
	backgroundForPrimary: '#383838',
	primaryHover: '#2980b9',
	primaryPressed: '#1f6da3',
	secondary: '#D4B200',
	secondaryHover: '#27ae60',
	secondaryPressed: '#229954',
	backgroundPage: '#dddddd',
	backgroundPrimary: '#ffffff',
	backgroundSecondary: '#eeeeee', // Geändert zu einem helleren Grau
	backgroundTertiary: '#e8e8e8', // Neue Farbe für Hover-Zustand
	backgroundError: '#FFEBEE', // Helles Rot für Fehlerhintergrund
	textPrimary: '#000000',
	textSecondary: '#666666',
	textTertiary: '#999999',
	borderPrimary: '#bbbbbb',
	borderSecondary: '#282828',
	textOnPrimary: '#000000', // Schwarz für Text auf primärer Farbe
	error: '#e74c3c', // Rot für Gefahren-Buttons
	backgroundFree: '#95a5a6', // Grau
	backgroundPlus: '#f39c12', // Orange
	backgroundPro: '#f8d62b', // Gelb
	backgroundUltra: '#e74c3c', // Rot
};

export const darkColors = {
	primary: '#f8d62b',
	backgroundForPrimary: '#383838',
	primaryHover: '#f8d62b',
	primaryPressed: '#1f6da3',
	secondary: '#D4B200',
	secondaryHover: '#27ae60',
	secondaryPressed: '#229954',
	backgroundPage: '#121212',
	backgroundPrimary: '#1e1e1e',
	backgroundSecondary: '#2c2c2c',
	backgroundTertiary: '#383838', // Neue Farbe für Hover-Zustand
	backgroundError: '#260000', // Dunkles Rot für Fehlerhintergrund
	textPrimary: '#ffffff',
	textSecondary: '#cccccc',
	textTertiary: '#999999',
	textOnPrimary: '#000000',
	borderPrimary: '#424242',
	borderSecondary: '#282828',
	error: '#e74c3c', // Rot für Gefahren-Buttons
	backgroundFree: '#95a5a6', // Grau
	backgroundPlus: '#f39c12', // Orange
	backgroundPro: '#f8d62b', // Gelb
	backgroundUltra: '#e74c3c', // Rot
};

// Nature theme colors
export const natureLightColors = {
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
};

export const natureDarkColors = {
	primary: '#81C784',
	backgroundForPrimary: '#2E7D32',
	primaryHover: '#66BB6A',
	primaryPressed: '#4CAF50',
	secondary: '#A5D6A7',
	secondaryHover: '#81C784',
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
};

// Stone theme colors
export const stoneLightColors = {
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
};

export const stoneDarkColors = {
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
};

// Schriftgrößen
const fontSizes = {
	small: 14,
	body: 16,
	subtitle: 18,
	title: 20,
	h1: 28, // Neue Zeile für h1
	h2: 24, // Neue Zeile für h2
};

// Schriftstärken
const fontWeights = {
	regular: '400',
	medium: '500',
	bold: '700',
};

// Abstände
const spacing = {
	none: 0,
	xxs: 2, // Neuer Wert für sehr kleine Abstände
	xsmall: 4,
	small: 8,
	medium: 12,
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
};

// Rundungen
const borderRadius = {
	small: 4,
	medium: 12,
	large: 16,
	round: 9999,
};

// Schatten aktualisieren
const shadows = {
	small: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
	medium: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
	large: '0px 6px 12px 0px rgba(0, 0, 0, 0.2)',
};

// Z-Index-Werte
const zIndex = {
	base: 1,
	dropdown: 1000,
	modal: 2000,
	tooltip: 3000,
};

// Neue TagColors mit englischen Namen
export const tagColors = {
	blue: '#3498db',
	green: '#2ecc71',
	red: '#e74c3c',
	orange: '#f39c12',
	purple: '#9b59b6',
	teal: '#1abc9c',
	pink: '#e84393',
	gray: '#95a5a6',
};

// Updated getTheme function to support multiple themes
export const getTheme = (colorScheme: ColorSchemeName, themeVariant: ThemeVariant = 'lume') => {
	let colors;
	switch (themeVariant) {
		case 'nature':
			colors = colorScheme === 'dark' ? natureDarkColors : natureLightColors;
			break;
		case 'stone':
			colors = colorScheme === 'dark' ? stoneDarkColors : stoneLightColors;
			break;
		default:
			colors = colorScheme === 'dark' ? darkColors : lightColors;
	}

	return {
		colors,
		tagColors,
		fontSizes,
		fontWeights,
		spacing,
		borderRadius,
		shadows,
		zIndex,
	};
};

// Typdefinition für das Theme
export type Theme = ReturnType<typeof getTheme>;

// Am Ende der Datei fügen Sie diese Zeile hinzu:
export const defaultTheme = getTheme('light');
