import { test, expect } from './fixtures/auth';

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3014';

test.describe('Event CRUD', () => {
	test.beforeAll(async () => {
		// Skip all event tests if the backend is not running
		try {
			const res = await fetch(`${BACKEND_URL}/api/v1/health`, {
				signal: AbortSignal.timeout(3000),
			});
			if (!res.ok) test.skip(true, 'Calendar backend is not running');
		} catch {
			test.skip(true, 'Calendar backend is not reachable');
		}
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('main[aria-label="Kalender"]')).toBeVisible({ timeout: 10000 });
	});

	test('create event via quick overlay, see it in view, then delete it', async ({ page }) => {
		const uniqueTitle = `E2E Test Event ${Date.now()}`;

		// Click on a time slot in the week view to trigger quick create
		const weekGrid = page.locator('.week-grid, .carousel-page.current .week-grid');
		if (await weekGrid.first().isVisible()) {
			const box = await weekGrid.first().boundingBox();
			if (box) {
				await weekGrid.first().click({
					position: { x: box.width * 0.5, y: box.height * 0.3 },
				});
			}
		}

		// Wait for the quick event overlay to appear
		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).toBeVisible({ timeout: 5000 });

		// Type the event title (the title input is auto-focused)
		await page.keyboard.type(uniqueTitle);

		// Click "Speichern" (Save)
		await overlay.getByRole('button', { name: /speichern/i }).click();
		await expect(overlay).not.toBeVisible({ timeout: 5000 });

		// Verify the event appears in the calendar view
		const eventCard = page.locator('.event-card, .event-block').filter({ hasText: uniqueTitle });
		await expect(eventCard).toBeVisible({ timeout: 5000 });

		// Click the event to open it
		await eventCard.click();

		// The quick event overlay should open with event details
		const editOverlay = page.locator('.quick-event-overlay');
		await expect(editOverlay).toBeVisible({ timeout: 5000 });

		// Delete the event
		const deleteButton = editOverlay.getByRole('button', { name: /löschen/i });
		if (await deleteButton.isVisible()) {
			await deleteButton.click();

			const confirmButton = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
			if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
				await confirmButton.click();
			}

			await expect(eventCard).not.toBeVisible({ timeout: 5000 });
		}
	});

	test('edit event title and verify update', async ({ page }) => {
		const originalTitle = `E2E Edit Test ${Date.now()}`;
		const updatedTitle = `${originalTitle} Updated`;

		// Create an event first via the grid
		const weekGrid = page.locator('.week-grid, .carousel-page.current .week-grid');
		if (await weekGrid.first().isVisible()) {
			const box = await weekGrid.first().boundingBox();
			if (box) {
				await weekGrid.first().click({
					position: { x: box.width * 0.5, y: box.height * 0.4 },
				});
			}
		}

		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).toBeVisible({ timeout: 5000 });
		await page.keyboard.type(originalTitle);
		await overlay.getByRole('button', { name: /speichern/i }).click();
		await expect(overlay).not.toBeVisible({ timeout: 5000 });

		// Find and click the created event
		const eventCard = page.locator('.event-card, .event-block').filter({ hasText: originalTitle });
		await expect(eventCard).toBeVisible({ timeout: 5000 });
		await eventCard.click();

		// Edit the title
		const editOverlay = page.locator('.quick-event-overlay');
		await expect(editOverlay).toBeVisible({ timeout: 5000 });

		const titleInput = editOverlay.locator('input[type="text"]').first();
		await expect(titleInput).toHaveValue(originalTitle);

		await titleInput.clear();
		await titleInput.fill(updatedTitle);

		await editOverlay.getByRole('button', { name: /speichern/i }).click();
		await expect(editOverlay).not.toBeVisible({ timeout: 5000 });

		// Verify updated title is visible
		const updatedCard = page.locator('.event-card, .event-block').filter({ hasText: updatedTitle });
		await expect(updatedCard).toBeVisible({ timeout: 5000 });

		// Cleanup: delete the event
		await updatedCard.click();
		const cleanupOverlay = page.locator('.quick-event-overlay');
		await expect(cleanupOverlay).toBeVisible({ timeout: 5000 });
		const deleteBtn = cleanupOverlay.getByRole('button', { name: /löschen/i });
		if (await deleteBtn.isVisible()) {
			await deleteBtn.click();
			const confirmBtn = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
			if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
				await confirmBtn.click();
			}
		}
	});

	test('click event to open detail overlay', async ({ page }) => {
		const title = `E2E Detail Test ${Date.now()}`;

		// Create an event
		const weekGrid = page.locator('.week-grid, .carousel-page.current .week-grid');
		if (await weekGrid.first().isVisible()) {
			const box = await weekGrid.first().boundingBox();
			if (box) {
				await weekGrid.first().click({
					position: { x: box.width * 0.5, y: box.height * 0.5 },
				});
			}
		}

		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).toBeVisible({ timeout: 5000 });
		await page.keyboard.type(title);
		await overlay.getByRole('button', { name: /speichern/i }).click();
		await expect(overlay).not.toBeVisible({ timeout: 5000 });

		// Click the event to see details
		const eventCard = page.locator('.event-card, .event-block').filter({ hasText: title });
		await expect(eventCard).toBeVisible({ timeout: 5000 });
		await eventCard.click();

		const detailOverlay = page.locator('.quick-event-overlay');
		await expect(detailOverlay).toBeVisible({ timeout: 5000 });
		const titleInput = detailOverlay.locator('input[type="text"]').first();
		await expect(titleInput).toHaveValue(title);

		// Close and cleanup
		await detailOverlay.getByRole('button', { name: /abbrechen/i }).click();
		await expect(detailOverlay).not.toBeVisible({ timeout: 5000 });

		await eventCard.click();
		const cleanupOverlay = page.locator('.quick-event-overlay');
		const deleteBtn = cleanupOverlay.getByRole('button', { name: /löschen/i });
		if (await deleteBtn.isVisible()) {
			await deleteBtn.click();
			const confirmBtn = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
			if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
				await confirmBtn.click();
			}
		}
	});
});
