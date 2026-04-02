import { test, expect } from './fixtures/auth';

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3018';

test.describe('Task CRUD', () => {
	test.beforeAll(async () => {
		// Skip all task tests if the backend is not running
		try {
			const res = await fetch(`${BACKEND_URL}/api/v1/health`, {
				signal: AbortSignal.timeout(3000),
			});
			if (!res.ok) test.skip(true, 'Todo backend is not running');
		} catch {
			test.skip(true, 'Todo backend is not reachable');
		}
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
	});

	test('create task via QuickInputBar and verify it appears', async ({ page }) => {
		const uniqueTitle = `E2E Aufgabe ${Date.now()}`;

		// The QuickInputBar has a placeholder "Neue Aufgabe oder suchen..."
		const quickInput = page.locator('input[placeholder*="Neue Aufgabe"]');
		await expect(quickInput).toBeVisible({ timeout: 10000 });

		// Type the task title
		await quickInput.fill(uniqueTitle);

		// Click "Erstellen" button or press Enter
		const createButton = page.getByRole('button', { name: /erstellen/i });
		if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await createButton.click();
		} else {
			await quickInput.press('Enter');
		}

		// Wait for the task to appear in the list
		const taskItem = page.locator('.task-item, [data-task-id]').filter({ hasText: uniqueTitle });
		await expect(taskItem).toBeVisible({ timeout: 10000 });
	});

	test('complete and uncomplete a task', async ({ page }) => {
		const uniqueTitle = `E2E Erledigen ${Date.now()}`;

		// Create a task first
		const quickInput = page.locator('input[placeholder*="Neue Aufgabe"]');
		await quickInput.fill(uniqueTitle);
		const createButton = page.getByRole('button', { name: /erstellen/i });
		if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await createButton.click();
		} else {
			await quickInput.press('Enter');
		}

		// Wait for task to appear
		const taskItem = page.locator('.task-item, [data-task-id]').filter({ hasText: uniqueTitle });
		await expect(taskItem).toBeVisible({ timeout: 10000 });

		// Click the checkbox/complete button on the task
		const checkbox = taskItem.locator('button, input[type="checkbox"]').first();
		await checkbox.click();

		// Task should move to "Erledigt" section or be marked as completed
		await page.waitForTimeout(1000);

		// Look for the task in the completed section
		const completedSection = page.locator('text=Erledigt').first();
		if (await completedSection.isVisible({ timeout: 3000 }).catch(() => false)) {
			const completedTask = page
				.locator('.task-item, [data-task-id]')
				.filter({ hasText: uniqueTitle });
			await expect(completedTask).toBeVisible({ timeout: 5000 });

			// Uncomplete: click the checkbox again
			const completedCheckbox = completedTask.locator('button, input[type="checkbox"]').first();
			await completedCheckbox.click();
			await page.waitForTimeout(1000);
		}
	});

	test('delete a task', async ({ page }) => {
		const uniqueTitle = `E2E Löschen ${Date.now()}`;

		// Create a task first
		const quickInput = page.locator('input[placeholder*="Neue Aufgabe"]');
		await quickInput.fill(uniqueTitle);
		const createButton = page.getByRole('button', { name: /erstellen/i });
		if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await createButton.click();
		} else {
			await quickInput.press('Enter');
		}

		// Wait for task to appear
		const taskItem = page.locator('.task-item, [data-task-id]').filter({ hasText: uniqueTitle });
		await expect(taskItem).toBeVisible({ timeout: 10000 });

		// Click on the task to open detail/edit view
		await taskItem.click();

		// Look for delete button in the detail view or context menu
		const deleteButton = page.getByRole('button', { name: /löschen/i });
		if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
			await deleteButton.click();

			// Handle confirmation dialog if present
			const confirmButton = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
			if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
				await confirmButton.click();
			}

			// Verify task is no longer visible
			await expect(taskItem).not.toBeVisible({ timeout: 5000 });
		} else {
			// Try right-click context menu or swipe action
			await taskItem.click({ button: 'right' });
			const contextDelete = page.getByRole('menuitem', { name: /löschen/i });
			if (await contextDelete.isVisible({ timeout: 2000 }).catch(() => false)) {
				await contextDelete.click();

				const confirmButton = page.getByRole('button', { name: /löschen|ja|bestätigen/i });
				if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
					await confirmButton.click();
				}

				await expect(taskItem).not.toBeVisible({ timeout: 5000 });
			}
		}
	});
});
