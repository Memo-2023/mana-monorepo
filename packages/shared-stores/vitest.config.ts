import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
	},
	resolve: {
		conditions: ['browser'],
		alias: {
			'$app/environment': new URL('./src/test/mock-environment.ts', import.meta.url).pathname,
		},
	},
});
