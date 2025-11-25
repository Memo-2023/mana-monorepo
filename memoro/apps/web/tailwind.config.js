import preset from '@manacore/shared-tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
	presets: [preset],
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'../../../packages/shared-ui/src/**/*.{html,js,svelte,ts}',
		'../../../packages/shared-auth-ui/src/**/*.{html,js,svelte,ts}'
	],
	plugins: [require('@tailwindcss/typography')]
};
