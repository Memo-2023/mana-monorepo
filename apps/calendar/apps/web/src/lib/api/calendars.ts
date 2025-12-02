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
	return fetchApi<Calendar>('/calendars', {
		method: 'POST',
		body: data,
	});
}

export async function updateCalendar(id: string, data: UpdateCalendarInput) {
	return fetchApi<Calendar>(`/calendars/${id}`, {
		method: 'PUT',
		body: data,
	});
}

export async function deleteCalendar(id: string) {
	return fetchApi<void>(`/calendars/${id}`, {
		method: 'DELETE',
	});
}
