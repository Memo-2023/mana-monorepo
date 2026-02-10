/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
	presets: [require('nativewind/preset')],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#6C5CE7',
				secondary: '#A29BFE',
				background: '#F8F9FA',
				card: '#FFFFFF',
				textColor: '#2D3436',
				border: '#DFE6E9',
				accent: '#00B894',
				muted: '#B2BEC3',

				dark: {
					primary: '#A29BFE',
					secondary: '#6C5CE7',
					background: '#1A1A2E',
					card: '#16213E',
					textColor: '#FFFFFF',
					border: '#2D3436',
					accent: '#55EFC4',
					muted: '#636E72',
				},
			},
		},
	},
	plugins: [],
};
