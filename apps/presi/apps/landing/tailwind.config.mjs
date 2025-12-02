/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#f97316',
					hover: '#fb923c',
					glow: 'rgba(249, 115, 22, 0.3)',
				},
				background: {
					page: '#0a0a0f',
					card: '#141419',
					'card-hover': '#1c1c24',
				},
				text: {
					primary: '#f9fafb',
					secondary: '#d1d5db',
					muted: '#6b7280',
				},
				border: {
					DEFAULT: '#27272a',
					hover: '#3f3f46',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
