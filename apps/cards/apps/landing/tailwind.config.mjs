/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// ManaDeck Purple Theme
				primary: {
					DEFAULT: '#7C3AED',
					hover: '#8B5CF6',
					glow: 'rgba(124, 58, 237, 0.3)',
				},
				background: {
					page: '#0f0a1a',
					card: '#1a1625',
					'card-hover': '#2d2640',
				},
				text: {
					primary: '#f9fafb',
					secondary: '#d1d5db',
					muted: '#6b7280',
				},
				border: {
					DEFAULT: '#3d3555',
					hover: '#4d4570',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
