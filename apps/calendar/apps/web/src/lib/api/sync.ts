/**
 * External Calendar Sync API Client
 */

import { fetchApi } from './client';
import type {
	ExternalCalendar,
	ConnectExternalCalendarInput,
	CalDavDiscoveryResult,
} from '@calendar/shared';

export interface UpdateExternalCalendarInput {
	name?: string;
	syncEnabled?: boolean;
	syncDirection?: 'import' | 'export' | 'both';
	syncInterval?: number;
	color?: string;
	isVisible?: boolean;
}

// ==================== External Calendars CRUD ====================

export async function getExternalCalendars() {
	const result = await fetchApi<{ calendars: ExternalCalendar[] }>('/sync/external');
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendars, error: null };
}

export async function getExternalCalendar(id: string) {
	const result = await fetchApi<{ calendar: ExternalCalendar }>(`/sync/external/${id}`);
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendar, error: null };
}

export async function connectExternalCalendar(data: ConnectExternalCalendarInput) {
	const result = await fetchApi<{ calendar: ExternalCalendar }>('/sync/external', {
		method: 'POST',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendar, error: null };
}

export async function updateExternalCalendar(id: string, data: UpdateExternalCalendarInput) {
	const result = await fetchApi<{ calendar: ExternalCalendar }>(`/sync/external/${id}`, {
		method: 'PUT',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendar, error: null };
}

export async function disconnectExternalCalendar(id: string) {
	return fetchApi<{ success: boolean }>(`/sync/external/${id}`, {
		method: 'DELETE',
	});
}

// ==================== Sync Operations ====================

export async function triggerSync(id: string) {
	const result = await fetchApi<{
		success: boolean;
		eventsImported?: number;
		eventsExported?: number;
	}>(`/sync/external/${id}/sync`, { method: 'POST' });
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data, error: null };
}

// ==================== CalDAV Discovery ====================

export async function discoverCalDav(serverUrl: string, username: string, password: string) {
	const result = await fetchApi<CalDavDiscoveryResult>('/sync/caldav/discover', {
		method: 'POST',
		body: { serverUrl, username, password },
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.calendars, error: null };
}

// ==================== Google OAuth ====================

export async function getGoogleAuthUrl() {
	const result = await fetchApi<{ url: string }>('/sync/google/auth-url');
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.url, error: null };
}

// ==================== iCal Export ====================

export function getICalExportUrl(calendarId: string): string {
	// This returns the URL for direct browser download
	return `/api/v1/calendars/${calendarId}/export.ics`;
}
