import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-calendar@test.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123';
const AUTH_URL = process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, '..', '.auth-state.json');

/**
 * Ensures a test user exists via the auth API.
 */
async function ensureTestUser(): Promise<void> {
	try {
		const res = await fetch(`${AUTH_URL}/api/v1/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'E2E Test User' }),
		});
		if (!res.ok && res.status !== 409 && res.status !== 422) {
			const body = await res.text();
			console.warn(`Register returned ${res.status}: ${body}`);
		}
	} catch {
		// User may already exist
	}

	try {
		await fetch(`${AUTH_URL}/api/v1/auth/verify-email-dev`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: TEST_EMAIL }),
		});
	} catch {
		// Verification endpoint may not exist
	}
}

async function waitForAppReady(page: Page): Promise<void> {
	await page.waitForFunction(
		() => document.querySelector('main, form, input[type="email"], #email') !== null,
		{ timeout: 30000 }
	);
}

/**
 * Dismiss the onboarding modal by clicking "Überspringen".
 * Waits briefly for it to appear, then dismisses it.
 */
async function dismissOnboarding(page: Page): Promise<void> {
	try {
		const skipButton = page.getByText('Überspringen', { exact: true });
		await skipButton.waitFor({ state: 'visible', timeout: 3000 });
		await skipButton.click();
		// Wait for modal to close
		await page.locator('.fixed.inset-0.z-50').waitFor({ state: 'hidden', timeout: 5000 });
	} catch {
		// No onboarding modal — that's fine
	}
}

function hasValidStorageState(): boolean {
	try {
		const stat = fs.statSync(STORAGE_STATE_PATH);
		const ageMs = Date.now() - stat.mtimeMs;
		if (ageMs > 60 * 60 * 1000) return false;
		const content = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf-8'));
		return content.origins?.length > 0;
	} catch {
		return false;
	}
}

async function loginViaUI(page: Page): Promise<void> {
	await page.goto('/login');
	await waitForAppReady(page);

	const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
	const passwordInput = page
		.locator('input[type="password"], input[name="password"], #password')
		.first();

	await emailInput.fill(TEST_EMAIL);
	await passwordInput.fill(TEST_PASSWORD);
	await page.locator('button[type="submit"]').click();

	await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
	await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });

	// Dismiss onboarding wizard if it appears
	await dismissOnboarding(page);
}

/**
 * Extended test fixture that provides an authenticated page.
 */
export const test = base.extend<object, { workerStorageState: string }>({
	workerStorageState: [
		async ({ browser }, use) => {
			if (hasValidStorageState()) {
				await use(STORAGE_STATE_PATH);
				return;
			}

			await ensureTestUser();

			const context = await browser.newContext();
			const page = await context.newPage();
			await loginViaUI(page);

			await context.storageState({ path: STORAGE_STATE_PATH });
			await page.close();
			await context.close();

			await use(STORAGE_STATE_PATH);
		},
		{ scope: 'worker' },
	],

	context: async ({ browser, workerStorageState }, use) => {
		const context = await browser.newContext({ storageState: workerStorageState });
		await use(context);
		await context.close();
	},

	page: async ({ context }, use) => {
		const page = await context.newPage();
		await use(page);
	},
});

export { expect, dismissOnboarding };
