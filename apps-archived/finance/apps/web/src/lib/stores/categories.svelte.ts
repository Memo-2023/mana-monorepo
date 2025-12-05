import { categoriesApi } from '$lib/api';
import type {
	Category,
	CreateCategoryInput,
	UpdateCategoryInput,
	CategoryType,
} from '@finance/shared';

let categories = $state<Category[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const categoriesStore = {
	get categories() {
		return categories;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	get expenseCategories() {
		return categories.filter((c) => c.type === 'expense' && !c.isArchived);
	},

	get incomeCategories() {
		return categories.filter((c) => c.type === 'income' && !c.isArchived);
	},

	async fetchCategories(type?: CategoryType) {
		isLoading = true;
		error = null;
		try {
			categories = await categoriesApi.getAll(type);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch categories';
		} finally {
			isLoading = false;
		}
	},

	async createCategory(data: CreateCategoryInput) {
		isLoading = true;
		error = null;
		try {
			const newCategory = await categoriesApi.create(data);
			categories = [...categories, newCategory];
			return newCategory;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create category';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async updateCategory(id: string, data: UpdateCategoryInput) {
		isLoading = true;
		error = null;
		try {
			const updated = await categoriesApi.update(id, data);
			categories = categories.map((c) => (c.id === id ? updated : c));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update category';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async deleteCategory(id: string) {
		isLoading = true;
		error = null;
		try {
			await categoriesApi.delete(id);
			categories = categories.filter((c) => c.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete category';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async seedCategories() {
		try {
			const result = await categoriesApi.seed();
			if (result.seeded) {
				await this.fetchCategories();
			}
			return result;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to seed categories';
			throw e;
		}
	},

	getCategoryById(id: string) {
		return categories.find((c) => c.id === id);
	},
};
