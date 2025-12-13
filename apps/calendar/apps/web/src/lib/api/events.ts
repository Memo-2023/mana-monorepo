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
	console.log('[Calendar API] Fetching events:', params);
	const result = await fetchApi<{ events: CalendarEvent[] }>(`/events?${searchParams.toString()}`);
	console.log(
		'[Calendar API] Fetch events result:',
		result.data?.events?.length,
		'events',
		result.error
	);
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.events, error: null };
}

export async function searchEvents(query: string, limit: number = 10) {
	// Search events within a wide range (1 year past to 1 year future)
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	const oneYearFromNow = new Date();
	oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

	return getEvents({
		startDate: oneYearAgo.toISOString(),
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
	console.log('[Calendar API] Creating event:', data);
	const result = await fetchApi<{ event: CalendarEvent }>('/events', {
		method: 'POST',
		body: data,
	});
	console.log('[Calendar API] Create event result:', result);
	if (result.error || !result.data) {
		console.error('[Calendar API] Create event failed:', result.error);
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
