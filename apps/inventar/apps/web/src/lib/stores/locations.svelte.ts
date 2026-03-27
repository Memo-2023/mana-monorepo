import { browser } from '$app/environment';
import type { Location } from '@inventar/shared';

const STORAGE_KEY = 'inventar_locations';

function loadFromStorage(): Location[] {
	if (!browser) return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveToStorage(locations: Location[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

function generateId(): string {
	return crypto.randomUUID();
}

function buildPath(locations: Location[], parentId?: string): string {
	if (!parentId) return '';
	const parent = locations.find((l) => l.id === parentId);
	if (!parent) return '';
	return parent.path ? `${parent.path}/${parent.name}` : parent.name;
}

function getDepth(locations: Location[], parentId?: string): number {
	if (!parentId) return 0;
	const parent = locations.find((l) => l.id === parentId);
	return parent ? parent.depth + 1 : 0;
}

let locations = $state<Location[]>([]);
let initialized = $state(false);

export const locationsStore = {
	get locations() {
		return locations;
	},
	get initialized() {
		return initialized;
	},

	initialize() {
		if (initialized) return;
		locations = loadFromStorage();
		initialized = true;
	},

	getById(id: string): Location | undefined {
		return locations.find((l) => l.id === id);
	},

	getRootLocations(): Location[] {
		return locations.filter((l) => !l.parentId).sort((a, b) => a.order - b.order);
	},

	getChildren(parentId: string): Location[] {
		return locations.filter((l) => l.parentId === parentId).sort((a, b) => a.order - b.order);
	},

	getTree(): Location[] {
		const buildTree = (parentId?: string): Location[] => {
			return locations
				.filter((l) => l.parentId === parentId)
				.sort((a, b) => a.order - b.order)
				.map((l) => ({ ...l, children: buildTree(l.id) }));
		};
		return buildTree(undefined);
	},

	getFullPath(id: string): string {
		const location = locations.find((l) => l.id === id);
		if (!location) return '';
		return location.path ? `${location.path}/${location.name}` : location.name;
	},

	create(data: { name: string; description?: string; icon?: string; parentId?: string }): Location {
		const now = new Date().toISOString();
		const path = buildPath(locations, data.parentId);
		const depth = getDepth(locations, data.parentId);
		const siblings = locations.filter((l) => l.parentId === data.parentId);

		const location: Location = {
			id: generateId(),
			parentId: data.parentId,
			name: data.name,
			description: data.description,
			icon: data.icon,
			path,
			depth,
			order: siblings.length,
			createdAt: now,
			updatedAt: now,
		};
		locations = [...locations, location];
		saveToStorage(locations);
		return location;
	},

	update(id: string, data: Partial<Pick<Location, 'name' | 'description' | 'icon'>>) {
		locations = locations.map((l) =>
			l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
		);
		saveToStorage(locations);
	},

	delete(id: string) {
		// Delete location and all children
		const idsToDelete = new Set<string>();
		const collectIds = (parentId: string) => {
			idsToDelete.add(parentId);
			locations.filter((l) => l.parentId === parentId).forEach((l) => collectIds(l.id));
		};
		collectIds(id);
		locations = locations.filter((l) => !idsToDelete.has(l.id));
		saveToStorage(locations);
	},
};
