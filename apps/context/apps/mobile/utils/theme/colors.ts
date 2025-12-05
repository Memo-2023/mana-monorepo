/**
 * Zentrale Farbdefinitionen für die Anwendung
 * Diese Datei definiert alle Farben und Themes, die in der Anwendung verwendet werden
 */

// Gemeinsame Farben für alle Themes
const commonColors = {
	// Button-Styles
	button: {
		// Varianten
		primary: {
			background: {
				default: { light: '#0ea5e9', dark: '#0284c7' },
				hover: { light: '#0284c7', dark: '#0369a1' },
				active: { light: '#0369a1', dark: '#075985' },
				disabled: { light: '#bae6fd', dark: '#075985' },
			},
			text: {
				default: { light: '#ffffff', dark: '#ffffff' },
				disabled: { light: '#e0f2fe', dark: '#7dd3fc' },
			},
		},
		secondary: {
			background: {
				default: { light: '#e5e7eb', dark: '#374151' },
				hover: { light: '#d1d5db', dark: '#4b5563' },
				active: { light: '#9ca3af', dark: '#6b7280' },
				disabled: { light: '#f3f4f6', dark: '#1f2937' },
			},
			text: {
				default: { light: '#111827', dark: '#f9fafb' },
				active: { light: '#ffffff', dark: '#ffffff' },
				disabled: { light: '#6b7280', dark: '#9ca3af' },
			},
		},
		outline: {
			border: {
				default: { light: '#d1d5db', dark: '#4b5563' },
				hover: { light: '#9ca3af', dark: '#6b7280' },
				active: { light: '#6b7280', dark: '#9ca3af' },
			},
			text: {
				default: { light: '#111827', dark: '#f9fafb' },
				hover: { light: '#374151', dark: '#e5e7eb' },
				disabled: { light: '#9ca3af', dark: '#4b5563' },
			},
		},
	},
	// Graustufen
	gray: {
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827',
		950: '#030712',
	},

	// Statusfarben
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#22c55e',
		600: '#16a34a',
		700: '#15803d',
		800: '#166534',
		900: '#14532d',
		950: '#052e16',
	},

	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
		500: '#ef4444',
		600: '#dc2626',
		700: '#b91c1c',
		800: '#991b1b',
		900: '#7f1d1d',
		950: '#450a0a',
	},

	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		200: '#fde68a',
		300: '#fcd34d',
		400: '#fbbf24',
		500: '#f59e0b',
		600: '#d97706',
		700: '#b45309',
		800: '#92400e',
		900: '#78350f',
		950: '#451a03',
	},
};

// Theme 1: Blau/Indigo (Standard)
const theme1 = {
	name: 'blue',
	displayName: 'Blau',
	// Primärfarben
	primary: {
		50: '#f0f9ff',
		100: '#e0f2fe',
		200: '#bae6fd',
		300: '#7dd3fc',
		400: '#38bdf8',
		500: '#0ea5e9',
		600: '#0284c7',
		700: '#0369a1',
		800: '#075985',
		900: '#0c4a6e',
		950: '#082f49',
	},

	// Akzentfarben
	accent: {
		50: '#eef2ff',
		100: '#e0e7ff',
		200: '#c7d2fe',
		300: '#a5b4fc',
		400: '#818cf8',
		500: '#6366f1', // Indigo-500
		600: '#4f46e5',
		700: '#4338ca',
		800: '#3730a3',
		900: '#312e81',
		950: '#1e1b4b',
	},

	// Hintergrundfarben
	background: {
		light: '#ffffff',
		dark: '#121212',
	},

	// Textfarben
	text: {
		light: {
			primary: '#1f2937', // gray-800
			secondary: '#4b5563', // gray-600
			tertiary: '#9ca3af', // gray-400
			inverse: '#f9fafb', // gray-50
		},
		dark: {
			primary: '#f9fafb', // gray-50
			secondary: '#e5e7eb', // gray-200
			tertiary: '#9ca3af', // gray-400
			inverse: '#1f2937', // gray-800
		},
	},

	// Randfarben
	border: {
		light: '#e5e7eb', // gray-200
		dark: '#374151', // gray-700
	},
};

// Theme 2: Grün/Smaragd
const theme2 = {
	name: 'green',
	displayName: 'Grün',
	// Primärfarben
	primary: {
		50: '#ecfdf5',
		100: '#d1fae5',
		200: '#a7f3d0',
		300: '#6ee7b7',
		400: '#34d399',
		500: '#10b981',
		600: '#059669',
		700: '#047857',
		800: '#065f46',
		900: '#064e3b',
		950: '#022c22',
	},

	// Akzentfarben
	accent: {
		50: '#f0fdfa',
		100: '#ccfbf1',
		200: '#99f6e4',
		300: '#5eead4',
		400: '#2dd4bf',
		500: '#14b8a6', // Teal-500
		600: '#0d9488',
		700: '#0f766e',
		800: '#115e59',
		900: '#134e4a',
		950: '#042f2e',
	},

	// Hintergrundfarben
	background: {
		light: '#ffffff',
		dark: '#0f1b17',
	},

	// Textfarben
	text: {
		light: {
			primary: '#064e3b', // green-900
			secondary: '#065f46', // green-800
			tertiary: '#047857', // green-700
			inverse: '#f9fafb', // gray-50
		},
		dark: {
			primary: '#d1fae5', // green-100
			secondary: '#a7f3d0', // green-200
			tertiary: '#6ee7b7', // green-300
			inverse: '#064e3b', // green-900
		},
	},

	// Randfarben
	border: {
		light: '#d1fae5', // green-100
		dark: '#065f46', // green-800
	},
};

// Theme 3: Violett/Fuchsia
const theme3 = {
	name: 'purple',
	displayName: 'Violett',
	// Primärfarben
	primary: {
		50: '#faf5ff',
		100: '#f3e8ff',
		200: '#e9d5ff',
		300: '#d8b4fe',
		400: '#c084fc',
		500: '#a855f7',
		600: '#9333ea',
		700: '#7e22ce',
		800: '#6b21a8',
		900: '#581c87',
		950: '#3b0764',
	},

	// Akzentfarben
	accent: {
		50: '#fdf4ff',
		100: '#fae8ff',
		200: '#f5d0fe',
		300: '#f0abfc',
		400: '#e879f9',
		500: '#d946ef', // Fuchsia-500
		600: '#c026d3',
		700: '#a21caf',
		800: '#86198f',
		900: '#701a75',
		950: '#4a044e',
	},

	// Hintergrundfarben
	background: {
		light: '#ffffff',
		dark: '#1a1025',
	},

	// Textfarben
	text: {
		light: {
			primary: '#581c87', // purple-900
			secondary: '#6b21a8', // purple-800
			tertiary: '#7e22ce', // purple-700
			inverse: '#f9fafb', // gray-50
		},
		dark: {
			primary: '#f3e8ff', // purple-100
			secondary: '#e9d5ff', // purple-200
			tertiary: '#d8b4fe', // purple-300
			inverse: '#581c87', // purple-900
		},
	},

	// Randfarben
	border: {
		light: '#f3e8ff', // purple-100
		dark: '#6b21a8', // purple-800
	},
};

// Alle verfügbaren Themes
export const themes = {
	blue: theme1,
	green: theme2,
	purple: theme3,
};

// Exportiere die Farben des Standard-Themes (Blau)
export const colors = {
	...commonColors,
	...theme1,
};

// Typdefinitionen für die Themes
export type ThemeNames = keyof typeof themes;
export type ThemeColors = typeof theme1;
export type ColorTheme = typeof colors;
