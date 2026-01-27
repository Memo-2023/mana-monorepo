import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Calendar {
	id: string;
	userId: string;
	name: string;
	description?: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone?: string;
}

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
	timezone?: string;
	recurrenceRule?: string;
	color?: string;
	status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface CreateEventDto {
	calendarId: string;
	title: string;
	description?: string;
	location?: string;
	startTime: string;
	endTime: string;
	isAllDay?: boolean;
	timezone?: string;
}

@Injectable()
export class CalendarClient {
	private readonly logger = new Logger(CalendarClient.name);
	private readonly apiUrl: string;

	constructor(private configService: ConfigService) {
		this.apiUrl = this.configService.get<string>('calendar.apiUrl') || 'http://localhost:3016';
	}

	private async request<T>(
		endpoint: string,
		accessToken: string,
		options: RequestInit = {}
	): Promise<T | null> {
		const url = `${this.apiUrl}${endpoint}`;

		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				this.logger.error(`API request failed: ${response.status} ${response.statusText}`);
				return null;
			}

			return (await response.json()) as T;
		} catch (error) {
			this.logger.error(`API request error: ${error}`);
			return null;
		}
	}

	/**
	 * Get all calendars for the user
	 */
	async getCalendars(accessToken: string): Promise<Calendar[]> {
		const result = await this.request<Calendar[]>('/api/v1/calendars', accessToken);
		return result || [];
	}

	/**
	 * Get events for a date range
	 */
	async getEvents(
		accessToken: string,
		start: Date,
		end: Date,
		calendarId?: string
	): Promise<CalendarEvent[]> {
		const params = new URLSearchParams({
			start: start.toISOString(),
			end: end.toISOString(),
		});

		if (calendarId) {
			params.append('calendarId', calendarId);
		}

		const result = await this.request<CalendarEvent[]>(
			`/api/v1/events?${params.toString()}`,
			accessToken
		);
		return result || [];
	}

	/**
	 * Get today's events
	 */
	async getTodayEvents(accessToken: string, timezone = 'Europe/Berlin'): Promise<CalendarEvent[]> {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const end = new Date(start);
		end.setDate(end.getDate() + 1);

		return this.getEvents(accessToken, start, end);
	}

	/**
	 * Get tomorrow's events
	 */
	async getTomorrowEvents(
		accessToken: string,
		timezone = 'Europe/Berlin'
	): Promise<CalendarEvent[]> {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		const end = new Date(start);
		end.setDate(end.getDate() + 1);

		return this.getEvents(accessToken, start, end);
	}

	/**
	 * Get this week's events
	 */
	async getWeekEvents(accessToken: string, timezone = 'Europe/Berlin'): Promise<CalendarEvent[]> {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const end = new Date(start);
		end.setDate(end.getDate() + 7);

		return this.getEvents(accessToken, start, end);
	}

	/**
	 * Get next N events
	 */
	async getNextEvents(accessToken: string, count = 5): Promise<CalendarEvent[]> {
		const now = new Date();
		const end = new Date(now);
		end.setMonth(end.getMonth() + 3); // Look 3 months ahead

		const events = await this.getEvents(accessToken, now, end);

		// Sort by start time and take first N
		return events
			.filter((e) => new Date(e.startTime) >= now)
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
			.slice(0, count);
	}

	/**
	 * Get upcoming events for reminders (within next X minutes)
	 */
	async getUpcomingEventsForReminders(
		accessToken: string,
		withinMinutes: number
	): Promise<CalendarEvent[]> {
		const now = new Date();
		const end = new Date(now.getTime() + withinMinutes * 60 * 1000);

		return this.getEvents(accessToken, now, end);
	}

	/**
	 * Create a new event
	 */
	async createEvent(accessToken: string, event: CreateEventDto): Promise<CalendarEvent | null> {
		return this.request<CalendarEvent>('/api/v1/events', accessToken, {
			method: 'POST',
			body: JSON.stringify(event),
		});
	}

	/**
	 * Get a single event by ID
	 */
	async getEvent(accessToken: string, eventId: string): Promise<CalendarEvent | null> {
		return this.request<CalendarEvent>(`/api/v1/events/${eventId}`, accessToken);
	}

	/**
	 * Delete an event
	 */
	async deleteEvent(accessToken: string, eventId: string): Promise<boolean> {
		try {
			const response = await fetch(`${this.apiUrl}/api/v1/events/${eventId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			return response.ok;
		} catch (error) {
			this.logger.error(`Delete event error: ${error}`);
			return false;
		}
	}
}
