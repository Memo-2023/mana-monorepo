import { test, expect } from './fixtures/auth';

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3015';

test.describe('Tags', () => {
	test.beforeAll(async () => {
		// Skip all tests if the backend is not running
		try {
			const res = await fetch(`${BACKEND_URL}/api/v1/health`, {
				signal: AbortSignal.timeout(3000),
			});
			if (!res.ok) test.skip(true, 'Contacts backend is not running');
		} catch {
			test.skip(true, 'Contacts backend is not reachable');
		}
	});

	test('navigate to tags page and create a new tag', async ({ page }) => {
		// Navigate to the tags page
		await page.goto('/tags');
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });

		const uniqueTagName = `E2E-Tag-${Date.now()}`;

		// Click the add button (Plus icon button with aria-label for new tag)
		const addButton = page.locator('button[aria-label*="Tag"], button[aria-label*="tag"]').first();
		await expect(addButton).toBeVisible({ timeout: 5000 });
		await addButton.click();

		// Wait for the tag edit modal to appear
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		// Fill in the tag name
		const nameInput = modal.locator('input').first();
		await expect(nameInput).toBeVisible({ timeout: 3000 });
		await nameInput.fill(uniqueTagName);

		// Click "Erstellen" (Create) button
		const createButton = modal.getByRole('button', { name: /Erstellen/i });
		await expect(createButton).toBeVisible({ timeout: 3000 });
		await createButton.click();

		// Modal should close
		await expect(modal).not.toBeVisible({ timeout: 5000 });

		// Verify the tag appears in the list
		const tagEntry = page.getByText(uniqueTagName);
		await expect(tagEntry.first()).toBeVisible({ timeout: 10000 });
	});

	test('search for a tag', async ({ page }) => {
		await page.goto('/tags');
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });

		const uniqueTagName = `E2E-SearchTag-${Date.now()}`;

		// Create a tag first
		const addButton = page.locator('button[aria-label*="Tag"], button[aria-label*="tag"]').first();
		await addButton.click();

		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });
		const nameInput = modal.locator('input').first();
		await nameInput.fill(uniqueTagName);
		await modal.getByRole('button', { name: /Erstellen/i }).click();
		await expect(modal).not.toBeVisible({ timeout: 5000 });

		// Use the search input (placeholder: "Tags durchsuchen...")
		const searchInput = page.locator('input[placeholder*="durchsuchen"]').first();
		await expect(searchInput).toBeVisible({ timeout: 5000 });
		await searchInput.fill(uniqueTagName);

		// Wait for filtering
		await page.waitForTimeout(500);

		// Tag should be visible in filtered results
		const tagEntry = page.getByText(uniqueTagName);
		await expect(tagEntry.first()).toBeVisible({ timeout: 5000 });
	});
});
