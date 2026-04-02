import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['html']],

	use: {
		baseURL: 'http://localhost:5184',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		actionTimeout: 10000,
		navigationTimeout: 30000,
	},

	timeout: 60000,
	expect: { timeout: 5000 },

	projects: process.env.CI
		? [
				{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
				{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
				{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
			]
		: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

	webServer: {
		command: 'pnpm run build && pnpm run preview --port 5184',
		port: 5184,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},

	outputDir: 'test-results/',
});
