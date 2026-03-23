/**
 * Labels Store - Manages label state using Svelte 5 runes
 *
 * Uses the central Tags API from mana-core-auth. Labels and Tags are now
 * unified across all Manacore apps (Todo, Calendar, Contacts).
 */

import type { Label } from '$lib/api/labels';
import * as labelsApi from '$lib/api/labels';
import { TodoEvents } from '@manacore/shared-utils/analytics';

// State
let labels = $state<Label[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const labelsStore = {
	// Getters
	get labels() {
		return labels;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all labels from API
	 */
	async fetchLabels() {
		loading = true;
		error = null;
		try {
			labels = await labelsApi.getLabels();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch labels';
			console.error('Failed to fetch labels:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Get label by ID
	 */
	getById(id: string): Label | undefined {
		return labels.find((l) => l.id === id);
	},

	/**
	 * Get label color by ID
	 */
	getColor(labelId: string): string {
		const label = labels.find((l) => l.id === labelId);
		return label?.color || '#6b7280';
	},

	/**
	 * Create a new label
	 */
	async createLabel(data: { name: string; color?: string }) {
		loading = true;
		error = null;
		try {
			const newLabel = await labelsApi.createLabel(data);
			labels = [...labels, newLabel];
			TodoEvents.labelCreated();
			return newLabel;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create label';
			console.error('Failed to create label:', e);
			throw e;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update an existing label
	 */
	async updateLabel(id: string, data: { name?: string; color?: string }) {
		error = null;
		try {
			const updatedLabel = await labelsApi.updateLabel(id, data);
			labels = labels.map((l) => (l.id === id ? updatedLabel : l));
			return updatedLabel;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update label';
			console.error('Failed to update label:', e);
			throw e;
		}
	},

	/**
	 * Delete a label
	 */
	async deleteLabel(id: string) {
		error = null;
		try {
			await labelsApi.deleteLabel(id);
			labels = labels.filter((l) => l.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete label';
			console.error('Failed to delete label:', e);
			throw e;
		}
	},

	/**
	 * Clear all state (for logout)
	 */
	clear() {
		labels = [];
		loading = false;
		error = null;
	},
};
