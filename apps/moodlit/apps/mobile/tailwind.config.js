/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				'card-dark': '#2a2a2a',
			},
		},
	},
	plugins: [],
};
