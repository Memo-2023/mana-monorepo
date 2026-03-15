/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
	darkMode: 'class', // Enable class-based dark mode
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				primary: '#4CAF50',
				secondary: '#6366f1', // indigo-500
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
