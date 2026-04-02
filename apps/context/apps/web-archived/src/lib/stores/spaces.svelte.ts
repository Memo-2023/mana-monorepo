/**
 * Spaces Store — Mutation-Only (Local-First)
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store only handles writes (create, update, delete, toggle).
 */

import type { Space } from '$lib/types';
import { ContextEvents } from '@manacore/shared-utils/analytics';
import { spaceCollection, type LocalSpace } from '$lib/data/local-store';
import { toSpace } from '$lib/data/queries';

let loading = $state(false);
let error = $state<string | null>(null);

export const spacesStore = {
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	async create(userId: string, name: string, description?: string) {
		loading = true;
		error = null;
		try {
			const newLocal: LocalSpace = {
				id: crypto.randomUUID(),
				name,
				description: description || null,
				settings: null,
				pinned: true,
				prefix: name.charAt(0).toUpperCase(),
			};
			const inserted = await spaceCollection.insert(newLocal);
			ContextEvents.spaceCreated();
			return { data: toSpace(inserted), error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Erstellen';
			error = msg;
			return { data: null, error: msg };
		} finally {
			loading = false;
		}
	},

	async update(id: string, updates: Partial<Space>) {
		error = null;
		try {
			const localUpdates: Partial<LocalSpace> = {};
			if (updates.name !== undefined) localUpdates.name = updates.name;
			if (updates.description !== undefined) localUpdates.description = updates.description;
			if (updates.pinned !== undefined) localUpdates.pinned = updates.pinned;
			if (updates.settings !== undefined) localUpdates.settings = updates.settings;

			await spaceCollection.update(id, localUpdates);
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Aktualisieren';
			error = msg;
			return { success: false, error: msg };
		}
	},

	async togglePinned(id: string, currentPinned: boolean) {
		error = null;
		try {
			await spaceCollection.update(id, { pinned: !currentPinned });
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Pin-Toggle';
			error = msg;
			return { success: false, error: msg };
		}
	},

	async delete(id: string) {
		error = null;
		try {
			await spaceCollection.delete(id);
			ContextEvents.spaceDeleted();
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Löschen';
			error = msg;
			return { success: false, error: msg };
		}
	},
};
