/**
 * Event Tag Groups Store - Manages tag groups using Svelte 5 runes
 */

import type { EventTagGroup } from '@calendar/shared';
import * as api from '$lib/api/event-tag-groups';

// State
let groups = $state<EventTagGroup[]>([]);
let ungroupedTagCount = $state(0);
let loading = $state(false);
let error = $state<string | null>(null);

// Helper to safely get groups array (Svelte 5 runes safety)
function getGroupsArray(): EventTagGroup[] {
	const arr = groups ?? [];
	return Array.isArray(arr) ? arr : [];
}

export const eventTagGroupsStore = {
	// Getters
	get groups() {
		return groups;
	},
	get ungroupedTagCount() {
		return ungroupedTagCount;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all groups
	 */
	async fetchGroups() {
		loading = true;
		error = null;

		const result = await api.getEventTagGroups();

		if (result.error) {
			error = result.error.message;
			groups = [];
			ungroupedTagCount = 0;
		} else {
			groups = result.data || [];
			ungroupedTagCount = result.ungroupedTagCount;
		}

		loading = false;
		return result;
	},

	/**
	 * Create a new group
	 */
	async createGroup(data: api.CreateEventTagGroupInput) {
		const result = await api.createEventTagGroup(data);

		if (result.data) {
			groups = [...groups, result.data];
		}

		return result;
	},

	/**
	 * Update a group
	 */
	async updateGroup(id: string, data: api.UpdateEventTagGroupInput) {
		const result = await api.updateEventTagGroup(id, data);

		if (result.data) {
			groups = getGroupsArray().map((g) => (g.id === id ? result.data! : g));
		}

		return result;
	},

	/**
	 * Delete a group
	 */
	async deleteGroup(id: string) {
		const result = await api.deleteEventTagGroup(id);

		if (!result.error) {
			groups = getGroupsArray().filter((g) => g.id !== id);
		}

		return result;
	},

	/**
	 * Get group by ID
	 */
	getById(id: string) {
		return getGroupsArray().find((g) => g.id === id);
	},

	/**
	 * Clear store
	 */
	clear() {
		groups = [];
		ungroupedTagCount = 0;
		error = null;
	},

	/**
	 * Update tag count for a group (after tag assignment changes)
	 */
	updateTagCount(groupId: string | null, delta: number) {
		if (groupId === null) {
			ungroupedTagCount = Math.max(0, ungroupedTagCount + delta);
		} else {
			groups = getGroupsArray().map((g) => {
				if (g.id === groupId) {
					return { ...g, tagCount: Math.max(0, (g.tagCount ?? 0) + delta) };
				}
				return g;
			});
		}
	},

	/**
	 * Reorder groups by providing new array order
	 */
	async reorderGroups(groupIds: string[]) {
		// Optimistic update
		const oldGroups = [...groups];
		groups = groupIds.map((id, i) => {
			const g = getGroupsArray().find((g) => g.id === id)!;
			return { ...g, sortOrder: i };
		});

		const result = await api.reorderEventTagGroups(groupIds);

		if (result.error) {
			// Rollback on error
			groups = oldGroups;
		} else if (result.data) {
			groups = result.data;
			ungroupedTagCount = result.ungroupedTagCount;
		}

		return result;
	},
};
