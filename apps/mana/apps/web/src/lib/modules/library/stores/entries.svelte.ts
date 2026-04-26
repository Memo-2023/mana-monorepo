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
	publishUnlistedSnapshot,
	revokeUnlistedSnapshot,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import { buildUnlistedBlob } from '$lib/data/unlisted/resolvers';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
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
		const wrapped: Partial<LocalLibraryEntry> = { ...patch };
		await encryptRecord('libraryEntries', wrapped);
		await libraryEntryTable.update(id, wrapped);
		// Keep the share-link snapshot in sync if this entry is unlisted.
		void this.refreshUnlistedSnapshot(id);
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
		});
	},

	async rate(id: string, rating: number | null) {
		await libraryEntryTable.update(id, {
			rating,
		});
	},

	async toggleFavorite(id: string) {
		const existing = await libraryEntryTable.get(id);
		if (!existing) return;
		await libraryEntryTable.update(id, {
			isFavorite: !existing.isFavorite,
		});
	},

	async deleteEntry(id: string) {
		const existing = await libraryEntryTable.get(id);
		// Revoke any active share-link before tombstoning, so a recipient
		// reloading the link gets 410 Gone instead of seeing stale data.
		if (existing?.visibility === 'unlisted' && existing.unlistedToken) {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				try {
					await revokeUnlistedSnapshot({
						apiUrl: getManaApiUrl(),
						jwt,
						collection: 'libraryEntries',
						recordId: id,
					});
				} catch (e) {
					console.error('[library] revoke on delete failed', e);
				}
			}
		}

		await libraryEntryTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
		emitDomainEvent('LibraryEntryDeleted', 'library', 'libraryEntries', id, { entryId: id });
	},

	/**
	 * Flip the visibility of an entry. Coordinates with the server-side
	 * unlisted-snapshots table — see calendar/eventsStore.setVisibility
	 * for the full pattern. Server is authoritative for the token.
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
		};

		if (next === 'unlisted') {
			const blob = await buildUnlistedBlob('libraryEntries', id);
			const jwt = await authStore.getValidToken();
			if (!jwt) throw new Error('Nicht eingeloggt');
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'libraryEntries',
				recordId: id,
				spaceId,
				blob,
			});
			patch.unlistedToken = token;
			patch.unlistedExpiresAt = undefined;
		} else if (before === 'unlisted') {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				await revokeUnlistedSnapshot({
					apiUrl: getManaApiUrl(),
					jwt,
					collection: 'libraryEntries',
					recordId: id,
				});
			}
			patch.unlistedToken = undefined;
			patch.unlistedExpiresAt = undefined;
		}

		await libraryEntryTable.update(id, patch);

		emitDomainEvent('VisibilityChanged', 'library', 'libraryEntries', id, {
			recordId: id,
			collection: 'libraryEntries',
			before,
			after: next,
		});
	},

	/**
	 * Force-regenerate the unlisted token. Same semantics as
	 * eventsStore.regenerateUnlistedToken — revoke + republish, returns
	 * the new token.
	 */
	async regenerateUnlistedToken(id: string) {
		const existing = await libraryEntryTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return null;
		const jwt = await authStore.getValidToken();
		if (!jwt) return null;
		try {
			await revokeUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'libraryEntries',
				recordId: id,
			});
			const blob = await buildUnlistedBlob('libraryEntries', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'libraryEntries',
				recordId: id,
				spaceId,
				blob,
				// Preserve any existing expiry — regenerate is about leaking
				// the URL, not extending the lifetime.
				expiresAt: existing.unlistedExpiresAt ? new Date(existing.unlistedExpiresAt) : undefined,
			});
			await libraryEntryTable.update(id, {
				unlistedToken: token,
			});
			return token;
		} catch (e) {
			console.error('[library] regenerate failed', e);
			return null;
		}
	},

	/**
	 * Set or clear the unlisted-share expiry. Mirrors
	 * eventsStore.setUnlistedExpiry — re-publishes with the new expiry
	 * and stores it locally so the picker stays in sync.
	 */
	async setUnlistedExpiry(id: string, expiresAt: Date | null) {
		const existing = await libraryEntryTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		const jwt = await authStore.getValidToken();
		if (!jwt) return;
		try {
			const blob = await buildUnlistedBlob('libraryEntries', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'libraryEntries',
				recordId: id,
				spaceId,
				blob,
				expiresAt,
			});
			await libraryEntryTable.update(id, {
				unlistedExpiresAt: expiresAt ? expiresAt.toISOString() : undefined,
			});
		} catch (e) {
			console.error('[library] setUnlistedExpiry failed', e);
		}
	},

	/**
	 * Re-publish unlisted snapshot when whitelist fields change. Called
	 * fire-and-forget after updateEntry/setStatus/rate. No-op if the
	 * entry isn't currently 'unlisted'.
	 */
	async refreshUnlistedSnapshot(id: string) {
		const existing = await libraryEntryTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		try {
			const blob = await buildUnlistedBlob('libraryEntries', id);
			const jwt = await authStore.getValidToken();
			if (!jwt) return;
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'libraryEntries',
				recordId: id,
				spaceId,
				blob,
				// Preserve any existing expiry so a content edit doesn't
				// silently extend the link's lifetime.
				expiresAt: existing.unlistedExpiresAt ? new Date(existing.unlistedExpiresAt) : undefined,
			});
		} catch (e) {
			console.error('[library] refreshUnlistedSnapshot failed', e);
		}
	},
};
