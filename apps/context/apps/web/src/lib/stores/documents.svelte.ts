/**
 * Documents Store — Mutation-Only (Local-First)
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store only handles writes and local filter state.
 */

import type { Document, DocumentType } from '$lib/types';
import { ContextEvents } from '@manacore/shared-utils/analytics';
import { documentCollection, type LocalDocument } from '$lib/data/local-store';
import { toDocument } from '$lib/data/queries';

let loading = $state(false);
let saving = $state(false);
let error = $state<string | null>(null);

// Filter state (UI-only, not persisted)
let searchQuery = $state('');
let typeFilter = $state<DocumentType | 'all'>('all');
let tagFilter = $state<string[]>([]);

export const documentsStore = {
	get loading() {
		return loading;
	},
	get saving() {
		return saving;
	},
	get error() {
		return error;
	},
	get searchQuery() {
		return searchQuery;
	},
	get typeFilter() {
		return typeFilter;
	},
	get tagFilter() {
		return tagFilter;
	},

	setSearchQuery(query: string) {
		searchQuery = query;
	},

	setTypeFilter(filter: DocumentType | 'all') {
		typeFilter = filter;
	},

	setTagFilter(tags: string[]) {
		tagFilter = tags;
	},

	async create(
		userId: string,
		content: string,
		type: DocumentType,
		spaceId?: string,
		title?: string
	) {
		saving = true;
		error = null;
		try {
			const newLocal: LocalDocument = {
				id: crypto.randomUUID(),
				title: title || 'Neues Dokument',
				content,
				type,
				spaceId: spaceId || null,
				pinned: false,
				metadata: null,
			};
			const inserted = await documentCollection.insert(newLocal);
			ContextEvents.documentCreated(type);
			return { data: toDocument(inserted), error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Erstellen';
			error = msg;
			return { data: null, error: msg };
		} finally {
			saving = false;
		}
	},

	async update(id: string, updates: Partial<Document>) {
		saving = true;
		error = null;
		try {
			const localUpdates: Partial<LocalDocument> = {};
			if (updates.title !== undefined) localUpdates.title = updates.title;
			if (updates.content !== undefined) localUpdates.content = updates.content!;
			if (updates.type !== undefined) localUpdates.type = updates.type;
			if (updates.pinned !== undefined) localUpdates.pinned = updates.pinned!;
			if (updates.metadata !== undefined) localUpdates.metadata = updates.metadata;

			await documentCollection.update(id, localUpdates);
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Aktualisieren';
			error = msg;
			return { success: false, error: msg };
		} finally {
			saving = false;
		}
	},

	async delete(id: string) {
		error = null;
		try {
			await documentCollection.delete(id);
			ContextEvents.documentDeleted();
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Löschen';
			error = msg;
			return { success: false, error: msg };
		}
	},

	async togglePinned(id: string, currentPinned: boolean) {
		error = null;
		try {
			const newPinned = !currentPinned;
			await documentCollection.update(id, { pinned: newPinned });
			ContextEvents.documentPinned(newPinned);
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Pin-Toggle';
			error = msg;
			return { success: false, error: msg };
		}
	},

	async saveTags(id: string, tags: string[]) {
		error = null;
		try {
			const existing = await documentCollection.get(id);
			if (existing) {
				await documentCollection.update(id, {
					metadata: { ...existing.metadata, tags },
				});
			}
			return { success: true, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler beim Speichern der Tags';
			error = msg;
			return { success: false, error: msg };
		}
	},
};
