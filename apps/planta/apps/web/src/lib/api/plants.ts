/**
 * Plants API
 */

import { fetchApi } from './client';
import type { Plant, PlantWithDetails, CreatePlantDto, UpdatePlantDto } from '@planta/shared';

export const plantsApi = {
	async getAll(): Promise<Plant[]> {
		const { data, error } = await fetchApi<Plant[]>('/plants');
		if (error) {
			console.error('Failed to fetch plants:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: string): Promise<PlantWithDetails | null> {
		const { data, error } = await fetchApi<PlantWithDetails>(`/plants/${id}`);
		if (error) {
			console.error('Failed to fetch plant:', error);
			return null;
		}
		return data;
	},

	async create(dto: CreatePlantDto): Promise<Plant | null> {
		const { data, error } = await fetchApi<Plant>('/plants', {
			method: 'POST',
			body: dto,
		});
		if (error) {
			console.error('Failed to create plant:', error);
			return null;
		}
		return data;
	},

	async update(id: string, dto: UpdatePlantDto): Promise<Plant | null> {
		const { data, error } = await fetchApi<Plant>(`/plants/${id}`, {
			method: 'PUT',
			body: dto,
		});
		if (error) {
			console.error('Failed to update plant:', error);
			return null;
		}
		return data;
	},

	async delete(id: string): Promise<boolean> {
		const { error } = await fetchApi(`/plants/${id}`, { method: 'DELETE' });
		return !error;
	},
};
