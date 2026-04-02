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

test.describe('File Management', () => {
	test('root page (/) redirects to /files', async ({ page }) => {
		await page.goto('/');

		// The root +page.svelte does goto('/files') on mount
		await page.waitForURL(/\/files/, { timeout: 15000 });
	});

	test('files page shows "Meine Dateien" heading', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		const heading = page.locator('h1', { hasText: 'Meine Dateien' });
		await expect(heading).toBeVisible({ timeout: 10000 });
	});

	test('files page has view toggle buttons (grid/list)', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		const gridButton = page.locator('button[aria-label="Rasteransicht"]');
		const listButton = page.locator('button[aria-label="Listenansicht"]');

		await expect(gridButton).toBeVisible({ timeout: 10000 });
		await expect(listButton).toBeVisible();
	});

	test('files page has "Hochladen" and "Neuer Ordner" buttons', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		const uploadButton = page.locator('button', { hasText: 'Hochladen' });
		const newFolderButton = page.locator('button', { hasText: 'Neuer Ordner' });

		await expect(uploadButton).toBeVisible({ timeout: 10000 });
		await expect(newFolderButton).toBeVisible();
	});

	test('clicking "Neuer Ordner" opens modal with name input', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// Click the "Neuer Ordner" button
		const newFolderButton = page.locator('button', { hasText: 'Neuer Ordner' }).first();
		await newFolderButton.click();

		// Modal should appear with role="dialog"
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		// Modal should have the title "Neuer Ordner"
		const modalTitle = page.locator('#modal-title');
		await expect(modalTitle).toHaveText('Neuer Ordner');

		// Modal should have a folder name input
		const nameInput = page.locator('#folder-name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveAttribute('type', 'text');

		// Modal should have a submit button
		const createButton = page.locator('[role="dialog"] button[type="submit"]');
		await expect(createButton).toBeVisible();
		await expect(createButton).toHaveText('Erstellen');
	});

	test('empty state shows upload prompt', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		// When no files exist, the empty state should show
		// It may show loading first, then empty state or file list
		// We check for either empty state or file content
		const emptyState = page.locator('.empty-state');
		const fileContent = page.locator('.files-page');

		await expect(fileContent).toBeVisible({ timeout: 10000 });

		// If empty state is visible, verify its content
		if (await emptyState.isVisible()) {
			const emptyHeading = page.locator('.empty-state h2', { hasText: 'Noch keine Dateien' });
			await expect(emptyHeading).toBeVisible();

			const emptyText = page.locator('.empty-state p', {
				hasText: 'Lade deine ersten Dateien hoch',
			});
			await expect(emptyText).toBeVisible();
		}
	});

	test('view toggle switches between grid and list view', async ({ page }) => {
		await page.goto('/files');
		await waitForAppReady(page);

		const gridButton = page.locator('button[aria-label="Rasteransicht"]');
		const listButton = page.locator('button[aria-label="Listenansicht"]');

		// Click list view button
		await listButton.click();
		await expect(listButton).toHaveClass(/active/);

		// Click grid view button
		await gridButton.click();
		await expect(gridButton).toHaveClass(/active/);
	});
});
