/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}'
	],
	theme: {
		extend: {
			colors: {
				// Calendar app theme - ocean blue
				primary: {
					DEFAULT: '#0ea5e9',
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
					950: '#082f49'
				},
				dark: {
					bg: '#0a0a0a',
					surface: '#111111',
					card: '#1a1a1a',
					border: '#262626'
				},
				// CSS variable mappings for shared-landing-ui compatibility
				background: {
					page: 'var(--color-background-page, #0a0a0a)',
					card: 'var(--color-background-card, #1a1a1a)',
					'card-hover': 'var(--color-background-card-hover, #242424)'
				},
				text: {
					primary: 'var(--color-text-primary, #ffffff)',
					secondary: 'var(--color-text-secondary, #d1d5db)',
					muted: 'var(--color-text-muted, #9ca3af)'
				},
				border: {
					DEFAULT: 'var(--color-border, #262626)',
					hover: 'var(--color-border-hover, #3f3f3f)'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
