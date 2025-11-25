import preset from '@picture/design-tokens/tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
	presets: [preset],
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}'
	],
	theme: {
		extend: {
			colors: {
				// CSS variable mappings for shared-landing-ui compatibility
				background: {
					page: 'var(--color-background-page, #000000)',
					card: 'var(--color-background-card, #1a1a1a)',
					'card-hover': 'var(--color-background-card-hover, #242424)'
				},
				text: {
					primary: 'var(--color-text-primary, #ffffff)',
					secondary: 'var(--color-text-secondary, #d1d5db)',
					muted: 'var(--color-text-muted, #9ca3af)'
				},
				border: {
					DEFAULT: 'var(--color-border, #383838)',
					hover: 'var(--color-border-hover, #4f4f4f)'
				}
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography')
	]
};
