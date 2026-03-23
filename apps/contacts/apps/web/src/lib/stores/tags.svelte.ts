/**
 * Tags Store - Manages tag state using Svelte 5 runes
 *
 * Centralized store for tags, used by TagStrip, TagStripModal, and tags page.
 * Uses the central Tags API from mana-core-auth.
 */

import { tagsApi, type ContactTag } from '$lib/api/contacts';

// State
let tags = $state<ContactTag[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const tagsStore = {
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
	 * Fetch all tags from API
	 */
	async fetchTags() {
		loading = true;
		error = null;
		try {
			const response = await tagsApi.list();
			tags = response.tags || [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch tags';
			console.error('Failed to fetch tags:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Get tag by ID
	 */
	getById(id: string): ContactTag | undefined {
		return tags.find((t) => t.id === id);
	},

	/**
	 * Get tag color by ID
	 */
	getColor(tagId: string): string {
		const tag = tags.find((t) => t.id === tagId);
		return tag?.color || '#6b7280';
	},

	/**
	 * Create a new tag
	 */
	async createTag(data: { name: string; color?: string }) {
		loading = true;
		error = null;
		try {
			const response = await tagsApi.create(data);
			tags = [...tags, response.tag];
			return response.tag;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create tag';
			console.error('Failed to create tag:', e);
			throw e;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update an existing tag
	 */
	async updateTag(id: string, data: { name?: string; color?: string }) {
		error = null;
		try {
			const response = await tagsApi.update(id, data);
			tags = tags.map((t) => (t.id === id ? response.tag : t));
			return response.tag;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update tag';
			console.error('Failed to update tag:', e);
			throw e;
		}
	},

	/**
	 * Delete a tag
	 */
	async deleteTag(id: string) {
		error = null;
		try {
			await tagsApi.delete(id);
			tags = tags.filter((t) => t.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete tag';
			console.error('Failed to delete tag:', e);
			throw e;
		}
	},

	/**
	 * Clear all state (for logout)
	 */
	clear() {
		tags = [];
		loading = false;
		error = null;
	},
};
