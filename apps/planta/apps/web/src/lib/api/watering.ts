/**
 * Watering API
 */

import { fetchApi } from './client';
import type { WateringStatus, WateringLog } from '@planta/shared';

export const wateringApi = {
	async getUpcoming(): Promise<WateringStatus[]> {
		const { data, error } = await fetchApi<WateringStatus[]>('/watering/upcoming');
		if (error) {
			console.error('Failed to fetch upcoming watering:', error);
			return [];
		}
		return data || [];
	},

	async logWatering(plantId: string, notes?: string): Promise<boolean> {
		const { error } = await fetchApi(`/watering/${plantId}/water`, {
			method: 'POST',
			body: { notes },
		});
		return !error;
	},

	async updateSchedule(plantId: string, frequencyDays: number): Promise<boolean> {
		const { error } = await fetchApi(`/watering/${plantId}`, {
			method: 'PUT',
			body: { frequencyDays },
		});
		return !error;
	},

	async getHistory(plantId: string): Promise<WateringLog[]> {
		const { data, error } = await fetchApi<WateringLog[]>(`/watering/${plantId}/history`);
		if (error) {
			console.error('Failed to fetch watering history:', error);
			return [];
		}
		return data || [];
	},
};
