/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
	presets: [require('nativewind/preset')],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				background: 'rgb(var(--background) / <alpha-value>)',
				foreground: 'rgb(var(--foreground) / <alpha-value>)',
				surface: {
					DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
					elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
				},
				muted: {
					DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
					foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
				},
				primary: {
					DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
					foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
					dark: 'rgb(var(--primary-dark) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
					foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
					dark: 'rgb(var(--secondary-dark) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
					foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
					dark: 'rgb(var(--accent-dark) / <alpha-value>)',
				},
				destructive: {
					DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
					foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
				},
				border: {
					DEFAULT: 'rgb(var(--border) / <alpha-value>)',
					muted: 'rgb(var(--border-muted) / <alpha-value>)',
				},
				input: 'rgb(var(--input) / <alpha-value>)',
				ring: 'rgb(var(--ring) / <alpha-value>)',

				rarity: {
					common: {
						DEFAULT: 'rgb(var(--rarity-common) / <alpha-value>)',
						foreground: 'rgb(var(--rarity-common-foreground) / <alpha-value>)',
					},
					rare: {
						DEFAULT: 'rgb(var(--rarity-rare) / <alpha-value>)',
						foreground: 'rgb(var(--rarity-rare-foreground) / <alpha-value>)',
					},
					epic: {
						DEFAULT: 'rgb(var(--rarity-epic) / <alpha-value>)',
						foreground: 'rgb(var(--rarity-epic-foreground) / <alpha-value>)',
					},
					legendary: {
						DEFAULT: 'rgb(var(--rarity-legendary) / <alpha-value>)',
						foreground: 'rgb(var(--rarity-legendary-foreground) / <alpha-value>)',
					},
				},
			},
			borderWidth: {
				3: '3px',
			},
		},
	},
	plugins: [],
};
