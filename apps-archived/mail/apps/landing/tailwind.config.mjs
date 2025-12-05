/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// ManaMail Indigo Theme
				primary: {
					DEFAULT: '#6366f1',
					hover: '#818cf8',
					glow: 'rgba(99, 102, 241, 0.3)',
				},
				background: {
					page: '#0c1425',
					card: '#131c2e',
					'card-hover': '#1e2942',
				},
				text: {
					primary: '#f9fafb',
					secondary: '#d1d5db',
					muted: '#6b7280',
				},
				border: {
					DEFAULT: '#1e2942',
					hover: '#2d3a56',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
