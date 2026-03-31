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
			handleHttpError: ({ path, message }) => {
				// Ignore missing PNG assets (app only provides favicon.svg)
				if (path.endsWith('.png')) return;
				throw new Error(message);
			},
		},
	},
};

export default config;
