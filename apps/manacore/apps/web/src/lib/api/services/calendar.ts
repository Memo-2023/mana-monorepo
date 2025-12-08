/**
 * Calendar API Service
 *
 * Fetches events from the Calendar backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Calendar API URL dynamically at runtime
function getCalendarApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable (set by hooks.server.ts)
		const injectedUrl = (window as unknown as { __PUBLIC_CALENDAR_API_URL__?: string })
			.__PUBLIC_CALENDAR_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	// Fallback for local development
	return 'http://localhost:3016/api/v1';
}

// Lazy-initialized client to ensure we get the correct URL at runtime
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getCalendarApiUrl());
	}
	return _client;
}

/**
 * Calendar entity from Calendar backend
 */
export interface Calendar {
	id: string;
	userId: string;
	name: string;
	description?: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Event entity from Calendar backend
 */
export interface CalendarEvent {
	id: string;
	calendarId: string;
	userId: string;
	title: string;
	description?: string;
	location?: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	timezone: string;
	recurrenceRule?: string;
	color?: string;
	status: 'confirmed' | 'tentative' | 'cancelled';
	createdAt: string;
	updatedAt: string;
}

/**
 * Calendar service for dashboard widgets
 */
export const calendarService = {
	/**
	 * Get upcoming events for the next N days
	 */
	async getUpcomingEvents(days: number = 7): Promise<ApiResult<CalendarEvent[]>> {
		const startDate = new Date().toISOString().split('T')[0];
		const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

		const result = await getClient().get<{ events: CalendarEvent[] }>(
			`/events?startDate=${startDate}&endDate=${endDate}`
		);

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.events || [], error: null };
	},

	/**
	 * Get today's events
	 */
	async getTodayEvents(): Promise<ApiResult<CalendarEvent[]>> {
		const today = new Date().toISOString().split('T')[0];
		const result = await getClient().get<{ events: CalendarEvent[] }>(
			`/events?startDate=${today}&endDate=${today}`
		);

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.events || [], error: null };
	},

	/**
	 * Get all calendars
	 */
	async getCalendars(): Promise<ApiResult<Calendar[]>> {
		const result = await getClient().get<{ calendars: Calendar[] }>('/calendars');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.calendars || [], error: null };
	},

	/**
	 * Get events for a specific calendar
	 */
	async getCalendarEvents(
		calendarId: string,
		days: number = 7
	): Promise<ApiResult<CalendarEvent[]>> {
		const startDate = new Date().toISOString().split('T')[0];
		const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

		const result = await getClient().get<{ events: CalendarEvent[] }>(
			`/events?calendarIds=${calendarId}&startDate=${startDate}&endDate=${endDate}`
		);

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.events || [], error: null };
	},
};
