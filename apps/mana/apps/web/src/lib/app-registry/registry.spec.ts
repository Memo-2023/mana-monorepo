import { describe, it, expect } from 'vitest';
import { MANA_APPS } from '@mana/shared-branding';
// Side-effect import: registers every workbench app via ./apps.
// Without this, getAllApps() would return an empty list.
import './apps';
import { getAllApps } from './registry';

/**
 * Apps that intentionally exist in the workbench but are NOT in MANA_APPS
 * (e.g. internal devtools we don't want in marketing/branding lists).
 *
 * Adding to this list = "yes, this is supposed to drift, here's why".
 * Anything else triggers the test below and surfaces the drift early —
 * the kind of mismatch that produced the silent inventar↔inventory bug
 * before commit 45790ffbb.
 */
const WORKBENCH_ONLY = new Set([
	// Dev / internal tools — never meant for MANA_APPS.
	'automations',
	'playground',
	'admin',
	'complexity',
	'feedback',
	// Settings family — surfaced as workbench cards but conceptually
	// part of /settings, not standalone MANA_APPS entries.
	'settings',
	'themes',
	'profile',
	'credits',
	'api-keys',
	'help',
	'spiral',
	// User-facing modules that don't yet have MANA_APPS branding.
	// Add them to MANA_APPS when they ship a marketing surface.
	'kontext',
	'rituals',
	'wishes',
	// AI Studio surfaces. Open question whether to expose each one in
	// MANA_APPS or consolidate into a single "AI Studio" branding entry.
	// Keeping them workbench-only until that decision lands.
	'ai-missions',
	'ai-workbench',
	'ai-policy',
	'ai-insights',
	'ai-health',
]);

/**
 * Apps that intentionally exist in MANA_APPS but are NOT in the workbench
 * registry (standalone subdomains, marketing-only "Coming Soon" entries,
 * modules that exist as routes/i18n but aren't workbench-integrated yet,
 * or the unified-app meta entry itself).
 *
 * When you add a new app to MANA_APPS, you must EITHER register it in the
 * workbench (apps/web/src/lib/app-registry/apps.ts) or add it here with a
 * comment explaining why it doesn't belong in the workbench. This forces
 * the drift conversation to happen at the time of the change instead of
 * months later.
 */
const BRANDING_ONLY = new Set([
	// Meta entry for the unified Mana app itself — it can't be a "module"
	// of its own workbench.
	'mana',
	// Standalone web app on its own subdomain (arcade.mana.how).
	'arcade',
	// Marketing placeholders, status: 'planning' / 'development'. No
	// workbench module exists yet — they only show up in the AppsPage
	// gallery as "Coming Soon" hints.
	'wisekeep',
	'mail',
]);

describe('app registry ↔ MANA_APPS consistency', () => {
	it('every workbench-registry app has a MANA_APPS entry or is in WORKBENCH_ONLY', () => {
		const brandingIds = new Set<string>(MANA_APPS.map((a) => a.id));
		const unaccounted = getAllApps()
			.map((a) => a.id)
			.filter((id) => !brandingIds.has(id) && !WORKBENCH_ONLY.has(id));
		expect(unaccounted, `Workbench apps missing from MANA_APPS: ${unaccounted.join(', ')}`).toEqual(
			[]
		);
	});

	it('every MANA_APPS entry is registered in the workbench or is in BRANDING_ONLY', () => {
		const workbenchIds = new Set(getAllApps().map((a) => a.id));
		const unaccounted = MANA_APPS.map((a) => a.id).filter(
			(id) => !workbenchIds.has(id) && !BRANDING_ONLY.has(id)
		);
		expect(
			unaccounted,
			`MANA_APPS entries missing from workbench registry: ${unaccounted.join(', ')}`
		).toEqual([]);
	});

	it('inventar→inventory rename is fully applied (regression guard)', () => {
		// The whole point of commit 45790ffbb. If anyone re-introduces an
		// `inventar` id in either registry, the join in registry.ts
		// silently goes back to fail-open for that module.
		const allIds = [...getAllApps().map((a) => a.id), ...MANA_APPS.map((a) => a.id)];
		expect(allIds).not.toContain('inventar');
	});
});
