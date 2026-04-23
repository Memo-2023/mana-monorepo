/**
 * Persona visual regression suite.
 *
 * Separate from the repo's main Playwright config (`../../playwright.config.ts`)
 * because this suite has different defaults: fewer viewports (baselines
 * cost disk + review time), tighter diff threshold, and a deterministic
 * animation/font-loading setup so the same code produces the same
 * pixels across runs.
 *
 * Plan: docs/plans/mana-mcp-and-personas.md (M5).
 */

import { defineConfig, devices } from '@playwright/test';

const BASE = process.env.PERSONAS_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
	testDir: './flows',
	// Baselines are stable across OS as long as `--project=…` is pinned
	// and the server is the same. Diff threshold is tight; expect a few
	// real-UI-change updates per week.
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.002,
			animations: 'disabled',
		},
	},
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}-{projectName}{ext}',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	// Avoid cross-contamination — each persona has its own storageState,
	// running in parallel is safe but keep it modest to not thrash mana-auth.
	workers: process.env.CI ? 2 : undefined,
	reporter: [['html', { outputFolder: 'playwright-report-personas' }], ['list']],
	use: {
		baseURL: BASE,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	// Two viewports as a starting point — one desktop, one mobile. Add
	// more later (iPad, large desktop) once the baselines are stable.
	projects: [
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
		},
		{ name: 'mobile', use: { ...devices['Pixel 5'] } },
	],
	// webServer stays OFF here — this suite expects the full local stack
	// (mana-auth, mana-sync, web app) to already be running. Persona
	// tests assume real data has been seeded; auto-starting only the web
	// app would give a meaningless pass. Run-recipe lives in README.md.
});
