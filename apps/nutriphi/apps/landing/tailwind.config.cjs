/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#22C55E',
					hover: '#16A34A',
					light: '#86EFAC',
				},
				secondary: '#F97316',
				accent: '#14B8A6',
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
