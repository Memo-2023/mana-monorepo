/**
 * Shared Playwright helpers used across the unified Mana app's E2E suites.
 */

import type { Page } from '@playwright/test';

/**
 * The unified Mana app shows a guest-welcome modal on first load that
 * intercepts every click. Always dismiss it before doing anything else
 * inside an `(app)` route. Locale-agnostic — matches the German and
 * English "continue as guest" buttons.
 */
export async function dismissWelcomeModal(page: Page): Promise<void> {
	const dialog = page.locator('[role="dialog"][aria-labelledby="welcome-title"]');
	try {
		// The modal is mounted after AuthGate finishes its check, so we
		// give it up to 10s to appear before deciding it isn't there.
		await dialog.waitFor({ state: 'visible', timeout: 10_000 });
	} catch {
		// Already dismissed in a previous test or guest mode disabled
		return;
	}
	await dialog.getByRole('button', { name: /Weiter als Gast|Continue as Guest/i }).click();
	await dialog.waitFor({ state: 'hidden' });
}
