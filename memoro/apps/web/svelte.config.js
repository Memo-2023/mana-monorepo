import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Netlify adapter for SSR with server-side POST handling (required for Apple Sign-In)
		adapter: adapter({
			edge: false, // Use Node-based Netlify Functions (better for OAuth)
			split: false // Single function for all routes (simpler deployment)
		}),
		// Disable built-in CSRF check - we'll handle it in hooks.server.ts
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
