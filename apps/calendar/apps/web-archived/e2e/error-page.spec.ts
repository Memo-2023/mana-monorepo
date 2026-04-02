import { test, expect } from '@playwright/test';

test.describe('Error Page', () => {
	test('visiting a nonexistent route shows error page with status code', async ({ page }) => {
		const response = await page.goto('/nonexistent-route-that-does-not-exist');

		// SvelteKit should return a 404 status
		expect(response?.status()).toBe(404);

		// The error page should display the status code
		const statusHeading = page.locator('h1');
		await expect(statusHeading).toBeVisible({ timeout: 10000 });
		await expect(statusHeading).toContainText('404');

		// Should show a "back to home" link
		const backLink = page.locator('a[href="/"]');
		await expect(backLink).toBeVisible();
	});
});
