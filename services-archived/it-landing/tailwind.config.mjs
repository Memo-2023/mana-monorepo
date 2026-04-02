/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#003399',
					hover: '#002266',
					glow: 'rgba(0, 51, 153, 0.15)',
				},
				accent: {
					DEFAULT: '#FFCC00',
					hover: '#E6B800',
				},
				background: {
					page: '#f8f9fc',
					card: '#ffffff',
					'card-hover': '#f0f2f8',
				},
				text: {
					primary: '#1a1a2e',
					secondary: '#4a4a6a',
					muted: '#8888a0',
				},
				border: {
					DEFAULT: '#e2e4ec',
					hover: '#c8ccd8',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
