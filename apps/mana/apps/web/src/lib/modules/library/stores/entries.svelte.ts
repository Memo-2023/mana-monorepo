/**
 * Library entries store — mutation-only service.
 *
 * All reads happen via the liveQuery helpers in queries.ts. Writes go through
 * this store so the encryption step + event emission are consistent.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import {
	defaultVisibilityFor,
	generateUnlistedToken,
	type VisibilityLevel,
} from '@mana/shared-privacy';
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
			// Pre-populate the visibility field so the Dexie hook's generic
			// 'space' fallback doesn't fire for personal-space entries (which
			// should default to 'private' per the unified visibility system).
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
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

	/**
	 * "Nochmal" — re-start a completed entry. Leaves `times` alone (it was
	 * already incremented when the entry was marked complete); resets
	 * `startedAt` to today, clears `completedAt`, flips status back to
	 * 'active'. For series, the per-episode watched list is preserved so
	 * the user has a record of the previous run-through (and can reset
	 * individual episodes via the tracker if they want).
	 */
	async restartEntry(id: string) {
		const existing = await libraryEntryTable.get(id);
		if (!existing) return;
		const nowDate = new Date().toISOString().slice(0, 10);
		await libraryEntryTable.update(id, {
			status: 'active',
			startedAt: nowDate,
			completedAt: null,
			updatedAt: new Date().toISOString(),
		});
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

	/**
	 * Flip the visibility of an entry. Mints an unlisted token on first
	 * transition to 'unlisted' and wipes it when moving back to anything
	 * else, so a revoked link can't be silently re-activated. Emits a
	 * cross-module `VisibilityChanged` event so the Workbench timeline +
	 * audit surfaces pick it up.
	 *
	 * No-op if the level is already what the user selected.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await libraryEntryTable.get(id);
		if (!existing) throw new Error(`Library entry ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalLibraryEntry> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: now,
		};
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await libraryEntryTable.update(id, patch);

		emitDomainEvent('VisibilityChanged', 'library', 'libraryEntries', id, {
			recordId: id,
			collection: 'libraryEntries',
			before,
			after: next,
		});
	},
};
