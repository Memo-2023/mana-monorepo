/**
 * Events API Client
 */

import { fetchApi } from './client';
import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';

export interface QueryEventsParams {
	startDate: string;
	endDate: string;
	calendarIds?: string[];
}

export async function getEvents(params: QueryEventsParams) {
	const searchParams = new URLSearchParams({
		startDate: params.startDate,
		endDate: params.endDate,
	});
	if (params.calendarIds?.length) {
		searchParams.set('calendarIds', params.calendarIds.join(','));
	}
	return fetchApi<CalendarEvent[]>(`/events?${searchParams.toString()}`);
}

export async function getEvent(id: string) {
	return fetchApi<CalendarEvent>(`/events/${id}`);
}

export async function getEventsByCalendar(calendarId: string) {
	return fetchApi<CalendarEvent[]>(`/events/calendar/${calendarId}`);
}

export async function createEvent(data: CreateEventInput) {
	return fetchApi<CalendarEvent>('/events', {
		method: 'POST',
		body: data,
	});
}

export async function updateEvent(id: string, data: UpdateEventInput) {
	return fetchApi<CalendarEvent>(`/events/${id}`, {
		method: 'PUT',
		body: data,
	});
}

export async function deleteEvent(id: string) {
	return fetchApi<void>(`/events/${id}`, {
		method: 'DELETE',
	});
}
