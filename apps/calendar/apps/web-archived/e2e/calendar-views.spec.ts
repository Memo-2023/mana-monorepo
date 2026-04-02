import { test, expect, dismissOnboarding } from './fixtures/auth';

test.describe('Calendar Views', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await dismissOnboarding(page);
		// Wait for calendar to be fully loaded
		await expect(page.locator('main[aria-label="Kalender"]')).toBeVisible({ timeout: 10000 });
	});

	test('week view loads as default with day columns', async ({ page }) => {
		// ViewsBar "7" button should be active (week view)
		const weekButton = page.locator('button[title="Wochenansicht"]');
		await expect(weekButton).toBeVisible();
		await expect(weekButton).toHaveClass(/active/);

		// Week view grid should show day columns with hour rows
		const calendarContent = page.locator('.calendar-content');
		await expect(calendarContent).toBeVisible();
	});

	test('switch to month view via header button', async ({ page }) => {
		const monthButton = page.locator('button[title="Monatsansicht"]');
		await expect(monthButton).toBeVisible();
		await monthButton.click();

		// Month button should now be active
		await expect(monthButton).toHaveClass(/active/);

		// Week button should no longer be active
		const weekButton = page.locator('button[title="Wochenansicht"]');
		await expect(weekButton).not.toHaveClass(/active/);
	});

	test('switch to agenda view', async ({ page }) => {
		const agendaButton = page.locator('button[title="Agenda"]');
		await expect(agendaButton).toBeVisible();
		await agendaButton.click();

		// Agenda button should now be active
		await expect(agendaButton).toHaveClass(/active/);
	});

	test('navigate forward and backward with arrow keys', async ({ page }) => {
		// Click on the day-header area (non-interactive) to ensure body focus
		await page.locator('body').click({ position: { x: 10, y: 10 } });
		// Dismiss any overlay that might have opened
		await page.keyboard.press('Escape');
		await page.waitForTimeout(300);

		// Get all day-header aria-labels to identify the current week
		const dayHeaders = page.locator('.day-header[aria-label]');
		const initialLabel = await dayHeaders.first().getAttribute('aria-label');

		// Navigate forward one week with ArrowRight
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(1000);

		const afterForwardLabel = await dayHeaders.first().getAttribute('aria-label');
		// The first day header should show a different date after navigating
		expect(afterForwardLabel).not.toBe(initialLabel);

		// Navigate backward with ArrowLeft
		await page.keyboard.press('ArrowLeft');
		await page.waitForTimeout(1000);

		const afterBackLabel = await dayHeaders.first().getAttribute('aria-label');
		// After going forward then back, we should be at the same date
		expect(afterBackLabel).toBe(initialLabel);
	});

	test('today button returns to current date after navigation', async ({ page }) => {
		// Click on the day-header area and dismiss any overlay
		await page.locator('body').click({ position: { x: 10, y: 10 } });
		await page.keyboard.press('Escape');
		await page.waitForTimeout(300);

		// Get today's day header
		const todayHeader = page.locator('.day-header.today');
		await expect(todayHeader).toBeVisible();

		// Navigate away from today
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(1000);

		// Today should no longer be visible (navigated 2 weeks ahead)
		await expect(todayHeader).not.toBeVisible();

		// Click the "Heute" (Today) button - find by its title attribute
		const todayButton = page.locator(
			'.today-button, button[title*="heute" i], button[title*="today" i]'
		);
		await expect(todayButton.first()).toBeVisible({ timeout: 5000 });
		await todayButton.first().click();
		await page.waitForTimeout(1000);

		// Today header should be visible again
		await expect(todayHeader).toBeVisible();
	});
});
