import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage',
			exclude: [
				'node_modules/',
				'dist/',
				'build/',
				'.next/',
				'.svelte-kit/',
				'.astro/',
				'**/*.config.*',
				'**/*.d.ts',
				'**/types/**',
				'**/__tests__/**',
				'**/__mocks__/**',
				'**/test/**',
			],
			thresholds: {
				lines: 50,
				functions: 50,
				branches: 50,
				statements: 50,
			},
		},
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 10000,
		isolate: true,
		include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['node_modules', 'dist', 'build', '.next', '.svelte-kit', '.astro'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@manacore': path.resolve(__dirname, './packages'),
		},
	},
});
