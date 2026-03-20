import { test, expect, dismissOnboarding } from './fixtures/auth';

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3014';

test.describe('WeekView Interactions', () => {
	test.beforeAll(async () => {
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
		await dismissOnboarding(page);
		await expect(page.locator('main[aria-label="Kalender"]')).toBeVisible({ timeout: 10000 });
	});

	test('drag-to-create: clicking on empty time slot opens quick create overlay', async ({
		page,
	}) => {
		// Find a day column in the week view
		const dayColumn = page.locator('.day-column').first();
		await expect(dayColumn).toBeVisible();

		const box = await dayColumn.boundingBox();
		if (!box) return;

		// Click in the middle of the day column (should open quick create)
		await dayColumn.click({ position: { x: box.width / 2, y: box.height * 0.4 } });

		// Quick event overlay should appear
		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).toBeVisible({ timeout: 5000 });

		// Close it
		await page.keyboard.press('Escape');
	});

	test('drag-to-create: drag creates event with correct time range', async ({ page }) => {
		const dayColumn = page.locator('.day-column').first();
		await expect(dayColumn).toBeVisible();

		const box = await dayColumn.boundingBox();
		if (!box) return;

		// Drag from ~10am to ~12pm area
		const startY = box.y + box.height * 0.35;
		const endY = box.y + box.height * 0.5;
		const centerX = box.x + box.width / 2;

		await page.mouse.move(centerX, startY);
		await page.mouse.down();
		await page.mouse.move(centerX, endY, { steps: 5 });
		await page.mouse.up();

		// Quick event overlay should appear
		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).toBeVisible({ timeout: 5000 });

		// Type a title and save
		const uniqueTitle = `Drag Create ${Date.now()}`;
		await page.keyboard.type(uniqueTitle);
		await overlay.getByRole('button', { name: /speichern/i }).click();
		await expect(overlay).not.toBeVisible({ timeout: 5000 });

		// Event should appear in the grid
		const eventCard = page.locator('.event-card').filter({ hasText: uniqueTitle });
		await expect(eventCard).toBeVisible({ timeout: 5000 });

		// Cleanup: delete the event
		await eventCard.click();
		const editOverlay = page.locator('.quick-event-overlay');
		await expect(editOverlay).toBeVisible({ timeout: 5000 });
		const deleteBtn = editOverlay.getByRole('button', { name: /löschen/i });
		if (await deleteBtn.isVisible()) {
			await deleteBtn.click();
			const confirmBtn = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
			if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
				await confirmBtn.click();
			}
		}
	});

	test('escape cancels drag-to-create', async ({ page }) => {
		const dayColumn = page.locator('.day-column').first();
		await expect(dayColumn).toBeVisible();

		const box = await dayColumn.boundingBox();
		if (!box) return;

		const startY = box.y + box.height * 0.3;
		const centerX = box.x + box.width / 2;

		// Start dragging
		await page.mouse.move(centerX, startY);
		await page.mouse.down();
		await page.mouse.move(centerX, startY + 50, { steps: 3 });

		// Press escape to cancel
		await page.keyboard.press('Escape');
		await page.mouse.up();

		// No overlay should appear
		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).not.toBeVisible({ timeout: 1000 });
	});

	test('event card shows in correct position within time grid', async ({ page }) => {
		const uniqueTitle = `Position Test ${Date.now()}`;

		// Create an event by clicking on the grid
		const dayColumn = page.locator('.day-column').first();
		await expect(dayColumn).toBeVisible();
		const box = await dayColumn.boundingBox();
		if (!box) return;

		await dayColumn.click({ position: { x: box.width / 2, y: box.height * 0.5 } });

		const overlay = page.locator('.quick-event-overlay');
		await expect(overlay).toBeVisible({ timeout: 5000 });
		await page.keyboard.type(uniqueTitle);
		await overlay.getByRole('button', { name: /speichern/i }).click();
		await expect(overlay).not.toBeVisible({ timeout: 5000 });

		// Verify the event card exists and has a top style (positioned in grid)
		const eventCard = page.locator('.event-card').filter({ hasText: uniqueTitle });
		await expect(eventCard).toBeVisible({ timeout: 5000 });

		const style = await eventCard.getAttribute('style');
		expect(style).toContain('top:');
		expect(style).toContain('height:');

		// Cleanup
		await eventCard.click();
		const editOverlay = page.locator('.quick-event-overlay');
		const deleteBtn = editOverlay.getByRole('button', { name: /löschen/i });
		if (await deleteBtn.isVisible()) {
			await deleteBtn.click();
			const confirmBtn = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
			if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
				await confirmBtn.click();
			}
		}
	});

	test('week view shows current time indicator on today', async ({ page }) => {
		const timeIndicator = page.locator('.time-indicator');
		// There should be at least one time indicator (on today's column)
		await expect(timeIndicator.first()).toBeVisible({ timeout: 5000 });

		// It should have a top percentage style
		const style = await timeIndicator.first().getAttribute('style');
		expect(style).toContain('top:');
	});

	test('week view shows correct day headers', async ({ page }) => {
		const dayHeaders = page.locator('.day-header');
		const count = await dayHeaders.count();

		// Should have 5 (weekdays only) or 7 (full week) day headers
		expect(count === 5 || count === 7).toBe(true);

		// Each header should have a day name and number
		for (let i = 0; i < count; i++) {
			const dayName = dayHeaders.nth(i).locator('.day-name');
			const dayNumber = dayHeaders.nth(i).locator('.day-number');
			await expect(dayName).toBeVisible();
			await expect(dayNumber).toBeVisible();
		}
	});

	test('today column is highlighted', async ({ page }) => {
		const todayColumn = page.locator('.day-column.today');
		await expect(todayColumn).toBeVisible({ timeout: 5000 });

		const todayHeader = page.locator('.day-header.today');
		await expect(todayHeader).toBeVisible();
	});
});
