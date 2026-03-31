import { describe, it, expect } from 'vitest';
import {
	hasAppAccess,
	getTierLevel,
	getAccessibleManaApps,
	getActiveManaApps,
	getManaApp,
	getManaAppsByStatus,
	MANA_APPS,
} from './mana-apps';

describe('getTierLevel', () => {
	it('returns correct levels for all tiers', () => {
		expect(getTierLevel('guest')).toBe(0);
		expect(getTierLevel('public')).toBe(1);
		expect(getTierLevel('beta')).toBe(2);
		expect(getTierLevel('alpha')).toBe(3);
		expect(getTierLevel('founder')).toBe(4);
	});

	it('returns 0 for unknown tier', () => {
		expect(getTierLevel('unknown')).toBe(0);
		expect(getTierLevel('')).toBe(0);
	});
});

describe('hasAppAccess', () => {
	it('founder can access everything', () => {
		expect(hasAppAccess('founder', 'guest')).toBe(true);
		expect(hasAppAccess('founder', 'public')).toBe(true);
		expect(hasAppAccess('founder', 'beta')).toBe(true);
		expect(hasAppAccess('founder', 'alpha')).toBe(true);
		expect(hasAppAccess('founder', 'founder')).toBe(true);
	});

	it('public cannot access beta+', () => {
		expect(hasAppAccess('public', 'public')).toBe(true);
		expect(hasAppAccess('public', 'beta')).toBe(false);
		expect(hasAppAccess('public', 'alpha')).toBe(false);
		expect(hasAppAccess('public', 'founder')).toBe(false);
	});

	it('beta can access beta and below', () => {
		expect(hasAppAccess('beta', 'guest')).toBe(true);
		expect(hasAppAccess('beta', 'public')).toBe(true);
		expect(hasAppAccess('beta', 'beta')).toBe(true);
		expect(hasAppAccess('beta', 'alpha')).toBe(false);
		expect(hasAppAccess('beta', 'founder')).toBe(false);
	});

	it('guest can only access guest tier', () => {
		expect(hasAppAccess('guest', 'guest')).toBe(true);
		expect(hasAppAccess('guest', 'public')).toBe(false);
	});

	it('unknown tier treated as guest (level 0)', () => {
		expect(hasAppAccess('unknown', 'guest')).toBe(true);
		expect(hasAppAccess('unknown', 'public')).toBe(false);
	});
});

describe('getAccessibleManaApps', () => {
	it('founder sees all non-archived apps', () => {
		const founderApps = getAccessibleManaApps('founder');
		const activeApps = getActiveManaApps();
		expect(founderApps.length).toBe(activeApps.length);
	});

	it('public sees fewer apps than founder', () => {
		const publicApps = getAccessibleManaApps('public');
		const founderApps = getAccessibleManaApps('founder');
		expect(publicApps.length).toBeLessThanOrEqual(founderApps.length);
	});

	it('guest sees no apps (all require at least public)', () => {
		const guestApps = getAccessibleManaApps('guest');
		// All apps require at least 'public' tier
		expect(guestApps.length).toBe(0);
	});

	it('excludes archived apps', () => {
		const apps = getAccessibleManaApps('founder');
		const archivedApps = apps.filter((a) => a.archived);
		expect(archivedApps.length).toBe(0);
	});
});

describe('getManaApp', () => {
	it('returns app by ID', () => {
		const todo = getManaApp('todo');
		expect(todo).toBeDefined();
		expect(todo?.name).toBe('Todo');
	});

	it('returns undefined for unknown ID', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(getManaApp('nonexistent' as any)).toBeUndefined();
	});
});

describe('getManaAppsByStatus', () => {
	it('filters by status', () => {
		const betaApps = getManaAppsByStatus('beta');
		betaApps.forEach((app) => {
			expect(app.status).toBe('beta');
		});
	});
});

describe('MANA_APPS integrity', () => {
	it('every app has a requiredTier', () => {
		MANA_APPS.forEach((app) => {
			expect(app.requiredTier).toBeDefined();
			expect(['guest', 'public', 'beta', 'alpha', 'founder']).toContain(app.requiredTier);
		});
	});

	it('every app has bilingual descriptions', () => {
		MANA_APPS.forEach((app) => {
			expect(app.description.de).toBeTruthy();
			expect(app.description.en).toBeTruthy();
		});
	});
});
