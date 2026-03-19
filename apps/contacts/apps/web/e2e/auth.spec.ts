import { test, expect } from '@playwright/test';

// Auth tests run WITHOUT storageState (unauthenticated)

// Helper: wait for the app to finish loading (skeleton disappears)
async function waitForAppReady(page: import('@playwright/test').Page) {
	await page.waitForFunction(
		() => {
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

	test('successful login redirects to contacts list', async ({ page }) => {
		const email = process.env.E2E_TEST_EMAIL || 'e2e-contacts@test.local';
		const password = process.env.E2E_TEST_PASSWORD || 'TestPassword123';

		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		page.on('requestfailed', (req) => {
			errors.push(`Request failed: ${req.url()} - ${req.failure()?.errorText}`);
		});

		await page.goto('/login');
		await waitForAppReady(page);

		const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
		const passwordInput = page
			.locator('input[type="password"], input[name="password"], #password')
			.first();

		await emailInput.fill(email);
		await passwordInput.fill(password);
		await page.locator('button[type="submit"]').click();

		try {
			await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
		} catch {
			console.log('Login errors:', errors);
			const authUrl = await page.evaluate(
				() => (window as any).__PUBLIC_MANA_CORE_AUTH_URL__ || 'NOT SET'
			);
			console.log('Auth URL on page:', authUrl);
			throw new Error(`Login did not redirect. Auth URL: ${authUrl}. Errors: ${errors.join('; ')}`);
		}
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
	});

	test('unauthenticated access redirects to /login', async ({ page }) => {
		await page.goto('/');

		// The app layout redirects unauthenticated users to /login
		await page.waitForURL(/\/login/, { timeout: 30000 });
	});
});
