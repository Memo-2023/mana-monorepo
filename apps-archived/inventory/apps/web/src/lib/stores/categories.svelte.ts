import { categoriesApi, type CategoryWithChildren } from '$lib/api';
import { authStore } from './auth.svelte';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@inventory/shared';

// State
let categories = $state<CategoryWithChildren[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Flatten tree for select dropdowns
let flatCategories = $derived(flattenTree(categories));

function flattenTree(tree: CategoryWithChildren[], level = 0): (Category & { level: number })[] {
	const result: (Category & { level: number })[] = [];
	for (const node of tree) {
		result.push({ ...node, level });
		if (node.children?.length) {
			result.push(...flattenTree(node.children, level + 1));
		}
	}
	return result;
}

async function fetchCategories() {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		categories = await categoriesApi.getAll(token || undefined);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to fetch categories';
	} finally {
		loading = false;
	}
}

async function createCategory(data: CreateCategoryInput): Promise<Category | null> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		const category = await categoriesApi.create(data, token || undefined);
		await fetchCategories();
		return category;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to create category';
		return null;
	} finally {
		loading = false;
	}
}

async function updateCategory(id: string, data: UpdateCategoryInput): Promise<Category | null> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		const category = await categoriesApi.update(id, data, token || undefined);
		await fetchCategories();
		return category;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to update category';
		return null;
	} finally {
		loading = false;
	}
}

async function deleteCategory(id: string): Promise<boolean> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		await categoriesApi.delete(id, token || undefined);
		await fetchCategories();
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to delete category';
		return false;
	} finally {
		loading = false;
	}
}

function clearError() {
	error = null;
}

export const categoriesStore = {
	get categories() {
		return categories;
	},
	get flatCategories() {
		return flatCategories;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	fetchCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	clearError,
};
