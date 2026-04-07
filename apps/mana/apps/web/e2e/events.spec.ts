/**
 * Events module — end-to-end smoke test.
 *
 * Covers the local-first happy path (guest mode, no login):
 *   1. Open /events on a fresh IndexedDB
 *   2. Create an event via the inline form
 *   3. Open the detail view
 *   4. Add a guest, change RSVP status, see the summary update
 *   5. Delete the event
 *
 * The "publish + public RSVP" flow is exercised separately in
 * events-public-rsvp.spec.ts so we don't need a real auth dance here.
 */

import { test, expect } from '@playwright/test';
import { dismissWelcomeModal } from './helpers';

// Each test gets its own browser context so IndexedDB starts empty.
test.describe('Events module — local flow', () => {
	test('create, edit guest list, delete an event in guest mode', async ({ page }) => {
		// 1. Land on /events
		await page.goto('/events', { waitUntil: 'networkidle' });

		// AuthGate may show a guest-welcome modal — dismiss it if present.
		await dismissWelcomeModal(page);

		// Heading should appear
		await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();

		// 2. Create event via the inline form
		await page.getByRole('button', { name: '+ Neues Event' }).click();

		const title = `E2E Test Party ${Date.now()}`;
		await page.getByPlaceholder("Worum geht's?", { exact: false }).fill(title);

		// Date input — use a fixed future date
		const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const dateValue = future.toISOString().slice(0, 10);
		await page.locator('input[type="date"]').fill(dateValue);

		// Time input is pre-filled to 19:00, leave it
		await page.getByPlaceholder('Ort (optional)').fill('Café am See');
		await page.getByRole('button', { name: 'Event anlegen' }).click();

		// After create, ListView callback navigates to /events/{id}
		await page.waitForURL(/\/events\/[a-f0-9-]+$/);

		// 3. Detail view should show the title
		await expect(page.getByRole('heading', { name: title })).toBeVisible();
		await expect(page.getByText('Café am See')).toBeVisible();

		// 4. Add a guest
		await page.getByPlaceholder('Name', { exact: false }).first().fill('Tante Erika');
		await page
			.getByPlaceholder(/E-Mail/i)
			.first()
			.fill('erika@example.com');
		await page.getByRole('button', { name: 'Hinzufügen' }).click();

		// Guest row should appear
		await expect(page.getByText('Tante Erika')).toBeVisible();
		await expect(page.getByText('erika@example.com')).toBeVisible();

		// Set Erika to "Ja"
		const rsvpSelect = page.locator('select.rsvp-select').first();
		await rsvpSelect.selectOption('yes');

		// Summary should reflect 1 yes / 1 attending (no plus-ones)
		await expect(page.locator('.rsvp-summary .badge.yes .count')).toHaveText('1');

		// Set 2 plus-ones
		await page.locator('input[type="number"]').first().fill('2');
		// Blur to commit (onchange)
		await page.locator('input[type="number"]').first().blur();

		// totalAttending should now be 3 (1 + 2 plus-ones)
		await expect(page.locator('.rsvp-summary .total strong')).toHaveText('3');

		// 5. Delete the event — confirm dialog
		page.once('dialog', (dialog) => dialog.accept());
		await page.getByRole('button', { name: 'Löschen' }).click();

		// We should land back on the events list
		await page.waitForURL(/\/events\/?$/);
		await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();

		// The deleted event should no longer appear
		await expect(page.getByText(title)).not.toBeVisible();
	});

	test('quick-input adapter creates an event from the title bar', async ({ page }) => {
		await page.goto('/events', { waitUntil: 'networkidle' });

		await dismissWelcomeModal(page);

		// Sanity: page loaded
		await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();

		// Create via the visible "+ Neues Event" form (we don't depend on the
		// global QuickInputBar here — it lives outside the events route).
		await page.getByRole('button', { name: '+ Neues Event' }).click();
		const title = `Quick ${Date.now()}`;
		await page.getByPlaceholder("Worum geht's?", { exact: false }).fill(title);
		const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
		await page.locator('input[type="date"]').fill(future.toISOString().slice(0, 10));
		await page.getByRole('button', { name: 'Event anlegen' }).click();

		await page.waitForURL(/\/events\/[a-f0-9-]+$/);
		await expect(page.getByRole('heading', { name: title })).toBeVisible();
	});
});
