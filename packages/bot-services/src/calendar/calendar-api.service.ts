import { Injectable, Logger } from '@nestjs/common';
import {
	CalendarEvent,
	Calendar,
	CreateEventInput,
	UpdateEventInput,
	ParsedEventInput,
} from './types';
import { parseGermanDateKeyword, getTodayISO, addDays } from '../shared/utils';

/**
 * Calendar API Service
 *
 * Connects to the calendar-backend API for event management.
 * This service is used when the user is logged in and has a valid JWT token.
 *
 * @example
 * ```typescript
 * // Get events for a user (requires JWT token)
 * const events = await calendarApiService.getEvents(token, { start: '2024-01-01', end: '2024-01-31' });
 *
 * // Create an event
 * const event = await calendarApiService.createEvent(token, {
 *   title: 'Meeting',
 *   startTime: new Date('2024-01-15T10:00:00'),
 *   endTime: new Date('2024-01-15T11:00:00'),
 * });
 * ```
 */
@Injectable()
export class CalendarApiService {
	private readonly logger = new Logger(CalendarApiService.name);
	private readonly baseUrl: string;

	constructor(baseUrl = 'http://localhost:3014') {
		this.baseUrl = baseUrl;
		this.logger.log(`Calendar API Service initialized with URL: ${baseUrl}`);
	}

	// ===== Event Operations =====

	/**
	 * Get events within a date range
	 * Note: The calendar backend doesn't support date filtering via query params,
	 * so we fetch all events and filter client-side.
	 */
	async getEvents(
		token: string,
		filter?: { start?: string; end?: string; calendarId?: string }
	): Promise<CalendarEvent[]> {
		try {
			const params = new URLSearchParams();
			// Only calendarId is supported as query param
			if (filter?.calendarId) params.append('calendarId', filter.calendarId);

			const queryString = params.toString();
			const url = queryString
				? `${this.baseUrl}/api/v1/events?${queryString}`
				: `${this.baseUrl}/api/v1/events`;

			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { events?: unknown[] };
			let events = this.mapApiEvents(data.events || []);

			// Client-side date filtering
			if (filter?.start || filter?.end) {
				const startDate = filter.start ? new Date(filter.start + 'T00:00:00') : null;
				const endDate = filter.end ? new Date(filter.end + 'T23:59:59') : null;

				events = events.filter((event) => {
					const eventStart = new Date(event.startTime);
					const eventEnd = new Date(event.endTime);

					if (startDate && eventEnd < startDate) return false;
					if (endDate && eventStart > endDate) return false;
					return true;
				});
			}

			return events;
		} catch (error) {
			this.logger.error('Failed to get events:', error);
			return [];
		}
	}

	/**
	 * Get today's events
	 */
	async getTodayEvents(token: string): Promise<CalendarEvent[]> {
		const today = getTodayISO();
		return this.getEvents(token, { start: today, end: today });
	}

	/**
	 * Get upcoming events (next 7 days)
	 */
	async getUpcomingEvents(token: string, days = 7): Promise<CalendarEvent[]> {
		const today = getTodayISO();
		const end = addDays(new Date(), days).toISOString().split('T')[0];
		return this.getEvents(token, { start: today, end });
	}

	/**
	 * Create a new event
	 */
	async createEvent(token: string, input: CreateEventInput): Promise<CalendarEvent | null> {
		try {
			const body: Record<string, unknown> = {
				title: input.title,
				startTime:
					input.startTime instanceof Date ? input.startTime.toISOString() : input.startTime,
				endTime: input.endTime instanceof Date ? input.endTime.toISOString() : input.endTime,
				isAllDay: input.isAllDay || false,
			};

			if (input.description) body.description = input.description;
			if (input.location) body.location = input.location;
			if (input.calendarId) body.calendarId = input.calendarId;

			const response = await fetch(`${this.baseUrl}/api/v1/events`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { event: unknown };
			return this.mapApiEvent(data.event);
		} catch (error) {
			this.logger.error('Failed to create event:', error);
			return null;
		}
	}

	/**
	 * Update an event
	 */
	async updateEvent(
		token: string,
		eventId: string,
		input: UpdateEventInput
	): Promise<CalendarEvent | null> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/events/${eventId}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(input),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { event: unknown };
			return this.mapApiEvent(data.event);
		} catch (error) {
			this.logger.error('Failed to update event:', error);
			return null;
		}
	}

	/**
	 * Delete an event
	 */
	async deleteEvent(token: string, eventId: string): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/events/${eventId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});

			return response.ok;
		} catch (error) {
			this.logger.error('Failed to delete event:', error);
			return false;
		}
	}

	// ===== Calendar Operations =====

	/**
	 * Get all calendars
	 */
	async getCalendars(token: string): Promise<Calendar[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/calendars`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { calendars?: any[] };
			return (data.calendars || []).map((c: any) => ({
				id: c.id,
				name: c.name,
				color: c.color,
				userId: c.userId || '',
				isDefault: c.isDefault || false,
			}));
		} catch (error) {
			this.logger.error('Failed to get calendars:', error);
			return [];
		}
	}

	// ===== Parsing =====

	/**
	 * Parse natural language event input
	 */
	parseEventInput(input: string): ParsedEventInput {
		let title = input;
		let startTime: Date | null = null;
		let endTime: Date | null = null;
		let isAllDay = false;
		let location: string | null = null;

		// Extract date (@heute, @morgen, etc.)
		const dateMatch = title.match(/@(\S+)/);
		if (dateMatch) {
			const dateStr = dateMatch[1].toLowerCase();
			const parsedDate = parseGermanDateKeyword(dateStr);

			if (parsedDate) {
				// Default to 9:00-10:00 for the parsed date
				startTime = new Date(`${parsedDate}T09:00:00`);
				endTime = new Date(`${parsedDate}T10:00:00`);
			}
			title = title.replace(dateMatch[0], '').trim();
		}

		// Extract time (um 14 Uhr, 14:00, etc.)
		const timeMatch = title.match(/(?:um\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?/i);
		if (timeMatch) {
			const hours = parseInt(timeMatch[1]);
			const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

			if (startTime) {
				startTime.setHours(hours, minutes, 0, 0);
				endTime = new Date(startTime);
				endTime.setHours(hours + 1); // Default 1 hour duration
			} else {
				// If no date specified, assume today
				startTime = new Date();
				startTime.setHours(hours, minutes, 0, 0);
				endTime = new Date(startTime);
				endTime.setHours(hours + 1);
			}
			title = title.replace(timeMatch[0], '').trim();
		}

		// Extract location (in ...)
		const locationMatch = title.match(/\bin\s+([^,]+)/i);
		if (locationMatch) {
			location = locationMatch[1].trim();
			title = title.replace(locationMatch[0], '').trim();
		}

		// If no time specified, treat as all-day event
		if (!startTime) {
			startTime = new Date();
			startTime.setHours(0, 0, 0, 0);
			endTime = new Date(startTime);
			endTime.setHours(23, 59, 59, 999);
			isAllDay = true;
		}

		return {
			title: title.trim(),
			startTime: startTime!,
			endTime: endTime!,
			isAllDay,
			location,
		};
	}

	// ===== Private Helpers =====

	/**
	 * Map API event format to internal CalendarEvent format
	 */
	private mapApiEvent(apiEvent: any): CalendarEvent {
		return {
			id: apiEvent.id,
			userId: apiEvent.userId || '',
			calendarId: apiEvent.calendarId,
			calendarName: apiEvent.calendar?.name || 'Kalender',
			title: apiEvent.title,
			description: apiEvent.description || null,
			location: apiEvent.location || null,
			startTime: apiEvent.startTime,
			endTime: apiEvent.endTime,
			isAllDay: apiEvent.isAllDay || false,
			createdAt: apiEvent.createdAt,
		};
	}

	/**
	 * Map array of API events
	 */
	private mapApiEvents(apiEvents: any[]): CalendarEvent[] {
		return apiEvents.map((e) => this.mapApiEvent(e));
	}
}
