/**
 * Integration tests for calendarsStore — calendar CRUD mutations.
 *
 * Focus:
 *   - createCalendar persists with default isDefault/isVisible flags
 *   - deleteCalendar soft-deletes
 *   - setAsDefault flips the flag and unsets the previous default
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '$lib/data/database';
import { setCurrentUserId } from '$lib/data/current-user';
import { generateMasterKey, MemoryKeyProvider, setKeyProvider } from '$lib/data/crypto';
import { calendarsStore } from './calendars.svelte';

const calendars = () => db.table('calendars');

beforeEach(async () => {
	setCurrentUserId('test-user');
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	await calendars().clear();
	await db.table('events').clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('calendarsStore.createCalendar', () => {
	it('persists a calendar with default flags', async () => {
		const result = await calendarsStore.createCalendar({
			name: 'Arbeit',
			color: '#3b82f6',
		});

		expect(result.success).toBe(true);
		expect(result.data?.id).toBeTruthy();

		const all = await calendars().toArray();
		expect(all).toHaveLength(1);
		expect(all[0].isVisible).toBe(true);
	});
});

describe('calendarsStore.deleteCalendar', () => {
	it('soft-deletes via deletedAt', async () => {
		const result = await calendarsStore.createCalendar({ name: 'Temp', color: '#ccc' });
		const id = result.data!.id;
		await calendarsStore.deleteCalendar(id);

		const raw = (await calendars().toArray()).find((c: { id: string }) => c.id === id);
		expect(raw?.deletedAt).toBeTruthy();
	});
});

describe('calendarsStore.setAsDefault', () => {
	it('sets one calendar as default and unsets the previous', async () => {
		const aResult = await calendarsStore.createCalendar({ name: 'A', color: '#aaa' });
		const bResult = await calendarsStore.createCalendar({ name: 'B', color: '#bbb' });
		const aId = aResult.data!.id;
		const bId = bResult.data!.id;

		const allBefore = await calendars().toArray();
		const calList = allBefore.map((c: Record<string, unknown>) => ({
			id: c.id as string,
			name: c.name as string,
			isDefault: c.isDefault as boolean,
			isVisible: c.isVisible as boolean,
			color: c.color as string,
			createdAt: (c.createdAt as string) ?? '',
			updatedAt: (c.updatedAt as string) ?? '',
		}));

		await calendarsStore.setAsDefault(bId, calList);

		const after = await calendars().toArray();
		const aAfter = after.find((c: { id: string }) => c.id === aId);
		const bAfter = after.find((c: { id: string }) => c.id === bId);
		expect(aAfter?.isDefault).toBe(false);
		expect(bAfter?.isDefault).toBe(true);
	});
});
