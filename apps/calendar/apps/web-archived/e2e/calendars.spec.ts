import { test, expect } from './fixtures/auth';

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3014';

test.describe('Calendar Management', () => {
	test.beforeAll(async () => {
		// Skip all calendar management tests if the backend is not running
		try {
			const res = await fetch(`${BACKEND_URL}/api/v1/health`, {
				signal: AbortSignal.timeout(3000),
			});
			if (!res.ok) test.skip(true, 'Calendar backend is not running');
		} catch {
			test.skip(true, 'Calendar backend is not reachable');
		}
	});

	test('default calendar exists on first load', async ({ page }) => {
		await page.goto('/settings');
		await expect(page.getByRole('heading', { name: 'Einstellungen', exact: true })).toBeVisible();

		// The calendar list should have at least one calendar with "Standard" badge
		const defaultBadge = page.locator('.badge-primary', { hasText: 'Standard' });
		await expect(defaultBadge).toBeVisible({ timeout: 10000 });
	});

	test('create new calendar with name and color', async ({ page }) => {
		const calendarName = `E2E Calendar ${Date.now()}`;

		await page.goto('/settings');
		await expect(page.getByRole('heading', { name: 'Einstellungen', exact: true })).toBeVisible();

		// Click "Neuer Kalender" button
		const newCalButton = page.getByRole('button', { name: /neuer kalender/i });
		await expect(newCalButton).toBeVisible({ timeout: 10000 });
		await newCalButton.click();

		// Fill in the calendar name
		const nameInput = page.locator('.new-calendar-form input[type="text"]');
		await expect(nameInput).toBeVisible();
		await nameInput.fill(calendarName);

		// Submit the form
		const createButton = page.getByRole('button', { name: /erstellen/i });
		await createButton.click();

		// Verify the new calendar appears in the list
		const calendarCard = page.locator('.calendar-card', { hasText: calendarName });
		await expect(calendarCard).toBeVisible({ timeout: 5000 });

		// Cleanup: delete the calendar
		page.on('dialog', (dialog) => dialog.accept());
		const deleteButton = calendarCard.getByRole('button', { name: /löschen/i });
		await deleteButton.click();
		await expect(calendarCard).not.toBeVisible({ timeout: 5000 });
	});

	test('toggle calendar visibility in sidebar', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('main[aria-label="Kalender"]')).toBeVisible({ timeout: 10000 });

		const calendarSelector = page.locator('.pill-calendar-selector, .calendar-selector');

		if (await calendarSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
			const toggles = calendarSelector.locator('button, input[type="checkbox"]');
			const count = await toggles.count();

			if (count > 0) {
				await toggles.first().click();
				await page.waitForTimeout(500);
				await toggles.first().click();
			}
		}
	});

	test('delete non-default calendar from settings', async ({ page }) => {
		const calendarName = `E2E Delete Test ${Date.now()}`;

		await page.goto('/settings');
		await expect(page.getByRole('heading', { name: 'Einstellungen', exact: true })).toBeVisible();

		// Create a calendar first
		await page.getByRole('button', { name: /neuer kalender/i }).click();
		await page.locator('.new-calendar-form input[type="text"]').fill(calendarName);
		await page.getByRole('button', { name: /erstellen/i }).click();

		const calendarCard = page.locator('.calendar-card', { hasText: calendarName });
		await expect(calendarCard).toBeVisible({ timeout: 5000 });

		page.on('dialog', (dialog) => dialog.accept());

		const deleteButton = calendarCard.getByRole('button', { name: /löschen/i });
		await expect(deleteButton).toBeVisible();
		await deleteButton.click();

		await expect(calendarCard).not.toBeVisible({ timeout: 5000 });
	});
});
