/**
 * Base Vitest configuration for shared packages
 *
 * Usage in package vitest.config.ts:
 * import { defineConfig, mergeConfig } from 'vitest/config';
 * import baseConfig from '@manacore/test-config/vitest-base';
 *
 * export default mergeConfig(
 *   baseConfig,
 *   defineConfig({
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
		exclude: [
			'node_modules/**',
			'dist/**',
			'**/*.d.ts',
			'**/__tests__/fixtures/**',
			'**/__tests__/utils/**',
		],

		// Test environment
		environment: 'node',

		// Global test APIs (describe, it, expect, etc.)
		globals: true,

		// Setup files
		setupFiles: ['./vitest.setup.ts'],

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/**/*.{js,ts}'],
			exclude: [
				'**/*.d.ts',
				'**/*.config.*',
				'**/__tests__/**',
				'**/node_modules/**',
				'**/dist/**',
				'**/coverage/**',
				'**/*.types.ts',
				'**/index.ts', // Usually just re-exports
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

		// Teardown timeout
		teardownTimeout: 10000,

		// Reporters
		reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],

		// Mock reset
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,

		// Fail on console errors
		onConsoleLog: (log: string, type: 'stdout' | 'stderr'): false | void => {
			if (type === 'stderr' && log.includes('Error')) {
				return false; // Fail test on console errors
			}
		},
	},

	// Resolve aliases
	resolve: {
		alias: {
			'@': '/src',
		},
	},
});
