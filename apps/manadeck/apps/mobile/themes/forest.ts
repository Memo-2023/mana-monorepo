import { Theme } from '~/types/theme';

export const forestTheme: Theme = {
	name: 'forest',
	displayName: 'Wald',
	description: 'Naturinspirierte grüne Töne',
	light: {
		background: '110 135 120', // darker green pastel background
		foreground: '0 0 0', // pure black for maximum readability
		surface: '145 165 150', // lighter green pastel surface
		surfaceElevated: '176 190 180', // soft green pastel elevated
		muted: '220 252 231', // green-100
		mutedForeground: '0 0 0', // pure black for muted text
		primary: '34 197 94', // green-500
		primaryForeground: '255 255 255', // white
		secondary: '187 247 208', // green-200
		secondaryForeground: '0 0 0', // pure black
		accent: '132 204 22', // lime-500
		accentForeground: '255 255 255', // white
		destructive: '239 68 68', // red-500
		destructiveForeground: '255 255 255', // white
		border: '187 247 208', // green-200
		input: '187 247 208', // green-200
		ring: '34 197 94', // green-500
	},
	dark: {
		background: '5 20 7', // emerald-950
		foreground: '255 255 255', // pure white for maximum readability
		surface: '6 78 59', // emerald-800
		surfaceElevated: '16 185 129', // emerald-500 (darker)
		muted: '52 211 153', // emerald-400
		mutedForeground: '255 255 255', // pure white for muted text
		primary: '52 211 153', // emerald-400
		primaryForeground: '0 0 0', // pure black
		secondary: '6 78 59', // emerald-800
		secondaryForeground: '255 255 255', // pure white
		accent: '163 230 53', // lime-400
		accentForeground: '0 0 0', // pure black
		destructive: '248 113 113', // red-400
		destructiveForeground: '0 0 0', // pure black
		border: '6 78 59', // emerald-800
		input: '6 78 59', // emerald-800
		ring: '52 211 153', // emerald-400
	},
};
