import { Theme } from '~/types/theme';

export const sunsetTheme: Theme = {
	name: 'sunset',
	displayName: 'Sonnenuntergang',
	description: 'Warme orange und rosa Töne',
	light: {
		background: '135 115 105', // darker warm peach pastel background
		foreground: '0 0 0', // pure black for maximum readability
		surface: '165 145 130', // lighter warm peach pastel surface
		surfaceElevated: '190 175 165', // soft warm peach pastel elevated
		muted: '254 215 170', // orange-200
		mutedForeground: '0 0 0', // pure black for muted text
		primary: '251 146 60', // orange-400
		primaryForeground: '255 255 255', // white
		secondary: '253 186 116', // orange-300
		secondaryForeground: '0 0 0', // pure black
		accent: '236 72 153', // pink-500
		accentForeground: '255 255 255', // white
		destructive: '239 68 68', // red-500
		destructiveForeground: '255 255 255', // white
		border: '253 186 116', // orange-300
		input: '253 186 116', // orange-300
		ring: '251 146 60', // orange-400
	},
	dark: {
		background: '12 10 9', // stone-950
		foreground: '255 255 255', // pure white for maximum readability
		surface: '68 64 60', // stone-600
		surfaceElevated: '87 83 78', // stone-500
		muted: '120 113 108', // stone-400
		mutedForeground: '255 255 255', // pure white for muted text
		primary: '251 146 60', // orange-400
		primaryForeground: '0 0 0', // pure black
		secondary: '68 64 60', // stone-600
		secondaryForeground: '255 255 255', // pure white
		accent: '244 114 182', // pink-400
		accentForeground: '0 0 0', // pure black
		destructive: '248 113 113', // red-400
		destructiveForeground: '0 0 0', // pure black
		border: '68 64 60', // stone-600
		input: '68 64 60', // stone-600
		ring: '251 146 60', // orange-400
	},
};
