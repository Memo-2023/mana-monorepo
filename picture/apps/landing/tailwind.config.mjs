import preset from '@picture/design-tokens/tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
	presets: [preset],
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {}
	},
	plugins: [
		require('@tailwindcss/typography')
	]
};
