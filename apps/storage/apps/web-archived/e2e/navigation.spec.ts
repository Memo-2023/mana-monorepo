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

test.describe('Navigation', () => {
	test('all nav items exist: Dateien, Geteilt, Favoriten, Papierkorb, Suche', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// The PillNavigation renders navigation links
		const navItems = ['Dateien', 'Geteilt', 'Favoriten', 'Papierkorb', 'Suche'];

		for (const label of navItems) {
			const navLink = page.locator(`a, button`, { hasText: label }).first();
			await expect(navLink).toBeVisible({ timeout: 10000 });
		}
	});

	test('clicking navigation items changes URL', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// Navigate to Favoriten
		const favoritesLink = page.locator('a[href="/favorites"]').first();
		await favoritesLink.click();
		await expect(page).toHaveURL(/\/favorites/);

		// Navigate to Papierkorb
		const trashLink = page.locator('a[href="/trash"]').first();
		await trashLink.click();
		await expect(page).toHaveURL(/\/trash/);

		// Navigate to Suche
		const searchLink = page.locator('a[href="/search"]').first();
		await searchLink.click();
		await expect(page).toHaveURL(/\/search/);

		// Navigate back to Dateien
		const filesLink = page.locator('a[href="/files"]').first();
		await filesLink.click();
		await expect(page).toHaveURL(/\/files/);
	});

	test('search page has search input', async ({ page }) => {
		await page.goto('/search');
		await waitForAppReady(page);

		const searchInput = page.locator('input[type="search"]');
		await expect(searchInput).toBeVisible({ timeout: 10000 });
		await expect(searchInput).toHaveAttribute('placeholder', 'Dateien und Ordner durchsuchen...');
	});

	test('trash page shows "Papierkorb" heading', async ({ page }) => {
		await page.goto('/trash');
		await waitForAppReady(page);

		const heading = page.locator('h1', { hasText: 'Papierkorb' });
		await expect(heading).toBeVisible({ timeout: 10000 });
	});

	test('settings page loads', async ({ page }) => {
		await page.goto('/settings');
		await waitForAppReady(page);

		// The settings page has a title "Einstellungen"
		const heading = page.getByText('Einstellungen', { exact: false }).first();
		await expect(heading).toBeVisible({ timeout: 10000 });
	});

	test('offline page renders correctly', async ({ page }) => {
		await page.goto('/offline');

		// The offline page shows either "Du bist offline" or "Verbindung wiederhergestellt"
		// Since we are connected during tests, it may redirect
		// But we can check the page title
		await expect(page).toHaveTitle(/Offline - Storage/);

		// The page should contain the offline heading or redirect message
		const offlineHeading = page.locator('h1');
		await expect(offlineHeading).toBeVisible({ timeout: 10000 });

		// Should show one of the expected texts
		const headingText = await offlineHeading.textContent();
		expect(
			headingText === 'Du bist offline' || headingText === 'Verbindung wiederhergestellt!'
		).toBeTruthy();
	});
});
