/**
 * Places Store — Mutation-Only
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only exposes mutations that write to IndexedDB.
 */

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

		await placeTable.add(newLocal);
		return toPlace(newLocal);
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

		await placeTable.update(id, {
			...updateData,
			updatedAt: new Date().toISOString(),
		});
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

		await placeTable.update(id, {
			visitCount: (local.visitCount ?? 0) + 1,
			lastVisitedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
