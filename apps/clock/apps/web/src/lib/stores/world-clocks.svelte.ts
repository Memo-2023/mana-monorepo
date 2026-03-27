/**
 * World Clocks Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import { worldClockCollection, type LocalWorldClock } from '$lib/data/local-store';
import type { WorldClock, CreateWorldClockInput } from '@clock/shared';

// State — populated from IndexedDB
let worldClocks = $state<WorldClock[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalWorldClock (IndexedDB record) to the shared WorldClock type. */
function toWorldClock(local: LocalWorldClock): WorldClock {
	return {
		id: local.id,
		userId: 'local',
		timezone: local.timezone,
		cityName: local.cityName,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

/** Load world clocks from IndexedDB into the reactive state. */
async function refreshWorldClocks() {
	const localClocks = await worldClockCollection.getAll(undefined, {
		sortBy: 'sortOrder',
		sortDirection: 'asc',
	});
	worldClocks = localClocks.map(toWorldClock);
}

export const worldClocksStore = {
	// Getters
	get worldClocks() {
		return worldClocks;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all world clocks — reads from IndexedDB.
	 */
	async fetchWorldClocks() {
		loading = true;
		error = null;
		try {
			await refreshWorldClocks();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch world clocks';
			console.error('Failed to fetch world clocks:', e);
		} finally {
			loading = false;
		}
		return { success: true };
	},

	/**
	 * Add a new world clock — writes to IndexedDB instantly.
	 */
	async addWorldClock(input: CreateWorldClockInput) {
		error = null;
		try {
			const newLocal: LocalWorldClock = {
				id: crypto.randomUUID(),
				timezone: input.timezone,
				cityName: input.cityName,
				sortOrder: worldClocks.length,
			};

			const inserted = await worldClockCollection.insert(newLocal);
			const newClock = toWorldClock(inserted);
			worldClocks = [...worldClocks, newClock];
			return { success: true, data: newClock };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add world clock';
			console.error('Failed to add world clock:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Remove a world clock — removes from IndexedDB instantly.
	 */
	async removeWorldClock(id: string) {
		error = null;
		try {
			await worldClockCollection.delete(id);
			worldClocks = worldClocks.filter((wc) => wc.id !== id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove world clock';
			console.error('Failed to remove world clock:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Reorder world clocks — updates sortOrder in IndexedDB.
	 */
	async reorder(ids: string[]) {
		error = null;
		try {
			// Update local state immediately
			worldClocks = ids
				.map((id, index) => {
					const wc = worldClocks.find((w) => w.id === id);
					return wc ? { ...wc, sortOrder: index } : undefined;
				})
				.filter((wc): wc is WorldClock => wc !== undefined);

			// Persist each order change to IndexedDB
			for (let i = 0; i < ids.length; i++) {
				await worldClockCollection.update(ids[i], {
					sortOrder: i,
				} as Partial<LocalWorldClock>);
			}

			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder world clocks';
			console.error('Failed to reorder world clocks:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Clear all world clocks (local state only).
	 */
	clear() {
		worldClocks = [];
		error = null;
	},
};
