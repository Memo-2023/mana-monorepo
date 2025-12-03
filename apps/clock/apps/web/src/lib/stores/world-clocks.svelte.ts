/**
 * World Clocks Store - Manages world clock state using Svelte 5 runes
 */

import type { WorldClock, CreateWorldClockInput } from '@clock/shared';
import { worldClocksApi } from '$lib/api/world-clocks';

// State
let worldClocks = $state<WorldClock[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

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
	get sortedWorldClocks() {
		return [...worldClocks].sort((a, b) => a.sortOrder - b.sortOrder);
	},

	/**
	 * Fetch all world clocks from the API
	 */
	async fetchWorldClocks() {
		loading = true;
		error = null;

		const result = await worldClocksApi.getAll();

		if (result.error) {
			error = result.error;
		} else if (result.data) {
			worldClocks = result.data;
		}

		loading = false;
	},

	/**
	 * Add a new world clock
	 */
	async addWorldClock(input: CreateWorldClockInput) {
		const result = await worldClocksApi.create(input);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			worldClocks = [...worldClocks, result.data];
		}

		return { success: true };
	},

	/**
	 * Remove a world clock
	 */
	async removeWorldClock(id: string) {
		const result = await worldClocksApi.delete(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		worldClocks = worldClocks.filter((wc) => wc.id !== id);
		return { success: true };
	},

	/**
	 * Reorder world clocks
	 */
	async reorderWorldClocks(ids: string[]) {
		const result = await worldClocksApi.reorder(ids);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			worldClocks = result.data;
		}

		return { success: true };
	},

	/**
	 * Get time info for a timezone
	 */
	getTimeForTimezone(timezone: string) {
		try {
			const now = new Date();
			const formatter = new Intl.DateTimeFormat('de-DE', {
				timeZone: timezone,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});

			const localOffset = now.getTimezoneOffset();
			const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
			const targetOffset = (now.getTime() - targetDate.getTime()) / (1000 * 60) + localOffset;

			return {
				time: formatter.format(now),
				offsetHours: Math.round(-targetOffset / 60),
			};
		} catch {
			return { time: '--:--:--', offsetHours: 0 };
		}
	},
};
