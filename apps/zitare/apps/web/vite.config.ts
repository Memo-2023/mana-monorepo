import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: [
			'@zitare/shared',
			'@zitare/web-ui',
			'@zitare/content',
			'@manacore/shared-ui',
		],
	},
	optimizeDeps: {
		exclude: [
			'@zitare/shared',
			'@zitare/web-ui',
			'@zitare/content',
			'@manacore/shared-ui',
		],
	},
});
