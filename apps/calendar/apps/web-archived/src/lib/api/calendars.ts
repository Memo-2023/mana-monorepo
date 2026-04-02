/**
 * Calendar API Client
 */

import { fetchApi } from './client';
import type { Calendar, CreateCalendarInput, UpdateCalendarInput } from '@calendar/shared';

export async function getCalendars() {
	return fetchApi<Calendar[]>('/calendars');
}

export async function getCalendar(id: string) {
	return fetchApi<Calendar>(`/calendars/${id}`);
}

export async function createCalendar(data: CreateCalendarInput) {
	const result = await fetchApi<{ calendar: Calendar }>('/calendars', {
		method: 'POST',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendar, error: null };
}

export async function updateCalendar(id: string, data: UpdateCalendarInput) {
	const result = await fetchApi<{ calendar: Calendar }>(`/calendars/${id}`, {
		method: 'PUT',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendar, error: null };
}

export async function deleteCalendar(id: string) {
	return fetchApi<void>(`/calendars/${id}`, {
		method: 'DELETE',
	});
}
