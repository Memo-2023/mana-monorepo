/**
 * Analysis API
 */

import { fetchApi } from './client';
import type { PlantAnalysis } from '@planta/shared';

export const analysisApi = {
	async analyze(photoId: string, plantId?: string): Promise<PlantAnalysis | null> {
		const { data, error } = await fetchApi<PlantAnalysis>('/analysis/identify', {
			method: 'POST',
			body: { photoId, plantId },
		});

		if (error) {
			console.error('Failed to analyze photo:', error);
			return null;
		}
		return data;
	},

	async getByPhotoId(photoId: string): Promise<PlantAnalysis | null> {
		const { data, error } = await fetchApi<PlantAnalysis>(`/analysis/${photoId}`);
		if (error) {
			console.error('Failed to fetch analysis:', error);
			return null;
		}
		return data;
	},
};
