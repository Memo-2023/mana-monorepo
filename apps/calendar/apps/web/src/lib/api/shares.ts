/**
 * Calendar Shares API Client
 */

import { fetchApi } from './client';
import type { CalendarShare, CreateShareInput, UpdateShareInput } from '@calendar/shared';

export async function getShares(calendarId: string) {
	return fetchApi<CalendarShare[]>(`/calendars/${calendarId}/shares`);
}

export async function createShare(calendarId: string, data: CreateShareInput) {
	return fetchApi<CalendarShare>(`/calendars/${calendarId}/shares`, {
		method: 'POST',
		body: data,
	});
}

export async function acceptShare(shareId: string) {
	return fetchApi<CalendarShare>(`/shares/${shareId}/accept`, {
		method: 'POST',
	});
}

export async function declineShare(shareId: string) {
	return fetchApi<void>(`/shares/${shareId}/decline`, {
		method: 'POST',
	});
}

export async function updateShare(shareId: string, data: UpdateShareInput) {
	return fetchApi<CalendarShare>(`/shares/${shareId}`, {
		method: 'PUT',
		body: data,
	});
}

export async function deleteShare(calendarId: string, shareId: string) {
	return fetchApi<void>(`/calendars/${calendarId}/shares/${shareId}`, {
		method: 'DELETE',
	});
}

export async function getInvitations() {
	return fetchApi<CalendarShare[]>('/shares/invitations');
}

export async function getSharedWithMe() {
	return fetchApi<CalendarShare[]>('/shares/shared-with-me');
}
