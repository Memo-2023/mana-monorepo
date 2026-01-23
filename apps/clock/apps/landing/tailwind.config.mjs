/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// Clock app theme - amber/orange
				primary: {
					DEFAULT: '#f59e0b',
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
				dark: {
					bg: '#0a0a0a',
					surface: '#111111',
					card: '#1a1a1a',
					border: '#262626',
				},
				background: {
					page: 'var(--color-background-page, #0a0a0a)',
					card: 'var(--color-background-card, #1a1a1a)',
					'card-hover': 'var(--color-background-card-hover, #242424)',
				},
				text: {
					primary: 'var(--color-text-primary, #ffffff)',
					secondary: 'var(--color-text-secondary, #d1d5db)',
					muted: 'var(--color-text-muted, #9ca3af)',
				},
				border: {
					DEFAULT: 'var(--color-border, #262626)',
					hover: 'var(--color-border-hover, #3f3f3f)',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
