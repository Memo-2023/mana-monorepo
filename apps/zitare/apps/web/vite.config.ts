import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5177,
		strictPort: true,
	},
	ssr: {
		noExternal: [
			'@zitare/shared',
			'@zitare/web-ui',
			'@zitare/content',
			'@manacore/shared-icons',
			'@manacore/shared-ui',
			'@manacore/shared-tailwind',
			'@manacore/shared-theme',
			'@manacore/shared-theme-ui',
		],
	},
	optimizeDeps: {
		exclude: [
			'@zitare/shared',
			'@zitare/web-ui',
			'@zitare/content',
			'@manacore/shared-icons',
			'@manacore/shared-ui',
			'@manacore/shared-tailwind',
			'@manacore/shared-theme',
			'@manacore/shared-theme-ui',
		],
	},
});
