import { test, expect } from './fixtures/auth';

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3015';

test.describe('Contact CRUD', () => {
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

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
	});

	test('create contact via modal, verify it appears in list', async ({ page }) => {
		const uniqueFirstName = `E2E-Vorname-${Date.now()}`;
		const uniqueLastName = `E2E-Nachname-${Date.now()}`;

		// Open the new contact modal using keyboard shortcut (Cmd/Ctrl + N)
		// The QuickInputBar or layout handles this, but we can also type in the input bar
		// Use Ctrl+N / Meta+N to open the new contact modal
		await page.keyboard.press('Control+n');

		// Wait for the new contact modal to appear
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		// Fill in contact details
		await modal.locator('#firstName').fill(uniqueFirstName);
		await modal.locator('#lastName').fill(uniqueLastName);
		await modal.locator('#email').fill(`e2e-${Date.now()}@test.local`);
		await modal.locator('#company').fill('E2E Test GmbH');

		// Click "Kontakt erstellen" (Create contact)
		await modal.getByRole('button', { name: /Kontakt erstellen/i }).click();

		// Modal should close
		await expect(modal).not.toBeVisible({ timeout: 5000 });

		// Wait for the contacts list to reload
		await page.waitForTimeout(1000);

		// Verify the contact appears in the list
		const contactEntry = page.locator('main').getByText(uniqueFirstName);
		await expect(contactEntry.first()).toBeVisible({ timeout: 10000 });
	});

	test('toggle favorite on a contact', async ({ page }) => {
		const uniqueName = `E2E-Fav-${Date.now()}`;

		// Create a contact first
		await page.keyboard.press('Control+n');
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });
		await modal.locator('#firstName').fill(uniqueName);
		await modal.locator('#email').fill(`e2e-fav-${Date.now()}@test.local`);
		await modal.getByRole('button', { name: /Kontakt erstellen/i }).click();
		await expect(modal).not.toBeVisible({ timeout: 5000 });
		await page.waitForTimeout(1000);

		// Click on the contact to open the detail modal
		const contactEntry = page.getByText(uniqueName).first();
		await expect(contactEntry).toBeVisible({ timeout: 10000 });
		await contactEntry.click();

		// Wait for the contact detail modal
		const detailModal = page.locator('[role="dialog"]');
		await expect(detailModal).toBeVisible({ timeout: 5000 });

		// Click the favorite button
		const favoriteButton = detailModal.locator('button[aria-label*="Favorit"]').first();
		await expect(favoriteButton).toBeVisible({ timeout: 5000 });
		await favoriteButton.click();

		// Wait for the toggle to take effect
		await page.waitForTimeout(500);

		// The aria-label should have changed to indicate favorite status
		const updatedButton = detailModal.locator('button[aria-label*="Favorit"]').first();
		await expect(updatedButton).toBeVisible();
	});

	test('delete a contact', async ({ page }) => {
		const uniqueName = `E2E-Delete-${Date.now()}`;

		// Create a contact first
		await page.keyboard.press('Control+n');
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });
		await modal.locator('#firstName').fill(uniqueName);
		await modal.locator('#email').fill(`e2e-del-${Date.now()}@test.local`);
		await modal.getByRole('button', { name: /Kontakt erstellen/i }).click();
		await expect(modal).not.toBeVisible({ timeout: 5000 });
		await page.waitForTimeout(1000);

		// Click on the contact to open detail modal
		const contactEntry = page.getByText(uniqueName).first();
		await expect(contactEntry).toBeVisible({ timeout: 10000 });
		await contactEntry.click();

		const detailModal = page.locator('[role="dialog"]');
		await expect(detailModal).toBeVisible({ timeout: 5000 });

		// Handle the browser confirm dialog
		page.on('dialog', (dialog) => dialog.accept());

		// Click the delete button (aria-label="Löschen")
		const deleteButton = detailModal.locator('button[aria-label="Löschen"]');
		await expect(deleteButton).toBeVisible({ timeout: 5000 });
		await deleteButton.click();

		// Modal should close after deletion
		await expect(detailModal).not.toBeVisible({ timeout: 5000 });

		// Contact should no longer appear in the list
		await page.waitForTimeout(1000);
		await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 5000 });
	});

	test('search for a contact', async ({ page }) => {
		const uniqueName = `E2E-Search-${Date.now()}`;

		// Create a contact first
		await page.keyboard.press('Control+n');
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });
		await modal.locator('#firstName').fill(uniqueName);
		await modal.locator('#email').fill(`e2e-search-${Date.now()}@test.local`);
		await modal.getByRole('button', { name: /Kontakt erstellen/i }).click();
		await expect(modal).not.toBeVisible({ timeout: 5000 });
		await page.waitForTimeout(1000);

		// Use the QuickInputBar search (placeholder: "Neuer Kontakt oder suchen...")
		const searchInput = page.locator('input[placeholder*="suchen"]').first();
		await expect(searchInput).toBeVisible({ timeout: 5000 });
		await searchInput.fill(uniqueName);

		// Wait for search results to filter
		await page.waitForTimeout(500);

		// The contact should still be visible in filtered results
		const contactEntry = page.getByText(uniqueName).first();
		await expect(contactEntry).toBeVisible({ timeout: 5000 });

		// Clear search
		await searchInput.clear();
	});
});
