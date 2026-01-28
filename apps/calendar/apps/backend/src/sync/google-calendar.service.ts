import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParsedEvent } from './ical.service';

interface GoogleCalendarEvent {
	id: string;
	summary: string;
	description?: string;
	location?: string;
	start: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	recurrence?: string[];
	status?: string;
	organizer?: {
		email: string;
		displayName?: string;
	};
	attendees?: Array<{
		email: string;
		displayName?: string;
		responseStatus?: string;
	}>;
	updated?: string;
	created?: string;
}

interface GoogleCalendarList {
	id: string;
	summary: string;
	description?: string;
	backgroundColor?: string;
	primary?: boolean;
}

interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
}

@Injectable()
export class GoogleCalendarService {
	private readonly logger = new Logger(GoogleCalendarService.name);
	private readonly clientId: string;
	private readonly clientSecret: string;
	private readonly redirectUri: string;

	constructor(private readonly configService: ConfigService) {
		this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
		this.clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
		this.redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI') || '';
	}

	/**
	 * Check if Google Calendar is configured
	 */
	isConfigured(): boolean {
		return !!(this.clientId && this.clientSecret && this.redirectUri);
	}

	/**
	 * Get OAuth2 authorization URL
	 */
	getAuthUrl(state?: string): string {
		const params = new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: [
				'https://www.googleapis.com/auth/calendar.readonly',
				'https://www.googleapis.com/auth/calendar.events',
			].join(' '),
			access_type: 'offline',
			prompt: 'consent',
		});

		if (state) {
			params.set('state', state);
		}

		return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	}

	/**
	 * Exchange authorization code for tokens
	 */
	async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				grant_type: 'authorization_code',
				redirect_uri: this.redirectUri,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			this.logger.error(`Token exchange failed: ${error}`);
			throw new Error('Failed to exchange authorization code');
		}

		return response.json();
	}

	/**
	 * Refresh access token
	 */
	async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				refresh_token: refreshToken,
				grant_type: 'refresh_token',
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			this.logger.error(`Token refresh failed: ${error}`);
			throw new Error('Failed to refresh access token');
		}

		return response.json();
	}

	/**
	 * List available calendars
	 */
	async listCalendars(accessToken: string): Promise<GoogleCalendarList[]> {
		const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to list calendars: ${response.status}`);
		}

		const data = await response.json();
		return data.items || [];
	}

	/**
	 * Fetch events from a calendar
	 */
	async fetchEvents(
		accessToken: string,
		calendarId: string,
		startDate?: Date,
		endDate?: Date
	): Promise<ParsedEvent[]> {
		const params = new URLSearchParams({
			singleEvents: 'true',
			orderBy: 'startTime',
			maxResults: '2500',
		});

		if (startDate) {
			params.set('timeMin', startDate.toISOString());
		}
		if (endDate) {
			params.set('timeMax', endDate.toISOString());
		}

		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch events: ${response.status}`);
		}

		const data = await response.json();
		const googleEvents: GoogleCalendarEvent[] = data.items || [];

		return googleEvents.map((event) => this.convertGoogleEvent(event));
	}

	/**
	 * Create an event in Google Calendar
	 */
	async createEvent(
		accessToken: string,
		calendarId: string,
		event: {
			title: string;
			description?: string;
			location?: string;
			startTime: Date;
			endTime: Date;
			isAllDay?: boolean;
			recurrenceRule?: string;
		}
	): Promise<{ id: string }> {
		const googleEvent: Partial<GoogleCalendarEvent> = {
			summary: event.title,
			description: event.description,
			location: event.location,
		};

		if (event.isAllDay) {
			googleEvent.start = { date: event.startTime.toISOString().split('T')[0] };
			googleEvent.end = { date: event.endTime.toISOString().split('T')[0] };
		} else {
			googleEvent.start = { dateTime: event.startTime.toISOString() };
			googleEvent.end = { dateTime: event.endTime.toISOString() };
		}

		if (event.recurrenceRule) {
			googleEvent.recurrence = [`RRULE:${event.recurrenceRule}`];
		}

		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(googleEvent),
			}
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to create event: ${response.status} ${error}`);
		}

		const created = await response.json();
		return { id: created.id };
	}

	/**
	 * Update an event in Google Calendar
	 */
	async updateEvent(
		accessToken: string,
		calendarId: string,
		eventId: string,
		event: {
			title?: string;
			description?: string;
			location?: string;
			startTime?: Date;
			endTime?: Date;
			isAllDay?: boolean;
		}
	): Promise<void> {
		// First fetch the existing event
		const getResponse = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!getResponse.ok) {
			throw new Error(`Failed to fetch event for update: ${getResponse.status}`);
		}

		const existingEvent = await getResponse.json();

		// Merge updates
		const updatedEvent: Partial<GoogleCalendarEvent> = {
			...existingEvent,
			summary: event.title ?? existingEvent.summary,
			description: event.description ?? existingEvent.description,
			location: event.location ?? existingEvent.location,
		};

		if (event.startTime && event.endTime) {
			if (event.isAllDay) {
				updatedEvent.start = { date: event.startTime.toISOString().split('T')[0] };
				updatedEvent.end = { date: event.endTime.toISOString().split('T')[0] };
			} else {
				updatedEvent.start = { dateTime: event.startTime.toISOString() };
				updatedEvent.end = { dateTime: event.endTime.toISOString() };
			}
		}

		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
			{
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedEvent),
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to update event: ${response.status}`);
		}
	}

	/**
	 * Delete an event from Google Calendar
	 */
	async deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok && response.status !== 404) {
			throw new Error(`Failed to delete event: ${response.status}`);
		}
	}

	/**
	 * Convert Google Calendar event to our ParsedEvent format
	 */
	private convertGoogleEvent(event: GoogleCalendarEvent): ParsedEvent {
		const isAllDay = !!event.start.date;

		let startDate: Date;
		let endDate: Date;

		if (isAllDay) {
			startDate = new Date(event.start.date!);
			endDate = new Date(event.end.date!);
		} else {
			startDate = new Date(event.start.dateTime!);
			endDate = new Date(event.end.dateTime!);
		}

		// Extract RRULE from recurrence array
		let rrule: string | undefined;
		if (event.recurrence?.length) {
			const rruleLine = event.recurrence.find((r) => r.startsWith('RRULE:'));
			if (rruleLine) {
				rrule = rruleLine.replace('RRULE:', '');
			}
		}

		return {
			uid: event.id,
			summary: event.summary,
			description: event.description,
			location: event.location,
			dtstart: startDate,
			dtend: endDate,
			isAllDay,
			rrule,
			status: this.mapGoogleStatus(event.status),
			organizer: event.organizer?.email,
			attendees: event.attendees?.map((a) => ({
				email: a.email,
				name: a.displayName,
				status: this.mapGoogleResponseStatus(a.responseStatus),
			})),
			lastModified: event.updated ? new Date(event.updated) : undefined,
			created: event.created ? new Date(event.created) : undefined,
		};
	}

	/**
	 * Map Google event status to our status
	 */
	private mapGoogleStatus(status?: string): string {
		const mapping: Record<string, string> = {
			confirmed: 'confirmed',
			tentative: 'tentative',
			cancelled: 'cancelled',
		};
		return mapping[status || 'confirmed'] || 'confirmed';
	}

	/**
	 * Map Google response status to our attendee status
	 */
	private mapGoogleResponseStatus(status?: string): string | undefined {
		if (!status) return undefined;
		const mapping: Record<string, string> = {
			accepted: 'accepted',
			declined: 'declined',
			tentative: 'tentative',
			needsAction: 'pending',
		};
		return mapping[status] || 'pending';
	}
}
