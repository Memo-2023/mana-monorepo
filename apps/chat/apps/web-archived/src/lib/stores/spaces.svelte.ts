/**
 * Spaces Store - Manages space list using Svelte 5 runes
 */

import { spaceService } from '$lib/services/space';
import type { Space, SpaceCreate, SpaceUpdate } from '@chat/types';

// State
let spaces = $state<Space[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const spacesStore = {
	// Getters
	get spaces() {
		return spaces;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	/**
	 * Load spaces for a user
	 */
	async loadSpaces(userId: string) {
		isLoading = true;
		error = null;

		try {
			spaces = await spaceService.getUserSpaces(userId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load spaces';
			spaces = [];
		} finally {
			isLoading = false;
		}
	},

	/**
	 * Create a new space
	 */
	async createSpace(space: SpaceCreate): Promise<string | null> {
		error = null;

		try {
			const spaceId = await spaceService.createSpace(space);
			if (spaceId) {
				// Reload spaces to get the new one with full data
				await this.loadSpaces(space.ownerId);
			}
			return spaceId;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create space';
			return null;
		}
	},

	/**
	 * Update a space
	 */
	async updateSpace(spaceId: string, updates: SpaceUpdate): Promise<boolean> {
		error = null;

		try {
			const success = await spaceService.updateSpace(spaceId, updates);
			if (success) {
				spaces = spaces.map((s) => (s.id === spaceId ? { ...s, ...updates } : s));
			}
			return success;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update space';
			return false;
		}
	},

	/**
	 * Delete a space
	 */
	async deleteSpace(spaceId: string): Promise<boolean> {
		error = null;

		try {
			const success = await spaceService.deleteSpace(spaceId);
			if (success) {
				spaces = spaces.filter((s) => s.id !== spaceId);
			}
			return success;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete space';
			return false;
		}
	},

	/**
	 * Leave a space
	 */
	async leaveSpace(spaceId: string, userId: string): Promise<boolean> {
		error = null;

		try {
			const success = await spaceService.leaveSpace(spaceId, userId);
			if (success) {
				spaces = spaces.filter((s) => s.id !== spaceId);
			}
			return success;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to leave space';
			return false;
		}
	},

	/**
	 * Reset store
	 */
	reset() {
		spaces = [];
		error = null;
	},
};
