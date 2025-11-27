import { ThemeDefinition } from './types';

/**
 * Ocean Theme (Teal/Cyan)
 * Fresh, calming design with teal-cyan palette
 */
export const oceanTheme: ThemeDefinition = {
	name: 'ocean',
	displayName: 'Ocean',

	// Dark Mode
	dark: {
		mode: 'dark',
		colors: {
			// Backgrounds
			background: '#020617', // slate-950
			surface: '#0f172a', // slate-900
			elevated: '#1e293b', // slate-800
			overlay: 'rgba(2, 6, 23, 0.8)',

			// Borders
			border: '#334155', // slate-700
			divider: '#1e293b', // slate-800

			// Input
			input: {
				background: '#0f172a',
				border: '#334155',
				text: '#e0f2fe', // sky-100
				placeholder: '#0c4a6e', // sky-900
			},

			// Text
			text: {
				primary: '#e0f2fe', // sky-100
				secondary: '#7dd3fc', // sky-300
				tertiary: '#38bdf8', // sky-400
				disabled: '#0c4a6e', // sky-900
				inverse: '#020617',
			},

			// Primary (Teal)
			primary: {
				default: '#2dd4bf', // teal-400
				hover: '#5eead4', // teal-300
				active: '#14b8a6', // teal-500
				light: '#99f6e4', // teal-200
				dark: '#0d9488', // teal-600
				contrast: '#ffffff',
			},

			// Secondary (Cyan)
			secondary: {
				default: '#22d3ee', // cyan-400
				light: '#67e8f9', // cyan-300
				dark: '#06b6d4', // cyan-500
				contrast: '#ffffff',
			},

			// Status
			success: '#10b981', // emerald-500
			warning: '#fbbf24', // amber-400
			error: '#f43f5e', // rose-500
			info: '#0ea5e9', // sky-500

			// Semantic
			favorite: '#f43f5e', // rose-500
			like: '#f43f5e', // rose-500
			tag: '#2dd4bf', // teal-400

			// Special
			skeleton: '#1e293b', // slate-800
			shimmer: '#334155', // slate-700
		},

		shadows: {
			sm: {
				shadowColor: '#14b8a6',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
				elevation: 2,
			},
			md: {
				shadowColor: '#14b8a6',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.15,
				shadowRadius: 6,
				elevation: 4,
			},
			lg: {
				shadowColor: '#14b8a6',
				shadowOffset: { width: 0, height: 10 },
				shadowOpacity: 0.2,
				shadowRadius: 15,
				elevation: 8,
			},
		},

		opacity: {
			disabled: 0.5,
			overlay: 0.8,
			hover: 0.9,
			pressed: 0.7,
		},
	},

	// Light Mode
	light: {
		mode: 'light',
		colors: {
			// Backgrounds
			background: '#f0fdfa', // teal-50
			surface: '#ffffff',
			elevated: '#ccfbf1', // teal-100
			overlay: 'rgba(0, 0, 0, 0.5)',

			// Borders
			border: '#99f6e4', // teal-200
			divider: '#ccfbf1', // teal-100

			// Input
			input: {
				background: '#ffffff',
				border: '#5eead4', // teal-300
				text: '#134e4a', // teal-900
				placeholder: '#0f766e', // teal-700
			},

			// Text
			text: {
				primary: '#134e4a', // teal-900
				secondary: '#115e59', // teal-800
				tertiary: '#0f766e', // teal-700
				disabled: '#5eead4', // teal-300
				inverse: '#ffffff',
			},

			// Primary (Teal)
			primary: {
				default: '#14b8a6', // teal-500
				hover: '#0d9488', // teal-600
				active: '#0f766e', // teal-700
				light: '#2dd4bf', // teal-400
				dark: '#115e59', // teal-800
				contrast: '#ffffff',
			},

			// Secondary (Cyan)
			secondary: {
				default: '#06b6d4', // cyan-500
				light: '#22d3ee', // cyan-400
				dark: '#0891b2', // cyan-600
				contrast: '#ffffff',
			},

			// Status
			success: '#10b981', // emerald-500
			warning: '#f59e0b', // amber-500
			error: '#f43f5e', // rose-500
			info: '#0ea5e9', // sky-500

			// Semantic
			favorite: '#f43f5e', // rose-500
			like: '#f43f5e', // rose-500
			tag: '#14b8a6', // teal-500

			// Special
			skeleton: '#99f6e4', // teal-200
			shimmer: '#ccfbf1', // teal-100
		},

		shadows: {
			sm: {
				shadowColor: '#14b8a6',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
				elevation: 2,
			},
			md: {
				shadowColor: '#14b8a6',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.15,
				shadowRadius: 6,
				elevation: 4,
			},
			lg: {
				shadowColor: '#14b8a6',
				shadowOffset: { width: 0, height: 10 },
				shadowOpacity: 0.2,
				shadowRadius: 15,
				elevation: 8,
			},
		},

		opacity: {
			disabled: 0.5,
			overlay: 0.5,
			hover: 0.9,
			pressed: 0.7,
		},
	},
};
