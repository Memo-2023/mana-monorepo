/**
 * Base Playwright configuration for E2E tests
 *
 * Usage in project playwright.config.ts:
 * import { defineConfig, devices } from '@playwright/test';
 * import baseConfig from '@manacore/test-config/playwright';
 *
 * export default defineConfig({
 *   ...baseConfig,
 *   use: {
 *     ...baseConfig.use,
 *     baseURL: 'http://localhost:5173',
 *   },
 *   // Your overrides
 * });
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Test directory
	testDir: './e2e',

	// Run tests in parallel
	fullyParallel: true,

	// Fail build on CI if you accidentally left test.only
	forbidOnly: !!process.env.CI,

	// Retry on CI
	retries: process.env.CI ? 2 : 0,

	// Number of workers
	workers: process.env.CI ? 1 : undefined,

	// Reporter to use
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['html']],

	// Shared settings for all projects
	use: {
		// Base URL for navigation
		baseURL: 'http://localhost:5173',

		// Collect trace on first retry
		trace: 'on-first-retry',

		// Screenshot on failure
		screenshot: 'only-on-failure',

		// Video on first retry
		video: 'retain-on-failure',

		// Timeout for actions
		actionTimeout: 10000,

		// Navigation timeout
		navigationTimeout: 30000,
	},

	// Test timeout
	timeout: 60000,

	// Expect timeout
	expect: {
		timeout: 5000,
	},

	// Projects to run tests on
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		// Mobile viewports
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],

	// Web server to start before tests
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 5173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},

	// Output directory for test results
	outputDir: 'test-results/',

	// Global setup/teardown
	// globalSetup: require.resolve('./e2e/global-setup.ts'),
	// globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
