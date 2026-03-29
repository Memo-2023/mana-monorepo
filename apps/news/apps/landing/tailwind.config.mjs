/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// News Hub Purple/Indigo Theme
				primary: {
					DEFAULT: '#6366f1',
					hover: '#818cf8',
					glow: 'rgba(99, 102, 241, 0.3)',
				},
				background: {
					page: '#0f0f1a',
					card: '#1a1a2e',
					'card-hover': '#252542',
				},
				text: {
					primary: '#f9fafb',
					secondary: '#d1d5db',
					muted: '#6b7280',
				},
				border: {
					DEFAULT: '#252542',
					hover: '#3a3a5c',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
