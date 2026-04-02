/**
 * Timers API - Direct API calls for timers
 */

import { api } from './client';
import type { Timer, CreateTimerInput, UpdateTimerInput } from '@clock/shared';

export const timersApi = {
	getAll: () => api.get<Timer[]>('/timers'),
	getById: (id: string) => api.get<Timer>(`/timers/${id}`),
	create: (input: CreateTimerInput) => api.post<Timer>('/timers', input),
	update: (id: string, input: UpdateTimerInput) => api.patch<Timer>(`/timers/${id}`, input),
	delete: (id: string) => api.delete(`/timers/${id}`),
	start: (id: string) => api.post<Timer>(`/timers/${id}/start`),
	pause: (id: string) => api.post<Timer>(`/timers/${id}/pause`),
	reset: (id: string) => api.post<Timer>(`/timers/${id}/reset`),
};
