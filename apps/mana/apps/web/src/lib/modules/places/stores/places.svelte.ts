/**
 * Places Store — Mutation-Only
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only exposes mutations that write to IndexedDB.
 */

import { encryptRecord, decryptRecord } from '$lib/data/crypto';
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
			createdAt: now,
			updatedAt: now,
		};

		// Snapshot the plaintext DTO before encryption mutates the record
		// in place — same pattern as the notes/dreams/contacts stores.
		const plaintextSnapshot = toPlace({ ...newLocal });
		await encryptRecord('places', newLocal);
		await placeTable.add(newLocal);
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
	},

	async deletePlace(id: string) {
		await placeTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
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
	},
};
