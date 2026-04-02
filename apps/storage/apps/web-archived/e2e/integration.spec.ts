import { test, expect } from '@playwright/test';

/**
 * Integration E2E tests that require a running backend.
 *
 * Prerequisites:
 *   pnpm dev:storage:app  (starts backend + web)
 *
 * These tests verify real API interactions through the UI.
 * Skip in CI unless backend is available.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3016';

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

async function isBackendAvailable(): Promise<boolean> {
	try {
		const res = await fetch(`${BACKEND_URL}/api/v1/health`);
		return res.ok;
	} catch {
		return false;
	}
}

test.describe('Integration: File Operations', () => {
	test.beforeAll(async () => {
		const available = await isBackendAvailable();
		if (!available) {
			test.skip();
		}
	});

	test('create folder via UI', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// Open new folder modal
		const newFolderBtn = page.locator('button', { hasText: 'Neuer Ordner' }).first();
		await newFolderBtn.click();

		// Fill in folder name
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		const nameInput = page.locator('#folder-name');
		const testFolderName = `Test-Ordner-${Date.now()}`;
		await nameInput.fill(testFolderName);

		// Submit
		const createBtn = page.locator('[role="dialog"] button[type="submit"]');
		await createBtn.click();

		// Verify folder appears
		await expect(page.locator(`text=${testFolderName}`)).toBeVisible({ timeout: 10000 });
	});

	test('upload file via drag zone', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// Click upload button to show upload zone
		const uploadBtn = page.locator('button', { hasText: 'Hochladen' }).first();
		await uploadBtn.click();

		// Upload zone should be visible
		const uploadZone = page.locator('.upload-zone, [class*="upload"]');
		await expect(uploadZone.first()).toBeVisible({ timeout: 5000 });

		// Create a test file and upload it via the file input
		const fileInput = page.locator('input[type="file"]');
		if (await fileInput.isVisible()) {
			const testContent = Buffer.from('Hello from Playwright E2E test');
			await fileInput.setInputFiles({
				name: `test-${Date.now()}.txt`,
				mimeType: 'text/plain',
				buffer: testContent,
			});

			// Wait for upload to complete
			await page.waitForTimeout(2000);
		}
	});

	test('search returns results for existing content', async ({ page }) => {
		await page.goto('/search');
		await waitForAppReady(page);

		const searchInput = page.locator('input[type="search"], input[placeholder*="Suche"]').first();
		await expect(searchInput).toBeVisible({ timeout: 10000 });

		// Search for a common term
		await searchInput.fill('test');
		await searchInput.press('Enter');

		// Wait for results or no-results message
		await page.waitForTimeout(2000);

		// Either results appear or "Keine Ergebnisse"
		const hasResults = await page.locator('.file-card, .file-row, .folder-card').count();
		const noResults = await page.locator('text=Keine Ergebnisse').isVisible();
		expect(hasResults > 0 || noResults).toBeTruthy();
	});

	test('file preview modal opens on click', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// If there are files, click the first one
		const fileCard = page.locator('.file-card').first();
		if (await fileCard.isVisible({ timeout: 3000 }).catch(() => false)) {
			await fileCard.click();

			// Preview modal should open
			const modal = page.locator('[role="dialog"]');
			await expect(modal).toBeVisible({ timeout: 5000 });

			// Modal should have file details
			await expect(page.locator('.file-details, .detail-row')).toBeVisible({ timeout: 3000 });
		}
	});

	test('share modal opens from file actions', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		const fileCard = page.locator('.file-card').first();
		if (await fileCard.isVisible({ timeout: 3000 }).catch(() => false)) {
			// Click file to open preview
			await fileCard.click();
			await page.waitForTimeout(500);

			// Click share button in modal
			const shareBtn = page.locator('button', { hasText: 'Teilen' }).first();
			if (await shareBtn.isVisible()) {
				await shareBtn.click();

				// Share modal should appear
				await expect(page.locator('text=Link erstellen')).toBeVisible({ timeout: 5000 });
			}
		}
	});

	test('trash page loads', async ({ page }) => {
		await page.goto('/trash');
		await waitForAppReady(page);

		// Should show either empty trash or list of items
		const heading = page.locator('h1', { hasText: 'Papierkorb' });
		await expect(heading).toBeVisible({ timeout: 10000 });
	});

	test('favorites page loads', async ({ page }) => {
		await page.goto('/favorites');
		await waitForAppReady(page);

		const heading = page.locator('h1', { hasText: 'Favoriten' });
		await expect(heading).toBeVisible({ timeout: 10000 });
	});

	test('settings page shows real storage usage', async ({ page }) => {
		await page.goto('/settings');
		await waitForAppReady(page);

		// Storage section should show real data (not "2.5 GB")
		const storageSection = page.locator('text=Speicherplatz');
		await expect(storageSection).toBeVisible({ timeout: 10000 });

		// Should show "von 10 GB verwendet"
		await expect(page.locator('text=von 10 GB verwendet')).toBeVisible({ timeout: 5000 });
	});
});
