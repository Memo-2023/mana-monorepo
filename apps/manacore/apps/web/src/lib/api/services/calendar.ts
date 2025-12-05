/**
 * Calendar API Service
 *
 * Fetches events from the Calendar backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const CALENDAR_API_URL = import.meta.env.PUBLIC_CALENDAR_API_URL || 'http://localhost:3014';

const client = createApiClient(CALENDAR_API_URL);

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

		return client.get<CalendarEvent[]>(`/events?startDate=${startDate}&endDate=${endDate}`);
	},

	/**
	 * Get today's events
	 */
	async getTodayEvents(): Promise<ApiResult<CalendarEvent[]>> {
		const today = new Date().toISOString().split('T')[0];
		return client.get<CalendarEvent[]>(`/events?startDate=${today}&endDate=${today}`);
	},

	/**
	 * Get all calendars
	 */
	async getCalendars(): Promise<ApiResult<Calendar[]>> {
		return client.get<Calendar[]>('/calendars');
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

		return client.get<CalendarEvent[]>(
			`/events?calendarIds=${calendarId}&startDate=${startDate}&endDate=${endDate}`
		);
	},
};
