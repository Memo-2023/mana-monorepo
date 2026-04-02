import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build',
		}),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore missing favicon during prerender
				if (path === '/favicon.png') return;
				throw new Error(message);
			},
		},
	},
};

export default config;
