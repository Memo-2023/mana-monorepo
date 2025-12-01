/**
 * Vitest configuration for SvelteKit web projects
 *
 * Usage in web vitest.config.ts:
 * import { defineConfig, mergeConfig } from 'vitest/config';
 * import svelteConfig from '@manacore/test-config/vitest-svelte';
 * import { sveltekit } from '@sveltejs/kit/vite';
 *
 * export default mergeConfig(
 *   svelteConfig,
 *   defineConfig({
 *     plugins: [sveltekit()],
 *     // Your overrides
 *   })
 * );
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Test file patterns
		include: ['src/**/*.{test,spec}.{js,ts}'],

		// Exclude patterns
		exclude: ['node_modules/**', 'e2e/**', 'build/**', '.svelte-kit/**', '**/*.d.ts'],

		// Test environment for browser APIs
		environment: 'jsdom',

		// Global test APIs
		globals: true,

		// Setup files
		setupFiles: ['./vitest.setup.ts'],

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/**/*.{js,ts,svelte}'],
			exclude: [
				'**/*.d.ts',
				'**/*.config.*',
				'**/mockData/**',
				'**/__tests__/**',
				'**/node_modules/**',
				'**/build/**',
				'**/.svelte-kit/**',
				'**/coverage/**',
				'src/routes/**/+*.ts', // Exclude SvelteKit route files from coverage (tested via E2E)
				'src/routes/**/+*.server.ts', // Test these explicitly
			],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
			all: true,
		},

		// Test timeout
		testTimeout: 10000,

		// Hooks timeout
		hookTimeout: 10000,

		// Reporters
		reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],

		// Mock reset
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,

		// Browser mode (optional - for testing Svelte components in real browser)
		// browser: {
		//   enabled: false, // Enable when needed
		//   name: 'chromium',
		//   provider: 'playwright',
		// },
	},

	// Resolve aliases (adjust based on your SvelteKit config)
	resolve: {
		alias: {
			$lib: '/src/lib',
			$app: '/.svelte-kit/runtime/app',
		},
	},
});
