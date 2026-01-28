import { Injectable, Logger } from '@nestjs/common';
import { DAVClient, DAVCalendar, DAVCalendarObject } from 'tsdav';
import { ICalService, ParsedEvent } from './ical.service';

export interface CalDavCalendar {
	url: string;
	displayName: string;
	description?: string;
	color?: string;
	ctag?: string;
}

export interface CalDavSyncResult {
	events: ParsedEvent[];
	ctag?: string;
	etag?: string;
}

@Injectable()
export class CalDavService {
	private readonly logger = new Logger(CalDavService.name);

	constructor(private readonly icalService: ICalService) {}

	/**
	 * Create a DAVClient for CalDAV operations
	 */
	private async createClient(
		serverUrl: string,
		username: string,
		password: string
	): Promise<DAVClient> {
		const client = new DAVClient({
			serverUrl,
			credentials: {
				username,
				password,
			},
			authMethod: 'Basic',
			defaultAccountType: 'caldav',
		});

		await client.login();
		return client;
	}

	/**
	 * Discover available calendars on a CalDAV server
	 */
	async discoverCalendars(
		serverUrl: string,
		username: string,
		password: string
	): Promise<CalDavCalendar[]> {
		try {
			const client = await this.createClient(serverUrl, username, password);
			const calendars = await client.fetchCalendars();

			return calendars.map((cal: DAVCalendar) => ({
				url: cal.url,
				displayName: String(cal.displayName || 'Unnamed Calendar'),
				description: cal.description as string | undefined,
				color: this.extractColor(cal),
				ctag: cal.ctag,
			}));
		} catch (error) {
			this.logger.error(`Failed to discover calendars: ${error}`);
			throw new Error(
				`CalDAV discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Fetch all events from a CalDAV calendar
	 */
	async fetchEvents(
		serverUrl: string,
		calendarUrl: string,
		username: string,
		password: string,
		startDate?: Date,
		endDate?: Date
	): Promise<CalDavSyncResult> {
		try {
			const client = await this.createClient(serverUrl, username, password);

			// Get calendar metadata
			const calendars = await client.fetchCalendars();
			const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

			if (!calendar) {
				throw new Error('Calendar not found');
			}

			// Fetch calendar objects
			const objects = await client.fetchCalendarObjects({
				calendar,
				timeRange:
					startDate && endDate
						? {
								start: startDate.toISOString(),
								end: endDate.toISOString(),
							}
						: undefined,
			});

			// Parse all events
			const events: ParsedEvent[] = [];
			for (const obj of objects) {
				if (obj.data) {
					try {
						const parsed = this.icalService.parseICalData(obj.data);
						events.push(...parsed);
					} catch (error) {
						this.logger.warn(`Failed to parse calendar object: ${error}`);
					}
				}
			}

			return {
				events,
				ctag: calendar.ctag,
			};
		} catch (error) {
			this.logger.error(`Failed to fetch CalDAV events: ${error}`);
			throw error;
		}
	}

	/**
	 * Create or update an event on a CalDAV server
	 */
	async upsertEvent(
		serverUrl: string,
		calendarUrl: string,
		username: string,
		password: string,
		event: {
			uid: string;
			title: string;
			description?: string;
			location?: string;
			startTime: Date;
			endTime: Date;
			isAllDay?: boolean;
			recurrenceRule?: string;
		}
	): Promise<{ etag?: string }> {
		try {
			const client = await this.createClient(serverUrl, username, password);

			const calendars = await client.fetchCalendars();
			const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

			if (!calendar) {
				throw new Error('Calendar not found');
			}

			// Generate iCal data for this single event
			const icalData = this.icalService.generateICalData('Event', [
				{
					id: event.uid,
					title: event.title,
					description: event.description,
					location: event.location,
					startTime: event.startTime,
					endTime: event.endTime,
					isAllDay: event.isAllDay,
					recurrenceRule: event.recurrenceRule,
				},
			]);

			// Create or update the event
			const eventUrl = `${calendarUrl}${event.uid}.ics`;

			const result = await client.createCalendarObject({
				calendar,
				filename: `${event.uid}.ics`,
				iCalString: icalData,
			});

			return { etag: (result as { etag?: string } | undefined)?.etag };
		} catch (error) {
			this.logger.error(`Failed to upsert CalDAV event: ${error}`);
			throw error;
		}
	}

	/**
	 * Delete an event from a CalDAV server
	 */
	async deleteEvent(
		serverUrl: string,
		calendarUrl: string,
		username: string,
		password: string,
		uid: string
	): Promise<void> {
		try {
			const client = await this.createClient(serverUrl, username, password);

			const calendars = await client.fetchCalendars();
			const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

			if (!calendar) {
				throw new Error('Calendar not found');
			}

			// Find the calendar object
			const objects = await client.fetchCalendarObjects({ calendar });
			const calendarObject = objects.find((obj: DAVCalendarObject) => {
				if (!obj.data) return false;
				try {
					const parsed = this.icalService.parseICalData(obj.data);
					return parsed.some((e) => e.uid === uid);
				} catch {
					return false;
				}
			});

			if (calendarObject) {
				await client.deleteCalendarObject({
					calendarObject,
				});
			}
		} catch (error) {
			this.logger.error(`Failed to delete CalDAV event: ${error}`);
			throw error;
		}
	}

	/**
	 * Check if calendar has changes (using ctag)
	 */
	async hasChanges(
		serverUrl: string,
		calendarUrl: string,
		username: string,
		password: string,
		lastCtag?: string
	): Promise<{ hasChanges: boolean; ctag?: string }> {
		try {
			const client = await this.createClient(serverUrl, username, password);
			const calendars = await client.fetchCalendars();
			const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

			if (!calendar) {
				throw new Error('Calendar not found');
			}

			const currentCtag = calendar.ctag;
			const hasChanges = !lastCtag || lastCtag !== currentCtag;

			return { hasChanges, ctag: currentCtag };
		} catch (error) {
			this.logger.error(`Failed to check CalDAV changes: ${error}`);
			throw error;
		}
	}

	/**
	 * Get Apple CalDAV server URL
	 */
	getAppleCalDavUrl(): string {
		return 'https://caldav.icloud.com';
	}

	/**
	 * Get Google CalDAV server URL
	 */
	getGoogleCalDavUrl(): string {
		return 'https://apidata.googleusercontent.com/caldav/v2';
	}

	/**
	 * Extract color from CalDAV calendar properties
	 */
	private extractColor(calendar: DAVCalendar): string | undefined {
		// CalDAV calendar-color is typically in the props
		const calWithProps = calendar as DAVCalendar & { props?: Record<string, unknown> };
		if (calWithProps.props && typeof calWithProps.props['calendar-color'] === 'string') {
			return calWithProps.props['calendar-color'];
		}
		return undefined;
	}
}
