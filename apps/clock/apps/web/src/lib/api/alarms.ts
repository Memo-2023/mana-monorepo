/**
 * Alarms API client
 */

import { api } from './client';
import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@clock/shared';

export const alarmsApi = {
	/**
	 * Get all alarms for the current user
	 */
	getAll: () => api.get<Alarm[]>('/alarms'),

	/**
	 * Get a single alarm by ID
	 */
	getById: (id: string) => api.get<Alarm>(`/alarms/${id}`),

	/**
	 * Create a new alarm
	 */
	create: (data: CreateAlarmInput) => api.post<Alarm>('/alarms', data),

	/**
	 * Update an existing alarm
	 */
	update: (id: string, data: UpdateAlarmInput) => api.put<Alarm>(`/alarms/${id}`, data),

	/**
	 * Delete an alarm
	 */
	delete: (id: string) => api.delete<void>(`/alarms/${id}`),

	/**
	 * Toggle alarm enabled state
	 */
	toggle: (id: string) => api.patch<Alarm>(`/alarms/${id}/toggle`),
};
