import { apiClient } from './client';
import type {
	Category,
	CreateCategoryInput,
	UpdateCategoryInput,
	CategoryType,
} from '@finance/shared';

export const categoriesApi = {
	getAll: (type?: CategoryType) => {
		const params = type ? `?type=${type}` : '';
		return apiClient.get<Category[]>(`/categories${params}`);
	},

	getAllIncludingArchived: () => apiClient.get<Category[]>('/categories/all'),

	getTree: () => apiClient.get<(Category & { children: Category[] })[]>('/categories/tree'),

	getOne: (id: string) => apiClient.get<Category>(`/categories/${id}`),

	create: (data: CreateCategoryInput) => apiClient.post<Category>('/categories', data),

	update: (id: string, data: UpdateCategoryInput) =>
		apiClient.put<Category>(`/categories/${id}`, data),

	delete: (id: string) => apiClient.delete<{ success: boolean }>(`/categories/${id}`),

	seed: () =>
		apiClient.post<{ message: string; seeded: boolean; count?: number }>('/categories/seed'),
};
