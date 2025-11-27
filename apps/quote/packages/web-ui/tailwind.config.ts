import type { Config } from 'tailwindcss';

export default {
	content: [], // Will be extended by consuming apps
	darkMode: ['class', '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
					dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
				},
				secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
				background: 'rgb(var(--color-background) / <alpha-value>)',
				surface: {
					DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
					elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
				},
				text: {
					primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
					secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
					tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
				},
				border: {
					DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
					hover: 'rgb(var(--color-border-hover) / <alpha-value>)',
				},
				success: 'rgb(var(--color-success) / <alpha-value>)',
				warning: 'rgb(var(--color-warning) / <alpha-value>)',
				error: 'rgb(var(--color-error) / <alpha-value>)',
				info: 'rgb(var(--color-info) / <alpha-value>)',
			},
			spacing: {
				xs: 'var(--spacing-xs)',
				sm: 'var(--spacing-sm)',
				md: 'var(--spacing-md)',
				lg: 'var(--spacing-lg)',
				xl: 'var(--spacing-xl)',
				'2xl': 'var(--spacing-2xl)',
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				full: 'var(--radius-full)',
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				xl: 'var(--shadow-xl)',
			},
			transitionDuration: {
				fast: '150ms',
				base: '200ms',
				slow: '300ms',
			},
		},
	},
	plugins: [],
} satisfies Config;
