/**
 * Shared color palette for all ManaCore apps
 *
 * Theme structure:
 * - Each theme has light and dark variants
 * - Semantic color tokens for consistent UI
 */

export const colors = {
	// Brand color used across subscription/pricing
	mana: '#4287f5',

	// App-specific primary colors
	brand: {
		memoro: '#f8d62b', // Gold
		manacore: '#6366f1', // Indigo
		manadeck: '#6366f1', // Indigo
		storyteller: '#6366f1', // Indigo
	},

	// Primary color scale (for general use)
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
		950: '#172554',
	},

	// Lume Theme - Modern Gold & Dark
	lume: {
		light: {
			primary: '#f8d62b',
			primaryButton: '#f8d62b',
			primaryButtonText: '#000000',
			secondary: '#D4B200',
			secondaryButton: '#FFE9A3',
			contentBackground: '#ffffff',
			contentBackgroundHover: '#f5f5f5',
			contentPageBackground: '#ffffff',
			menuBackground: '#dddddd',
			menuBackgroundHover: '#cccccc',
			pageBackground: '#dddddd',
			text: '#2c2c2c',
			textSecondary: '#666666',
			borderLight: '#f2f2f2',
			border: '#e6e6e6',
			borderStrong: '#cccccc',
			error: '#e74c3c',
			success: '#27ae60',
			warning: '#f39c12',
		},
		dark: {
			primary: '#f8d62b',
			primaryButton: '#7C6B16',
			primaryButtonText: '#ffffff',
			secondary: '#D4B200',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#333333',
			contentPageBackground: '#121212',
			menuBackground: '#101010',
			menuBackgroundHover: '#333333',
			pageBackground: '#101010',
			text: '#ffffff',
			textSecondary: '#a0a0a0',
			borderLight: '#333333',
			border: '#424242',
			borderStrong: '#616161',
			error: '#e74c3c',
			success: '#2ecc71',
			warning: '#f1c40f',
		},
	},

	// Nature Theme - Soothing Green
	nature: {
		light: {
			primary: '#4CAF50',
			primaryButton: '#A08500',
			primaryButtonText: '#ffffff',
			secondary: '#81C784',
			secondaryButton: '#F1F8E9',
			contentBackground: '#F1F8E9',
			contentBackgroundHover: '#E8F5E9',
			contentPageBackground: '#ffffff',
			menuBackground: '#E8F5E9',
			menuBackgroundHover: '#C8E6C9',
			pageBackground: '#FBFDF8',
			text: '#1B5E20',
			textSecondary: '#388E3C',
			borderLight: '#E8F5E9',
			border: '#C8E6C9',
			borderStrong: '#A5D6A7',
			error: '#E57373',
			success: '#66BB6A',
			warning: '#FFB74D',
		},
		dark: {
			primary: '#4CAF50',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#81C784',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#2E7D32',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#2E7D32',
			pageBackground: '#121212',
			text: '#FFFFFF',
			textSecondary: '#A5D6A7',
			borderLight: '#1B5E20',
			border: '#2E7D32',
			borderStrong: '#388E3C',
			error: '#CF6679',
			success: '#81C784',
			warning: '#FFD54F',
		},
	},

	// Stone Theme - Elegant Slate
	stone: {
		light: {
			primary: '#607D8B',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#90A4AE',
			secondaryButton: '#ECEFF1',
			contentBackground: '#ECEFF1',
			contentBackgroundHover: '#E0E6EA',
			contentPageBackground: '#ffffff',
			menuBackground: '#E0E6EA',
			menuBackgroundHover: '#CFD8DC',
			pageBackground: '#F5F7F9',
			text: '#263238',
			textSecondary: '#546E7A',
			borderLight: '#ECEFF1',
			border: '#CFD8DC',
			borderStrong: '#B0BEC5',
			error: '#EF5350',
			success: '#66BB6A',
			warning: '#FFA726',
		},
		dark: {
			primary: '#78909C',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#90A4AE',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#37474F',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#37474F',
			pageBackground: '#121212',
			text: '#FFFFFF',
			textSecondary: '#B0BEC5',
			borderLight: '#37474F',
			border: '#455A64',
			borderStrong: '#546E7A',
			error: '#CF6679',
			success: '#81C784',
			warning: '#FFD54F',
		},
	},

	// Ocean Theme - Tranquil Blue
	ocean: {
		light: {
			primary: '#039BE5',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#4FC3F7',
			secondaryButton: '#E1F5FE',
			contentBackground: '#E1F5FE',
			contentBackgroundHover: '#B3E5FC',
			contentPageBackground: '#ffffff',
			menuBackground: '#E1F5FE',
			menuBackgroundHover: '#B3E5FC',
			pageBackground: '#F5FCFF',
			text: '#01579B',
			textSecondary: '#0277BD',
			borderLight: '#E1F5FE',
			border: '#B3E5FC',
			borderStrong: '#81D4FA',
			error: '#EF5350',
			success: '#66BB6A',
			warning: '#FFA726',
		},
		dark: {
			primary: '#039BE5',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#4FC3F7',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#0277BD',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#0277BD',
			pageBackground: '#121212',
			text: '#FFFFFF',
			textSecondary: '#81D4FA',
			borderLight: '#01579B',
			border: '#0277BD',
			borderStrong: '#0288D1',
			error: '#CF6679',
			success: '#81C784',
			warning: '#FFD54F',
		},
	},
};

// Flat theme colors for direct use in Tailwind configs
export const themeColors = {
	mana: colors.mana,
	primary: colors.primary,
	lume: {
		...colors.lume.light,
		dark: colors.lume.dark,
	},
	nature: {
		...colors.nature.light,
		dark: colors.nature.dark,
	},
	stone: {
		...colors.stone.light,
		dark: colors.stone.dark,
	},
	ocean: {
		...colors.ocean.light,
		dark: colors.ocean.dark,
	},
};

export default colors;
