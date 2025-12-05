import { apiRequest } from './client';
import type {
	Category,
	CategoryWithChildren,
	CreateCategoryInput,
	UpdateCategoryInput,
} from '@inventory/shared';

export type { CategoryWithChildren };

export const categoriesApi = {
	async getAll(token?: string): Promise<CategoryWithChildren[]> {
		return apiRequest('/api/v1/categories', {}, token);
	},

	async getOne(id: string, token?: string): Promise<Category> {
		return apiRequest(`/api/v1/categories/${id}`, {}, token);
	},

	async create(data: CreateCategoryInput, token?: string): Promise<Category> {
		return apiRequest(
			'/api/v1/categories',
			{
				method: 'POST',
				body: JSON.stringify(data),
			},
			token
		);
	},

	async update(id: string, data: UpdateCategoryInput, token?: string): Promise<Category> {
		return apiRequest(
			`/api/v1/categories/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
			},
			token
		);
	},

	async delete(id: string, token?: string): Promise<{ success: boolean }> {
		return apiRequest(
			`/api/v1/categories/${id}`,
			{
				method: 'DELETE',
			},
			token
		);
	},
};
