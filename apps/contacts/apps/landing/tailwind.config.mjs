/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// Contacts app theme - blue
				primary: {
					DEFAULT: '#3b82f6',
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554',
				},
				dark: {
					bg: '#0a0a0a',
					surface: '#111111',
					card: '#1a1a1a',
					border: '#262626',
				},
				// CSS variable mappings for shared-landing-ui compatibility
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
