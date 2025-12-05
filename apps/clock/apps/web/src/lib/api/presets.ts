/**
 * Presets API client
 */

import { api } from './client';
import type { Preset, CreatePresetInput, UpdatePresetInput } from '@clock/shared';

export const presetsApi = {
	/**
	 * Get all presets for the current user
	 */
	getAll: () => api.get<Preset[]>('/presets'),

	/**
	 * Get presets by type
	 */
	getByType: (type: 'timer' | 'pomodoro') => api.get<Preset[]>(`/presets?type=${type}`),

	/**
	 * Create a new preset
	 */
	create: (data: CreatePresetInput) => api.post<Preset>('/presets', data),

	/**
	 * Update an existing preset
	 */
	update: (id: string, data: UpdatePresetInput) => api.put<Preset>(`/presets/${id}`, data),

	/**
	 * Delete a preset
	 */
	delete: (id: string) => api.delete<void>(`/presets/${id}`),
};
