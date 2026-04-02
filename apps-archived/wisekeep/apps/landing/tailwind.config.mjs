/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class', // Enables class-based dark mode
	theme: {
		extend: {
			colors: {
				// Theme colors will use CSS variables for dynamic theming
				theme: {
					primary: 'rgb(var(--color-primary) / <alpha-value>)',
					'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
					secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
					accent: 'rgb(var(--color-accent) / <alpha-value>)',
					background: 'rgb(var(--color-background) / <alpha-value>)',
					surface: 'rgb(var(--color-surface) / <alpha-value>)',
					'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
					text: 'rgb(var(--color-text) / <alpha-value>)',
					'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
					border: 'rgb(var(--color-border) / <alpha-value>)',
				},
			},
			backgroundColor: {
				base: 'rgb(var(--color-background) / <alpha-value>)',
				surface: 'rgb(var(--color-surface) / <alpha-value>)',
			},
			textColor: {
				base: 'rgb(var(--color-text) / <alpha-value>)',
				muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
			},
			borderColor: {
				base: 'rgb(var(--color-border) / <alpha-value>)',
			},
			ringColor: {
				primary: 'rgb(var(--color-primary) / <alpha-value>)',
			},
			fontFamily: {
				sans: [
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'sans-serif',
				],
				mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'pulse-soft': 'pulseSoft 2s infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				pulseSoft: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
			},
			boxShadow: {
				'theme-sm': '0 1px 2px 0 rgb(var(--color-shadow) / 0.05)',
				'theme-md': '0 4px 6px -1px rgb(var(--color-shadow) / 0.1)',
				'theme-lg': '0 10px 15px -3px rgb(var(--color-shadow) / 0.1)',
				'theme-xl': '0 20px 25px -5px rgb(var(--color-shadow) / 0.1)',
			},
		},
	},
	plugins: [],
};
