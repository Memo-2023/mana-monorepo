/**
 * Places Store — Mutation-Only
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only exposes mutations that write to IndexedDB.
 */

import { encryptRecord, decryptRecord } from '$lib/data/crypto';
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
import { createBlock } from '$lib/data/time-blocks/service';
import { placeTable } from '../collections';
import { toPlace } from '../queries';
import type { LocalPlace, Place, PlaceCategory } from '../types';

export const placesStore = {
	async createPlace(data: {
		name: string;
		latitude: number;
		longitude: number;
		description?: string;
		address?: string;
		category?: PlaceCategory;
	}) {
		const now = new Date().toISOString();
		const newLocal: LocalPlace = {
			id: crypto.randomUUID(),
			name: data.name,
			latitude: data.latitude,
			longitude: data.longitude,
			description: data.description,
			address: data.address,
			category: data.category ?? 'other',
			isFavorite: false,
			isArchived: false,
			visitCount: 0,
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
			createdAt: now,
			updatedAt: now,
		};

		// Snapshot the plaintext DTO before encryption mutates the record
		// in place — same pattern as the notes/dreams/contacts stores.
		const plaintextSnapshot = toPlace({ ...newLocal });
		await encryptRecord('places', newLocal);
		await placeTable.add(newLocal);
		emitDomainEvent('PlaceCreated', 'places', 'places', newLocal.id, {
			placeId: newLocal.id,
			name: data.name,
			category: data.category,
			lat: data.latitude,
			lng: data.longitude,
		});
		return plaintextSnapshot;
	},

	async updatePlace(id: string, data: Partial<Place> & Record<string, unknown>) {
		const updateData: Partial<LocalPlace> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description ?? undefined;
		if (data.latitude !== undefined) updateData.latitude = data.latitude;
		if (data.longitude !== undefined) updateData.longitude = data.longitude;
		if (data.address !== undefined) updateData.address = data.address ?? undefined;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

		const diff = {
			...updateData,
			updatedAt: new Date().toISOString(),
		};
		// encryptRecord mutates the diff in place. Fields not in the
		// places allowlist (lat/lng, isFavorite, isArchived, …) pass
		// through untouched.
		await encryptRecord('places', diff);
		await placeTable.update(id, diff);
		// Refresh share-snapshot if this place is unlisted.
		void this.refreshUnlistedSnapshot(id);
	},

	async deletePlace(id: string) {
		const local = await placeTable.get(id);
		const decrypted = local ? await decryptRecord('places', { ...local }) : null;

		// Revoke active share-link before tombstone.
		if (local?.visibility === 'unlisted' && local.unlistedToken) {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				try {
					await revokeUnlistedSnapshot({
						apiUrl: getManaApiUrl(),
						jwt,
						collection: 'places',
						recordId: id,
					});
				} catch (e) {
					console.error('[places] revoke on delete failed', e);
				}
			}
		}

		await placeTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('PlaceDeleted', 'places', 'places', id, {
			placeId: id,
			name: (decrypted?.name as string) ?? '',
		});
	},

	async toggleFavorite(id: string) {
		const local = await placeTable.get(id);
		if (!local) return;

		await placeTable.update(id, {
			isFavorite: !local.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async updateTagIds(id: string, tagIds: string[]) {
		await placeTable.update(id, {
			tagIds,
			updatedAt: new Date().toISOString(),
		});
	},

	async recordVisit(id: string) {
		const local = await placeTable.get(id);
		if (!local) return;

		const now = new Date().toISOString();
		const decrypted = await decryptRecord('places', { ...local });
		const placeName = decrypted?.name ?? 'Ort';

		await placeTable.update(id, {
			visitCount: (local.visitCount ?? 0) + 1,
			lastVisitedAt: now,
			updatedAt: now,
		});

		await createBlock({
			startDate: now,
			endDate: now,
			kind: 'logged',
			type: 'visit',
			sourceModule: 'places',
			sourceId: id,
			title: placeName,
			color: '#a855f7',
		});
		emitDomainEvent('PlaceVisited', 'places', 'places', id, {
			placeId: id,
			name: placeName,
			visitCount: (local.visitCount ?? 0) + 1,
		});
	},

	/**
	 * Flip a place's visibility. Coordinates with the server-side
	 * unlisted-snapshots table — see calendar/eventsStore.setVisibility
	 * for the full pattern. Server is authoritative for the token.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await placeTable.get(id);
		if (!existing) throw new Error(`Place ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalPlace> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: now,
		};

		if (next === 'unlisted') {
			const blob = await buildUnlistedBlob('places', id);
			const jwt = await authStore.getValidToken();
			if (!jwt) throw new Error('Nicht eingeloggt');
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'places',
				recordId: id,
				spaceId,
				blob,
			});
			patch.unlistedToken = token;
		} else if (before === 'unlisted') {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				await revokeUnlistedSnapshot({
					apiUrl: getManaApiUrl(),
					jwt,
					collection: 'places',
					recordId: id,
				});
			}
			patch.unlistedToken = undefined;
		}

		await placeTable.update(id, patch);

		emitDomainEvent('VisibilityChanged', 'places', 'places', id, {
			recordId: id,
			collection: 'places',
			before,
			after: next,
		});
	},

	async regenerateUnlistedToken(id: string) {
		const existing = await placeTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return null;
		const jwt = await authStore.getValidToken();
		if (!jwt) return null;
		try {
			await revokeUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'places',
				recordId: id,
			});
			const blob = await buildUnlistedBlob('places', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'places',
				recordId: id,
				spaceId,
				blob,
			});
			await placeTable.update(id, {
				unlistedToken: token,
				updatedAt: new Date().toISOString(),
			});
			return token;
		} catch (e) {
			console.error('[places] regenerate failed', e);
			return null;
		}
	},

	async refreshUnlistedSnapshot(id: string) {
		const existing = await placeTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		try {
			const blob = await buildUnlistedBlob('places', id);
			const jwt = await authStore.getValidToken();
			if (!jwt) return;
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'places',
				recordId: id,
				spaceId,
				blob,
			});
		} catch (e) {
			console.error('[places] refreshUnlistedSnapshot failed', e);
		}
	},
};
