/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
	presets: [require('nativewind/preset')],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Light Mode Colors
				primary: '#0A84FF',
				secondary: '#5E5CE6',
				background: '#F2F2F7',
				card: '#FFFFFF',
				textColor: '#000000',
				border: '#E5E5EA',
				notification: '#FF3B30',
				placeholder: '#8E8E93',
				accent: '#34C759',
				muted: '#C7C7CC',

				// Dark Mode Colors für die dark: Variante
				dark: {
					primary: '#0A84FF',
					secondary: '#5E5CE6',
					background: '#1C1C1E',
					card: '#2C2C2E',
					textColor: '#FFFFFF',
					border: '#38383A',
					notification: '#FF453A',
					placeholder: '#8E8E93',
					accent: '#30D158',
					muted: '#48484A',
				},
			},
			fontFamily: {
				sans: ['System', 'sans-serif'],
			},
			spacing: {
				xs: '4px',
				sm: '8px',
				md: '16px',
				lg: '24px',
				xl: '32px',
				'2xl': '48px',
				'3xl': '64px',
			},
			borderRadius: {
				none: '0',
				sm: '4px',
				DEFAULT: '8px',
				md: '12px',
				lg: '16px',
				xl: '24px',
				full: '9999px',
			},
		},
	},
	plugins: [],
};
