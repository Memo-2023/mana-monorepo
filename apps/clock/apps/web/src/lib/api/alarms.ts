/**
 * Alarms API - Direct API calls for alarms
 */

import { api } from './client';
import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@clock/shared';

export const alarmsApi = {
	getAll: () => api.get<Alarm[]>('/alarms'),
	getById: (id: string) => api.get<Alarm>(`/alarms/${id}`),
	create: (input: CreateAlarmInput) => api.post<Alarm>('/alarms', input),
	update: (id: string, input: UpdateAlarmInput) => api.patch<Alarm>(`/alarms/${id}`, input),
	delete: (id: string) => api.delete(`/alarms/${id}`),
	toggle: (id: string) => api.post<Alarm>(`/alarms/${id}/toggle`),
};
