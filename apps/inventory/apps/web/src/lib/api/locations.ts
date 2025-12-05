import { apiRequest } from './client';
import type {
	Location,
	LocationWithChildren,
	CreateLocationInput,
	UpdateLocationInput,
} from '@inventory/shared';

export type { LocationWithChildren };

export const locationsApi = {
	async getAll(token?: string): Promise<LocationWithChildren[]> {
		return apiRequest('/api/v1/locations', {}, token);
	},

	async getOne(id: string, token?: string): Promise<Location> {
		return apiRequest(`/api/v1/locations/${id}`, {}, token);
	},

	async create(data: CreateLocationInput, token?: string): Promise<Location> {
		return apiRequest(
			'/api/v1/locations',
			{
				method: 'POST',
				body: JSON.stringify(data),
			},
			token
		);
	},

	async update(id: string, data: UpdateLocationInput, token?: string): Promise<Location> {
		return apiRequest(
			`/api/v1/locations/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
			},
			token
		);
	},

	async delete(id: string, token?: string): Promise<{ success: boolean }> {
		return apiRequest(
			`/api/v1/locations/${id}`,
			{
				method: 'DELETE',
			},
			token
		);
	},
};
