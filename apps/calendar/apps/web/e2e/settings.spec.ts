import { test, expect, dismissOnboarding } from './fixtures/auth';

test.describe('Settings', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/settings');
		await dismissOnboarding(page);
		await expect(page.getByRole('heading', { name: 'Einstellungen', exact: true })).toBeVisible({
			timeout: 10000,
		});
	});

	test('settings page renders all sections', async ({ page }) => {
		// Check that the main setting sections are visible (use headings to avoid ambiguity)
		await expect(page.getByText('Meine Kalender', { exact: true })).toBeVisible();
		await expect(page.getByText('Kalender-Ansicht', { exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Termine' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Konto' })).toBeVisible();
	});

	test('change time format between 24h and 12h', async ({ page }) => {
		// Find the time format buttons
		const button24h = page.getByRole('button', { name: '24h (14:00)' });
		const button12h = page.getByRole('button', { name: '12h (2:00 PM)' });

		await expect(button24h).toBeVisible();
		await expect(button12h).toBeVisible();

		// Switch to 12h
		await button12h.click();
		await expect(button12h).toHaveClass(/active/);
		await expect(button24h).not.toHaveClass(/active/);

		// Switch back to 24h
		await button24h.click();
		await expect(button24h).toHaveClass(/active/);
		await expect(button12h).not.toHaveClass(/active/);
	});

	test('toggle show week numbers', async ({ page }) => {
		// Find the "Wochennummern anzeigen" checkbox
		const weekNumbersLabel = page.getByText('Wochennummern anzeigen');
		await expect(weekNumbersLabel).toBeVisible();

		// The checkbox is inside a label with this text
		const checkbox = page
			.locator('label')
			.filter({ hasText: 'Wochennummern anzeigen' })
			.locator('input[type="checkbox"]');
		const wasChecked = await checkbox.isChecked();

		// Toggle it
		await checkbox.click();
		await expect(checkbox).toBeChecked({ checked: !wasChecked });

		// Toggle it back
		await checkbox.click();
		await expect(checkbox).toBeChecked({ checked: wasChecked });
	});

	test('toggle show only weekdays', async ({ page }) => {
		const checkbox = page
			.locator('label')
			.filter({ hasText: 'Nur Werktage anzeigen' })
			.locator('input[type="checkbox"]');
		await expect(checkbox).toBeVisible();

		const wasChecked = await checkbox.isChecked();
		await checkbox.click();
		await expect(checkbox).toBeChecked({ checked: !wasChecked });

		// Restore original state
		await checkbox.click();
		await expect(checkbox).toBeChecked({ checked: wasChecked });
	});

	test('settings persist after page reload', async ({ page }) => {
		// Switch to 12h format
		const button12h = page.getByRole('button', { name: '12h (2:00 PM)' });
		await button12h.click();
		await expect(button12h).toHaveClass(/active/);

		// Reload
		await page.reload();
		await expect(page.getByRole('heading', { name: 'Einstellungen', exact: true })).toBeVisible({
			timeout: 10000,
		});

		// Verify 12h is still active
		const button12hAfterReload = page.getByRole('button', { name: '12h (2:00 PM)' });
		await expect(button12hAfterReload).toHaveClass(/active/);

		// Restore to 24h
		const button24h = page.getByRole('button', { name: '24h (14:00)' });
		await button24h.click();
		await expect(button24h).toHaveClass(/active/);
	});

	test('user email is displayed in account section', async ({ page }) => {
		const testEmail = process.env.E2E_TEST_EMAIL || 'e2e-calendar@test.local';

		// The account section shows the user's email
		const emailDisplay = page.locator('.setting-value');
		await expect(emailDisplay.first()).toContainText(testEmail);
	});
});
