/**
 * Photos API
 */

import { fetchApi } from './client';
import type { PlantPhoto } from '@planta/shared';

export const photosApi = {
	async upload(file: File, plantId?: string): Promise<PlantPhoto | null> {
		const formData = new FormData();
		formData.append('file', file);

		const endpoint = plantId ? `/photos/upload?plantId=${plantId}` : '/photos/upload';

		const { data, error } = await fetchApi<PlantPhoto>(endpoint, {
			method: 'POST',
			formData,
		});

		if (error) {
			console.error('Failed to upload photo:', error);
			return null;
		}
		return data;
	},

	async delete(id: string): Promise<boolean> {
		const { error } = await fetchApi(`/photos/${id}`, { method: 'DELETE' });
		return !error;
	},

	async setPrimary(id: string): Promise<boolean> {
		const { error } = await fetchApi(`/photos/${id}/primary`, { method: 'PUT' });
		return !error;
	},
};
