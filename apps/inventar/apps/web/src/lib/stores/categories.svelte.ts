import { browser } from '$app/environment';
import type { Category } from '@inventar/shared';

const STORAGE_KEY = 'inventar_categories';

function loadFromStorage(): Category[] {
	if (!browser) return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveToStorage(categories: Category[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

function generateId(): string {
	return crypto.randomUUID();
}

let categories = $state<Category[]>([]);
let initialized = $state(false);

export const categoriesStore = {
	get categories() {
		return categories;
	},
	get initialized() {
		return initialized;
	},

	initialize() {
		if (initialized) return;
		categories = loadFromStorage();
		initialized = true;
	},

	getById(id: string): Category | undefined {
		return categories.find((c) => c.id === id);
	},

	getRootCategories(): Category[] {
		return categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
	},

	getChildren(parentId: string): Category[] {
		return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
	},

	getTree(): Category[] {
		const buildTree = (parentId?: string): Category[] => {
			return categories
				.filter((c) => c.parentId === parentId)
				.sort((a, b) => a.order - b.order)
				.map((c) => ({ ...c, children: buildTree(c.id) }));
		};
		return buildTree(undefined);
	},

	create(data: { name: string; icon?: string; color?: string; parentId?: string }): Category {
		const now = new Date().toISOString();
		const siblings = categories.filter((c) => c.parentId === data.parentId);

		const category: Category = {
			id: generateId(),
			parentId: data.parentId,
			name: data.name,
			icon: data.icon,
			color: data.color,
			order: siblings.length,
			createdAt: now,
			updatedAt: now,
		};
		categories = [...categories, category];
		saveToStorage(categories);
		return category;
	},

	update(id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) {
		categories = categories.map((c) =>
			c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
		);
		saveToStorage(categories);
	},

	delete(id: string) {
		const idsToDelete = new Set<string>();
		const collectIds = (parentId: string) => {
			idsToDelete.add(parentId);
			categories.filter((c) => c.parentId === parentId).forEach((c) => collectIds(c.id));
		};
		collectIds(id);
		categories = categories.filter((c) => !idsToDelete.has(c.id));
		saveToStorage(categories);
	},
};
