/**
 * Library entries store — mutation-only service.
 *
 * All reads happen via the liveQuery helpers in queries.ts. Writes go through
 * this store so the encryption step + event emission are consistent.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { libraryEntryTable } from '../collections';
import { toLibraryEntry } from '../queries';
import type {
	LocalLibraryEntry,
	LibraryKind,
	LibraryStatus,
	LibraryDetails,
	LibraryExternalIds,
} from '../types';

function defaultDetails(kind: LibraryKind): LibraryDetails {
	switch (kind) {
		case 'book':
			return { kind: 'book' };
		case 'movie':
			return { kind: 'movie' };
		case 'series':
			return { kind: 'series', watched: [] };
		case 'comic':
			return { kind: 'comic' };
	}
}

export interface CreateEntryInput {
	kind: LibraryKind;
	title: string;
	originalTitle?: string | null;
	creators?: string[];
	year?: number | null;
	coverUrl?: string | null;
	coverMediaId?: string | null;
	status?: LibraryStatus;
	rating?: number | null;
	review?: string | null;
	tags?: string[];
	genres?: string[];
	startedAt?: string | null;
	completedAt?: string | null;
	isFavorite?: boolean;
	externalIds?: LibraryExternalIds | null;
	details?: LibraryDetails;
}

export const libraryEntriesStore = {
	async createEntry(input: CreateEntryInput) {
		const details = input.details ?? defaultDetails(input.kind);
		if (details.kind !== input.kind) {
			throw new Error(
				`[library] details.kind "${details.kind}" does not match entry.kind "${input.kind}"`
			);
		}
		const newLocal: LocalLibraryEntry = {
			id: crypto.randomUUID(),
			kind: input.kind,
			status: input.status ?? 'planned',
			title: input.title,
			originalTitle: input.originalTitle ?? null,
			creators: input.creators ?? [],
			year: input.year ?? null,
			coverUrl: input.coverUrl ?? null,
			coverMediaId: input.coverMediaId ?? null,
			rating: input.rating ?? null,
			review: input.review ?? null,
			tags: input.tags ?? [],
			genres: input.genres ?? [],
			startedAt: input.startedAt ?? null,
			completedAt: input.completedAt ?? null,
			isFavorite: input.isFavorite ?? false,
			times: 0,
			externalIds: input.externalIds ?? null,
			details,
		};
		const snapshot = toLibraryEntry({ ...newLocal });
		await encryptRecord('libraryEntries', newLocal);
		await libraryEntryTable.add(newLocal);
		emitDomainEvent('LibraryEntryCreated', 'library', 'libraryEntries', newLocal.id, {
			entryId: newLocal.id,
			kind: input.kind,
			title: input.title,
		});
		return snapshot;
	},

	async updateEntry(
		id: string,
		patch: Partial<
			Pick<
				LocalLibraryEntry,
				| 'title'
				| 'originalTitle'
				| 'creators'
				| 'year'
				| 'coverUrl'
				| 'coverMediaId'
				| 'status'
				| 'rating'
				| 'review'
				| 'tags'
				| 'genres'
				| 'startedAt'
				| 'completedAt'
				| 'isFavorite'
				| 'externalIds'
				| 'details'
				| 'times'
			>
		>
	) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('libraryEntries', wrapped);
		await libraryEntryTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async setStatus(id: string, status: LibraryStatus) {
		const existing = await libraryEntryTable.get(id);
		if (!existing) return;
		const nowDate = new Date().toISOString().slice(0, 10);
		const patch: Partial<LocalLibraryEntry> = { status };
		if (status === 'active' && !existing.startedAt) patch.startedAt = nowDate;
		if (status === 'completed') {
			if (!existing.completedAt) patch.completedAt = nowDate;
			patch.times = (existing.times ?? 0) + 1;
		}
		await libraryEntryTable.update(id, {
			...patch,
			updatedAt: new Date().toISOString(),
		});
		if (status === 'completed') {
			emitDomainEvent('LibraryEntryCompleted', 'library', 'libraryEntries', id, {
				entryId: id,
				kind: existing.kind,
			});
		}
	},

	async rate(id: string, rating: number | null) {
		await libraryEntryTable.update(id, {
			rating,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFavorite(id: string) {
		const existing = await libraryEntryTable.get(id);
		if (!existing) return;
		await libraryEntryTable.update(id, {
			isFavorite: !existing.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteEntry(id: string) {
		await libraryEntryTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('LibraryEntryDeleted', 'library', 'libraryEntries', id, { entryId: id });
	},
};
