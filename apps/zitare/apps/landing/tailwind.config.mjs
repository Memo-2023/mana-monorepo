/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// Zitare Purple/Indigo Theme
				primary: {
					DEFAULT: '#8b5cf6',
					hover: '#a78bfa',
					glow: 'rgba(139, 92, 246, 0.3)',
				},
				background: {
					page: '#0f0d1a',
					card: '#1a1625',
					'card-hover': '#252033',
				},
				text: {
					primary: '#f9fafb',
					secondary: '#d1d5db',
					muted: '#6b7280',
				},
				border: {
					DEFAULT: '#2d2640',
					hover: '#3d3555',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				serif: ['Merriweather', 'Georgia', 'serif'],
			},
		},
	},
	plugins: [],
};
