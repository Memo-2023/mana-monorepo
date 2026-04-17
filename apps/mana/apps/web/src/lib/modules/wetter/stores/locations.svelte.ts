/**
 * Weather locations store — CRUD for saved locations in Dexie.
 * Locations sync across devices via mana-sync.
 */

import { db } from '$lib/data/database';
import type { WeatherLocation } from '../types';

const table = db.table<WeatherLocation>('wetterLocations');

export const locationsStore = {
	async addLocation(name: string, lat: number, lon: number): Promise<WeatherLocation> {
		const count = await table.count();
		const loc: WeatherLocation = {
			id: crypto.randomUUID(),
			name,
			lat,
			lon,
			isDefault: count === 0, // first location becomes default
			order: count,
			createdAt: Date.now(),
		};
		await table.add(loc);
		return loc;
	},

	async removeLocation(id: string): Promise<void> {
		const loc = await table.get(id);
		await table.delete(id);
		// If we deleted the default, make the first remaining one default
		if (loc?.isDefault) {
			const first = await table.orderBy('order').first();
			if (first) {
				await table.update(first.id, { isDefault: true });
			}
		}
	},

	async setDefault(id: string): Promise<void> {
		// Unset all defaults, then set the new one
		const all = await table.toArray();
		const updates = all.map((loc) => table.update(loc.id, { isDefault: loc.id === id }));
		await Promise.all(updates);
	},

	async updateOrder(id: string, newOrder: number): Promise<void> {
		await table.update(id, { order: newOrder });
	},
};
