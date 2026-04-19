import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'json-summary'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,svelte}'],
			exclude: ['src/**/*.{test,spec}.{ts,js}', 'src/**/*.d.ts', 'src/test/**', 'src/**/index.ts'],
		},
	},
	resolve: {
		conditions: ['browser'],
	},
});
