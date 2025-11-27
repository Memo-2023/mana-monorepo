/**
 * @memoro/design-tokens - Ocean Theme
 *
 * Ocean theme with Teal/Cyan palette.
 * Fresh, calming design.
 */

import { baseColors, semanticColors } from '../colors';
import { shadows, opacity } from '../shadows';

// Additional colors for ocean theme
const oceanColors = {
	teal: {
		200: '#99f6e4',
		300: '#5eead4',
		400: '#2dd4bf',
		500: '#14b8a6',
		600: '#0d9488',
	},
	cyan: {
		300: '#67e8f9',
		400: '#22d3ee',
		500: '#06b6d4',
	},
	slate: {
		700: '#334155',
		800: '#1e293b',
		900: '#0f172a',
		950: '#020617',
	},
};

export const oceanTheme = {
	name: 'ocean' as const,
	displayName: 'Ocean',

	colors: {
		light: semanticColors.light, // Uses default light mode

		dark: {
			...semanticColors.dark,

			// Override backgrounds for cooler tone
			background: oceanColors.slate[950],
			surface: oceanColors.slate[900],
			elevated: oceanColors.slate[800],

			// Override borders
			border: oceanColors.slate[700],
			divider: oceanColors.slate[800],

			// Override input
			input: {
				background: oceanColors.slate[900],
				border: oceanColors.slate[700],
				text: '#e0f2fe', // sky-100
				placeholder: '#0c4a6e', // sky-900
			},

			// Override text colors (cooler)
			text: {
				primary: '#e0f2fe', // sky-100
				secondary: '#7dd3fc', // sky-300
				tertiary: '#38bdf8', // sky-400
				disabled: '#0c4a6e', // sky-900
				inverse: oceanColors.slate[950],
			},

			// Primary: Teal
			primary: {
				default: oceanColors.teal[400],
				hover: oceanColors.teal[300],
				active: oceanColors.teal[500],
				light: oceanColors.teal[200],
				dark: oceanColors.teal[600],
				contrast: baseColors.white,
			},

			// Secondary: Cyan
			secondary: {
				default: oceanColors.cyan[400],
				light: oceanColors.cyan[300],
				dark: oceanColors.cyan[500],
				contrast: baseColors.white,
			},

			// Status
			success: baseColors.emerald[500],
			warning: '#fbbf24', // amber-400
			error: '#f43f5e', // rose-500
			info: '#0ea5e9', // sky-500

			// Semantic
			favorite: '#f43f5e', // rose-500
			like: '#f43f5e', // rose-500
			tag: oceanColors.teal[400],

			// Special
			skeleton: oceanColors.slate[800],
			shimmer: oceanColors.slate[700],
		},
	},

	shadows,
	opacity,
} as const;

export type OceanTheme = typeof oceanTheme;
