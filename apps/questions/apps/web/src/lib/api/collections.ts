import { apiClient } from './client';
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '$lib/types';

export const collectionsApi = {
	async getAll(): Promise<Collection[]> {
		return apiClient.get<Collection[]>('/api/v1/collections');
	},

	async getById(id: string): Promise<Collection> {
		return apiClient.get<Collection>(`/api/v1/collections/${id}`);
	},

	async getDefault(): Promise<Collection | null> {
		return apiClient.get<Collection | null>('/api/v1/collections/default');
	},

	async create(data: CreateCollectionDto): Promise<Collection> {
		return apiClient.post<Collection>('/api/v1/collections', data);
	},

	async update(id: string, data: UpdateCollectionDto): Promise<Collection> {
		return apiClient.put<Collection>(`/api/v1/collections/${id}`, data);
	},

	async delete(id: string): Promise<void> {
		await apiClient.delete(`/api/v1/collections/${id}`);
	},

	async reorder(orderedIds: string[]): Promise<void> {
		await apiClient.post('/api/v1/collections/reorder', { orderedIds });
	},
};
