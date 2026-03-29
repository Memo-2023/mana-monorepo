/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// uLoad Professional Blue Theme (Light)
				primary: {
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
					DEFAULT: '#3b82f6',
					hover: '#2563eb',
					glow: 'rgba(59, 130, 246, 0.2)',
				},
				background: {
					page: '#ffffff',
					card: '#f9fafb',
					'card-hover': '#f3f4f6',
				},
				text: {
					primary: '#111827',
					secondary: '#4b5563',
					muted: '#6b7280',
				},
				border: {
					DEFAULT: '#e5e7eb',
					hover: '#d1d5db',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
