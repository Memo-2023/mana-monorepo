import preset from '@manacore/shared-tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
	presets: [preset],
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'../../packages/shared-ui/src/**/*.{html,js,svelte,ts}',
		'../../packages/shared-auth-ui/src/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {
			colors: {
				// ManaCore specific primary blue
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#0055FF',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554'
				}
			}
		}
	}
};
