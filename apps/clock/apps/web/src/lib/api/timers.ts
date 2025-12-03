/**
 * Timers API client
 */

import { api } from './client';
import type { Timer, CreateTimerInput, UpdateTimerInput } from '@clock/shared';

export const timersApi = {
	/**
	 * Get all timers for the current user
	 */
	getAll: () => api.get<Timer[]>('/timers'),

	/**
	 * Get a single timer by ID
	 */
	getById: (id: string) => api.get<Timer>(`/timers/${id}`),

	/**
	 * Create a new timer
	 */
	create: (data: CreateTimerInput) => api.post<Timer>('/timers', data),

	/**
	 * Update an existing timer
	 */
	update: (id: string, data: UpdateTimerInput) => api.put<Timer>(`/timers/${id}`, data),

	/**
	 * Delete a timer
	 */
	delete: (id: string) => api.delete<void>(`/timers/${id}`),

	/**
	 * Start a timer
	 */
	start: (id: string) => api.post<Timer>(`/timers/${id}/start`),

	/**
	 * Pause a timer
	 */
	pause: (id: string) => api.post<Timer>(`/timers/${id}/pause`),

	/**
	 * Reset a timer
	 */
	reset: (id: string) => api.post<Timer>(`/timers/${id}/reset`),
};
