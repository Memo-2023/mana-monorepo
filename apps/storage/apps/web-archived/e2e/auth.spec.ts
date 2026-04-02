import { test, expect } from '@playwright/test';

// Auth tests run WITHOUT storageState (unauthenticated)

// Helper: wait for the app to finish loading (skeleton disappears)
async function waitForAppReady(page: import('@playwright/test').Page) {
	// The root layout shows a loading spinner until auth initializes
	// Wait for it to disappear and the actual page content to render
	await page.waitForFunction(
		() => {
			// Check if loading skeleton is gone
			const skeleton = document.querySelector('.app-loading-skeleton, [data-skeleton]');
			return !skeleton || skeleton.children.length === 0;
		},
		{ timeout: 30000 }
	);
	// Give Svelte time to render
	await page.waitForTimeout(500);
}

test.describe('Authentication', () => {
	test('login page renders with email and password fields', async ({ page }) => {
		await page.goto('/login');
		await waitForAppReady(page);

		// LoginPage uses id="email" and id="password" (from shared-auth-ui)
		const emailInput = page.locator('input[type="email"], input[name="email"], #email');
		const passwordInput = page.locator('input[type="password"], input[name="password"], #password');

		await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
		await expect(passwordInput.first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('invalid credentials show error message', async ({ page }) => {
		await page.goto('/login');
		await waitForAppReady(page);

		const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
		const passwordInput = page
			.locator('input[type="password"], input[name="password"], #password')
			.first();

		await emailInput.fill('nonexistent@test.local');
		await passwordInput.fill('WrongPassword123!');
		await page.locator('button[type="submit"]').click();

		// Error alert should appear
		const errorAlert = page.locator('#form-error, [role="alert"]');
		await expect(errorAlert.first()).toBeVisible({ timeout: 10000 });
	});

	test('unauthenticated access to /files redirects to /login', async ({ page }) => {
		await page.goto('/files');

		// The app layout's onMount redirects unauthenticated users to /login
		await page.waitForURL(/\/login/, { timeout: 30000 });
	});
});
