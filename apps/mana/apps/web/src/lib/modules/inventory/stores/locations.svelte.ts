/**
 * Locations Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { invLocationTable } from '../collections';
import { toLocation } from '../queries';
import type { LocalLocation } from '../types';
import { InventoryEvents } from '@mana/shared-utils/analytics';

function buildPath(locations: LocalLocation[], parentId?: string): string {
	if (!parentId) return '';
	const parent = locations.find((l) => l.id === parentId);
	if (!parent) return '';
	return parent.path ? `${parent.path}/${parent.name}` : parent.name;
}

function getDepth(locations: LocalLocation[], parentId?: string): number {
	if (!parentId) return 0;
	const parent = locations.find((l) => l.id === parentId);
	return parent ? parent.depth + 1 : 0;
}

export const locationsStore = {
	async create(data: { name: string; description?: string; icon?: string; parentId?: string }) {
		const all = await invLocationTable.toArray();
		const active = all.filter((l) => !l.deletedAt);
		const path = buildPath(active, data.parentId);
		const depth = getDepth(active, data.parentId);
		const siblings = active.filter((l) => l.parentId === data.parentId);

		const newLocal: LocalLocation = {
			id: crypto.randomUUID(),
			parentId: data.parentId ?? null,
			name: data.name,
			description: data.description ?? null,
			icon: data.icon ?? null,
			path,
			depth,
			order: siblings.length,
		};
		await invLocationTable.add(newLocal);
		InventoryEvents.locationCreated();
		return toLocation(newLocal);
	},

	async update(id: string, data: Partial<Pick<LocalLocation, 'name' | 'description' | 'icon'>>) {
		await invLocationTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async delete(id: string) {
		const all = await invLocationTable.toArray();
		const active = all.filter((l) => !l.deletedAt);
		const idsToDelete = new Set<string>();
		const collectIds = (parentId: string) => {
			idsToDelete.add(parentId);
			active.filter((l) => l.parentId === parentId).forEach((l) => collectIds(l.id));
		};
		collectIds(id);
		const now = new Date().toISOString();
		for (const deleteId of idsToDelete) {
			await invLocationTable.update(deleteId, { deletedAt: now, updatedAt: now });
		}
		InventoryEvents.locationDeleted();
	},
};
