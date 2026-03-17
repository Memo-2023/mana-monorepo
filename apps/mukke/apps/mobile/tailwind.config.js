/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
	darkMode: 'class',
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				primary: '#FF6B35',
				'primary-dark': '#E55A2B',
				accent: '#FF8F65',
				background: {
					light: '#FFFFFF',
					dark: '#121212',
				},
				text: {
					light: '#000000',
					dark: '#FFFFFF',
				},
			},
		},
	},
	plugins: [],
};
