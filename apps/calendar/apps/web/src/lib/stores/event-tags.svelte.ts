/**
 * Event Tags Store - Manages event tags using Svelte 5 runes
 *
 * Uses the Calendar Backend API which supports tag groups (groupId).
 */

import type { EventTag } from '@calendar/shared';
import * as api from '$lib/api/event-tags';

// State
let tags = $state<EventTag[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Helper to safely get tags array (Svelte 5 runes safety)
function getTagsArray(): EventTag[] {
	const arr = tags ?? [];
	return Array.isArray(arr) ? arr : [];
}

export const eventTagsStore = {
	// Getters
	get tags() {
		return tags;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all tags
	 */
	async fetchTags() {
		loading = true;
		error = null;

		const result = await api.getEventTags();

		if (result.error) {
			error = result.error.message;
			tags = [];
		} else {
			tags = result.data || [];
		}

		loading = false;
		return result;
	},

	/**
	 * Create a new tag
	 */
	async createTag(data: api.CreateEventTagInput) {
		const result = await api.createEventTag(data);

		if (result.data) {
			tags = [...tags, result.data];
		}

		return result;
	},

	/**
	 * Update a tag
	 */
	async updateTag(id: string, data: api.UpdateEventTagInput) {
		const result = await api.updateEventTag(id, data);

		if (result.data) {
			tags = getTagsArray().map((t) => (t.id === id ? result.data! : t));
		}

		return result;
	},

	/**
	 * Delete a tag
	 */
	async deleteTag(id: string) {
		const result = await api.deleteEventTag(id);

		if (!result.error) {
			tags = getTagsArray().filter((t) => t.id !== id);
		}

		return result;
	},

	/**
	 * Get tag by ID
	 */
	getById(id: string) {
		return getTagsArray().find((t) => t.id === id);
	},

	/**
	 * Get tags by IDs
	 */
	getByIds(ids: string[]) {
		return getTagsArray().filter((t) => ids.includes(t.id));
	},

	/**
	 * Clear store
	 */
	clear() {
		tags = [];
		error = null;
	},

	/**
	 * Get tags grouped by groupId
	 * Returns a Map where keys are groupId (or null for ungrouped)
	 */
	getGroupedTags(): Map<string | null, EventTag[]> {
		const grouped = new Map<string | null, EventTag[]>();

		for (const tag of getTagsArray()) {
			const groupId = tag.groupId ?? null;
			const existing = grouped.get(groupId) ?? [];
			grouped.set(groupId, [...existing, tag]);
		}

		return grouped;
	},

	/**
	 * Get tags by group ID (null for ungrouped)
	 */
	getTagsByGroup(groupId: string | null): EventTag[] {
		return getTagsArray().filter((t) => (t.groupId ?? null) === groupId);
	},
};
