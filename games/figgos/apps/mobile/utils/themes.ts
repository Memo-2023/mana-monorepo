// Theme definitions for the WTFigure app
// Each theme has a light and dark variant

export type ThemeColors = {
	// Base colors
	background: string;
	text: string;
	primary: string;
	secondary: string;
	accent: string;

	// UI elements
	card: string;
	border: string;
	input: string;
	inputActive: string;

	// Status colors
	success: string;
	warning: string;
	error: string;
};

export type ThemeVariant = 'light' | 'dark';
export type ThemeName = 'default' | 'pastel' | 'vibrant';
export type ThemeMode = 'system' | 'light' | 'dark';

export type Theme = {
	name: ThemeName;
	variant: ThemeVariant;
	colors: ThemeColors;
};

// Default theme
const defaultLightTheme: ThemeColors = {
	background: '#ffffff',
	text: '#333333',
	primary: '#ff69b4', // Pink
	secondary: '#87ceeb', // Sky blue
	accent: '#ffb6c1', // Light pink
	card: '#f8f8f8',
	border: '#e0e0e0',
	input: '#f5f5f5',
	inputActive: '#ffffff',
	success: '#4caf50',
	warning: '#ff9800',
	error: '#f44336',
};

const defaultDarkTheme: ThemeColors = {
	background: '#121212',
	text: '#f5f5f5',
	primary: '#ff69b4', // Pink
	secondary: '#4a90e2', // Blue
	accent: '#d81b60', // Deep pink
	card: '#1e1e1e',
	border: '#333333',
	input: '#2c2c2c',
	inputActive: '#3a3a3a',
	success: '#4caf50',
	warning: '#ff9800',
	error: '#f44336',
};

// Pastel theme
const pastelLightTheme: ThemeColors = {
	background: '#f8f5f2',
	text: '#5d534f',
	primary: '#d4a5a5', // Pastel pink
	secondary: '#a5c0d4', // Pastel blue
	accent: '#a5d4a5', // Pastel green
	card: '#ffffff',
	border: '#e8e0d8',
	input: '#f0ebe6',
	inputActive: '#ffffff',
	success: '#a5d4a5',
	warning: '#d4c7a5',
	error: '#d4a5a5',
};

const pastelDarkTheme: ThemeColors = {
	background: '#2d2a2e',
	text: '#e8e0d8',
	primary: '#c9a0a0', // Dark pastel pink
	secondary: '#a0b8c9', // Dark pastel blue
	accent: '#a0c9a0', // Dark pastel green
	card: '#3a3639',
	border: '#4a464a',
	input: '#3a3639',
	inputActive: '#4a4649',
	success: '#a0c9a0',
	warning: '#c9bda0',
	error: '#c9a0a0',
};

// Vibrant theme
const vibrantLightTheme: ThemeColors = {
	background: '#ffffff',
	text: '#1a1a1a',
	primary: '#ff1493', // Deep pink
	secondary: '#00bfff', // Deep sky blue
	accent: '#32cd32', // Lime green
	card: '#f0f0f0',
	border: '#d0d0d0',
	input: '#f8f8f8',
	inputActive: '#ffffff',
	success: '#00cc44',
	warning: '#ffcc00',
	error: '#ff3333',
};

const vibrantDarkTheme: ThemeColors = {
	background: '#0a0a0a',
	text: '#ffffff',
	primary: '#ff1493', // Deep pink
	secondary: '#00bfff', // Deep sky blue
	accent: '#32cd32', // Lime green
	card: '#1a1a1a',
	border: '#2a2a2a',
	input: '#1f1f1f',
	inputActive: '#2a2a2a',
	success: '#00cc44',
	warning: '#ffcc00',
	error: '#ff3333',
};

// Theme collections
export const themes: Record<ThemeName, Record<ThemeVariant, ThemeColors>> = {
	default: {
		light: defaultLightTheme,
		dark: defaultDarkTheme,
	},
	pastel: {
		light: pastelLightTheme,
		dark: pastelDarkTheme,
	},
	vibrant: {
		light: vibrantLightTheme,
		dark: vibrantDarkTheme,
	},
};

// Helper function to get a theme
export function getTheme(name: ThemeName, variant: ThemeVariant): Theme {
	return {
		name,
		variant,
		colors: themes[name][variant],
	};
}
