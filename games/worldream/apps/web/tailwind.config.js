/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class', '[data-theme="dark"]', '[data-theme="ocean"]'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Semantic color mappings using CSS variables
				theme: {
					// Primary colors
					primary: {
						50: 'var(--theme-primary-50)',
						100: 'var(--theme-primary-100)',
						200: 'var(--theme-primary-200)',
						300: 'var(--theme-primary-300)',
						400: 'var(--theme-primary-400)',
						500: 'var(--theme-primary-500)',
						600: 'var(--theme-primary-600)',
						700: 'var(--theme-primary-700)',
						800: 'var(--theme-primary-800)',
						900: 'var(--theme-primary-900)',
						950: 'var(--theme-primary-950)',
					},
					// Background colors
					bg: {
						base: 'var(--theme-background-base)',
						surface: 'var(--theme-background-surface)',
						elevated: 'var(--theme-background-elevated)',
						overlay: 'var(--theme-background-overlay)',
					},
					// Text colors
					text: {
						primary: 'var(--theme-text-primary)',
						secondary: 'var(--theme-text-secondary)',
						tertiary: 'var(--theme-text-tertiary)',
						inverse: 'var(--theme-text-inverse)',
					},
					// Border colors
					border: {
						DEFAULT: 'var(--theme-border-default)',
						subtle: 'var(--theme-border-subtle)',
						strong: 'var(--theme-border-strong)',
					},
					// State colors
					success: 'var(--theme-state-success)',
					warning: 'var(--theme-state-warning)',
					error: 'var(--theme-state-error)',
					info: 'var(--theme-state-info)',
					// Interactive states
					interactive: {
						hover: 'var(--theme-interactive-hover)',
						active: 'var(--theme-interactive-active)',
						focus: 'var(--theme-interactive-focus)',
						disabled: 'var(--theme-interactive-disabled)',
					},
				},
			},
			backgroundColor: {
				// Shorthand background utilities
				'theme-base': 'var(--theme-background-base)',
				'theme-surface': 'var(--theme-background-surface)',
				'theme-elevated': 'var(--theme-background-elevated)',
				'theme-overlay': 'var(--theme-background-overlay)',
			},
			textColor: {
				// Shorthand text utilities
				'theme-primary': 'var(--theme-text-primary)',
				'theme-secondary': 'var(--theme-text-secondary)',
				'theme-tertiary': 'var(--theme-text-tertiary)',
				'theme-inverse': 'var(--theme-text-inverse)',
			},
			borderColor: {
				// Shorthand border utilities
				'theme-default': 'var(--theme-border-default)',
				'theme-subtle': 'var(--theme-border-subtle)',
				'theme-strong': 'var(--theme-border-strong)',
			},
		},
	},
	plugins: [],
};
