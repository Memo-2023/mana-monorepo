/**
 * World Clocks Store - Manages world clock state using Svelte 5 runes
 */

import { api } from '$lib/api/client';
import type { WorldClock, CreateWorldClockInput } from '@clock/shared';

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

	/**
	 * Fetch all world clocks from the backend
	 */
	async fetchWorldClocks() {
		loading = true;
		error = null;

		const response = await api.get<WorldClock[]>('/world-clocks');

		if (response.error) {
			error = response.error;
			loading = false;
			return { success: false, error: response.error };
		}

		worldClocks = response.data || [];
		loading = false;
		return { success: true };
	},

	/**
	 * Add a new world clock
	 */
	async addWorldClock(input: CreateWorldClockInput) {
		const response = await api.post<WorldClock>('/world-clocks', input);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			worldClocks = [...worldClocks, response.data];
		}
		return { success: true, data: response.data };
	},

	/**
	 * Remove a world clock
	 */
	async removeWorldClock(id: string) {
		const response = await api.delete(`/world-clocks/${id}`);

		if (response.error) {
			return { success: false, error: response.error };
		}

		worldClocks = worldClocks.filter((wc) => wc.id !== id);
		return { success: true };
	},

	/**
	 * Reorder world clocks
	 */
	async reorder(ids: string[]) {
		const response = await api.put('/world-clocks/reorder', { ids });

		if (response.error) {
			return { success: false, error: response.error };
		}

		// Update local order
		worldClocks = ids
			.map((id) => worldClocks.find((wc) => wc.id === id))
			.filter((wc): wc is WorldClock => wc !== undefined);

		return { success: true };
	},

	/**
	 * Clear all world clocks (local state only)
	 */
	clear() {
		worldClocks = [];
		error = null;
	},
};
