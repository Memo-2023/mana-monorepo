/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				background: '#0f0f0f',
				surface: '#1a1a1a',
				border: '#2a2a2a',
				primary: '#7c6bff',
				'primary-foreground': '#ffffff',
				muted: '#6b7280',
				foreground: '#f9fafb',
				'muted-foreground': '#9ca3af',
				destructive: '#ef4444',
			},
		},
	},
	plugins: [],
};
