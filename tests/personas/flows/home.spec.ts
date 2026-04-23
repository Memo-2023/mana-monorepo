/**
 * Home-tour spec — smallest possible end-to-end signal.
 *
 * Runs the suite's auth fixture, lands on `/`, verifies the app loaded
 * under the persona's account (dashboard chrome visible), captures a
 * baseline screenshot.
 *
 * When this goes green, the whole persona-visual stack is plumbed:
 * seed-script → mana-auth → API login → cookie injection → web app →
 * screenshot. Copy this file, change the route in `page.goto`, and you
 * have a new module flow.
 */

import { test, expect } from '../fixtures/persona-auth';

// Worker-scoped fixture — must be top-level, not inside describe.
test.use({ personaKey: 'anna' });

test.describe('home — Anna', () => {
	test('dashboard renders', async ({ personaPage, persona }) => {
		// Sanity: we're logged in as the right user.
		// The URL should be inside the authenticated (app) group, not /login.
		await expect(personaPage).not.toHaveURL(/\/login(\?|$)/);

		// Give any lazy-loaded dashboard widgets a beat to settle, then
		// freeze dynamic timestamps so screenshots are deterministic.
		await personaPage.waitForLoadState('networkidle');
		await personaPage.evaluate(() => {
			// Hide any element that renders a live clock / relative time.
			// Tests can update this list if specific selectors are known.
			for (const el of document.querySelectorAll<HTMLElement>('[data-testid="live-time"]')) {
				el.style.visibility = 'hidden';
			}
		});

		await expect(personaPage).toHaveScreenshot(`home-${persona.archetype}.png`, {
			fullPage: true,
		});
	});
});
