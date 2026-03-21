import { test, expect } from '@playwright/test';

// Helper: wait for the app to finish loading
async function waitForAppReady(page: import('@playwright/test').Page) {
	await page.waitForFunction(
		() => {
			const skeleton = document.querySelector('.app-loading-skeleton, [data-skeleton]');
			return !skeleton || skeleton.children.length === 0;
		},
		{ timeout: 30000 }
	);
	await page.waitForTimeout(500);
}

test.describe('Search', () => {
	test('search page renders with input field', async ({ page }) => {
		await page.goto('/search');
		await waitForAppReady(page);

		// Page heading
		const heading = page.locator('h1', { hasText: 'Suche' });
		await expect(heading).toBeVisible({ timeout: 10000 });

		// Search input field
		const searchInput = page.locator('input[type="search"]');
		await expect(searchInput).toBeVisible();
	});

	test('search input has correct type="search"', async ({ page }) => {
		await page.goto('/search');
		await waitForAppReady(page);

		const searchInput = page.locator('input[type="search"]');
		await expect(searchInput).toBeVisible({ timeout: 10000 });
		await expect(searchInput).toHaveAttribute('type', 'search');
		await expect(searchInput).toHaveAttribute('aria-label', 'Dateien und Ordner durchsuchen');
	});

	test('empty search shows initial state message', async ({ page }) => {
		await page.goto('/search');
		await waitForAppReady(page);

		// When no search has been performed, the initial state should show
		const initialMessage = page.locator('.empty-state h2', {
			hasText: 'Dateien durchsuchen',
		});
		await expect(initialMessage).toBeVisible({ timeout: 10000 });

		const hintText = page.locator('.empty-state p', {
			hasText: 'Gib einen Suchbegriff ein',
		});
		await expect(hintText).toBeVisible();
	});

	test('search button exists and is disabled when input is empty', async ({ page }) => {
		await page.goto('/search');
		await waitForAppReady(page);

		// The search bar has a submit button
		const searchButton = page.locator('.search-bar button', { hasText: 'Suchen' });
		await expect(searchButton).toBeVisible({ timeout: 10000 });

		// Button should be disabled when input is empty
		await expect(searchButton).toBeDisabled();

		// Type something into the search input
		const searchInput = page.locator('input[type="search"]');
		await searchInput.fill('test query');

		// Button should now be enabled
		await expect(searchButton).toBeEnabled();

		// Clear the input
		await searchInput.fill('');

		// Button should be disabled again
		await expect(searchButton).toBeDisabled();
	});
});
