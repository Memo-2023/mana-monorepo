import { apiRequest, apiUpload } from './client';
import type {
	Item,
	ItemPhoto,
	ItemDocument,
	CreateItemInput,
	UpdateItemInput,
	ItemQueryParams,
	PaginatedResponse,
} from '@inventory/shared';

export const itemsApi = {
	async getAll(params: ItemQueryParams = {}, token?: string): Promise<PaginatedResponse<Item>> {
		const searchParams = new URLSearchParams();
		if (params.search) searchParams.set('search', params.search);
		if (params.categoryId) searchParams.set('categoryId', params.categoryId);
		if (params.locationId) searchParams.set('locationId', params.locationId);
		if (params.condition) searchParams.set('condition', params.condition);
		if (params.isFavorite !== undefined) searchParams.set('isFavorite', String(params.isFavorite));
		if (params.isArchived !== undefined) searchParams.set('isArchived', String(params.isArchived));
		if (params.sortBy) searchParams.set('sortBy', params.sortBy);
		if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
		if (params.page) searchParams.set('page', String(params.page));
		if (params.limit) searchParams.set('limit', String(params.limit));

		const query = searchParams.toString();
		return apiRequest(`/api/v1/items${query ? `?${query}` : ''}`, {}, token);
	},

	async getOne(
		id: string,
		token?: string
	): Promise<Item & { photos: ItemPhoto[]; documents: ItemDocument[] }> {
		return apiRequest(`/api/v1/items/${id}`, {}, token);
	},

	async create(data: CreateItemInput, token?: string): Promise<Item> {
		return apiRequest(
			'/api/v1/items',
			{
				method: 'POST',
				body: JSON.stringify(data),
			},
			token
		);
	},

	async update(id: string, data: UpdateItemInput, token?: string): Promise<Item> {
		return apiRequest(
			`/api/v1/items/${id}`,
			{
				method: 'PUT',
				body: JSON.stringify(data),
			},
			token
		);
	},

	async delete(id: string, token?: string): Promise<{ success: boolean }> {
		return apiRequest(
			`/api/v1/items/${id}`,
			{
				method: 'DELETE',
			},
			token
		);
	},

	async toggleFavorite(id: string, token?: string): Promise<Item> {
		return apiRequest(
			`/api/v1/items/${id}/toggle-favorite`,
			{
				method: 'PATCH',
			},
			token
		);
	},

	async toggleArchive(id: string, token?: string): Promise<Item> {
		return apiRequest(
			`/api/v1/items/${id}/toggle-archive`,
			{
				method: 'PATCH',
			},
			token
		);
	},

	async uploadPhotos(itemId: string, files: File[], token?: string): Promise<ItemPhoto[]> {
		const formData = new FormData();
		files.forEach((file) => formData.append('photos', file));
		return apiUpload(`/api/v1/items/${itemId}/photos`, formData, token);
	},

	async deletePhoto(
		itemId: string,
		photoId: string,
		token?: string
	): Promise<{ success: boolean }> {
		return apiRequest(
			`/api/v1/items/${itemId}/photos/${photoId}`,
			{
				method: 'DELETE',
			},
			token
		);
	},

	async setPrimaryPhoto(itemId: string, photoId: string, token?: string): Promise<ItemPhoto> {
		return apiRequest(
			`/api/v1/items/${itemId}/photos/${photoId}/set-primary`,
			{
				method: 'PATCH',
			},
			token
		);
	},

	async uploadDocument(
		itemId: string,
		file: File,
		documentType: string,
		token?: string
	): Promise<ItemDocument> {
		const formData = new FormData();
		formData.append('document', file);
		formData.append('documentType', documentType);
		return apiUpload(`/api/v1/items/${itemId}/documents`, formData, token);
	},

	async deleteDocument(
		itemId: string,
		documentId: string,
		token?: string
	): Promise<{ success: boolean }> {
		return apiRequest(
			`/api/v1/items/${itemId}/documents/${documentId}`,
			{
				method: 'DELETE',
			},
			token
		);
	},
};
