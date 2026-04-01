/**
 * World Clocks Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (add, remove, reorder).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalWorldClock } from '../types';
import type { CreateWorldClockInput } from '@clock/shared';

let error = $state<string | null>(null);

export const worldClocksStore = {
	get error() {
		return error;
	},

	/**
	 * Add a new world clock -- writes to IndexedDB instantly.
	 */
	async addWorldClock(input: CreateWorldClockInput, currentCount: number = 0) {
		error = null;
		try {
			const newLocal: LocalWorldClock = {
				id: crypto.randomUUID(),
				timezone: input.timezone,
				cityName: input.cityName,
				sortOrder: currentCount,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalWorldClock>('worldClocks').add(newLocal);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add world clock';
			console.error('Failed to add world clock:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Remove a world clock -- soft-deletes from IndexedDB instantly.
	 */
	async removeWorldClock(id: string) {
		error = null;
		try {
			await db.table('worldClocks').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove world clock';
			console.error('Failed to remove world clock:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Reorder world clocks -- updates sortOrder in IndexedDB.
	 */
	async reorder(ids: string[]) {
		error = null;
		try {
			const now = new Date().toISOString();
			for (let i = 0; i < ids.length; i++) {
				await db.table('worldClocks').update(ids[i], {
					sortOrder: i,
					updatedAt: now,
				});
			}
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder world clocks';
			console.error('Failed to reorder world clocks:', e);
			return { success: false, error: error };
		}
	},
};
