/**
 * Locations Store — Mutations Only
 *
 * Reads come from useLiveQuery (see $lib/data/queries.ts).
 * This store only handles writes to IndexedDB via local-store.
 */

import { locationCollection, type LocalLocation } from '$lib/data/local-store';
import { toLocation } from '$lib/data/queries';

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
		const all = await locationCollection.getAll();
		const path = buildPath(all, data.parentId);
		const depth = getDepth(all, data.parentId);
		const siblings = all.filter((l) => l.parentId === data.parentId);

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
		const inserted = await locationCollection.insert(newLocal);
		return toLocation(inserted);
	},

	async update(id: string, data: Partial<Pick<LocalLocation, 'name' | 'description' | 'icon'>>) {
		await locationCollection.update(id, data);
	},

	async delete(id: string) {
		const all = await locationCollection.getAll();
		const idsToDelete = new Set<string>();
		const collectIds = (parentId: string) => {
			idsToDelete.add(parentId);
			all.filter((l) => l.parentId === parentId).forEach((l) => collectIds(l.id));
		};
		collectIds(id);
		for (const deleteId of idsToDelete) {
			await locationCollection.delete(deleteId);
		}
	},
};
