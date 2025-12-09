/**
 * Events API Client
 */

import { fetchApi } from './client';
import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';

export interface QueryEventsParams {
	startDate: string;
	endDate: string;
	calendarIds?: string[];
	search?: string;
}

export async function getEvents(params: QueryEventsParams) {
	const searchParams = new URLSearchParams({
		startDate: params.startDate,
		endDate: params.endDate,
	});
	if (params.calendarIds?.length) {
		searchParams.set('calendarIds', params.calendarIds.join(','));
	}
	if (params.search) {
		searchParams.set('search', params.search);
	}
	return fetchApi<CalendarEvent[]>(`/events?${searchParams.toString()}`);
}

export async function searchEvents(query: string, limit: number = 10) {
	// Search events within the next year
	const now = new Date();
	const oneYearFromNow = new Date();
	oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

	return getEvents({
		startDate: now.toISOString(),
		endDate: oneYearFromNow.toISOString(),
		search: query,
	});
}

export async function getEvent(id: string) {
	const result = await fetchApi<{ event: CalendarEvent }>(`/events/${id}`);
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.event, error: null };
}

export async function getEventsByCalendar(calendarId: string) {
	return fetchApi<CalendarEvent[]>(`/events/calendar/${calendarId}`);
}

export async function createEvent(data: CreateEventInput) {
	const result = await fetchApi<{ event: CalendarEvent }>('/events', {
		method: 'POST',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.event, error: null };
}

export async function updateEvent(id: string, data: UpdateEventInput) {
	const result = await fetchApi<{ event: CalendarEvent }>(`/events/${id}`, {
		method: 'PUT',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.event, error: null };
}

export async function deleteEvent(id: string) {
	return fetchApi<void>(`/events/${id}`, {
		method: 'DELETE',
	});
}
