import { Injectable, Logger, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { StorageProvider } from '../shared/types';
import { FileStorageProvider } from '../shared/storage';
import {
	generateId,
	startOfDay,
	endOfDay,
	addDays,
	isToday,
	isTomorrow,
	formatDateDE,
	formatTimeDE,
} from '../shared/utils';
import {
	CalendarEvent,
	Calendar,
	CalendarData,
	CreateEventInput,
	UpdateEventInput,
	EventFilter,
	ParsedEventInput,
} from './types';

export const CALENDAR_STORAGE_PROVIDER = 'CALENDAR_STORAGE_PROVIDER';

@Injectable()
export class CalendarService implements OnModuleInit {
	private readonly logger = new Logger(CalendarService.name);
	private data: CalendarData = { events: [], calendars: [] };
	private storage: StorageProvider<CalendarData>;

	constructor(
		@Optional()
		@Inject(CALENDAR_STORAGE_PROVIDER)
		storage?: StorageProvider<CalendarData>
	) {
		this.storage =
			storage ||
			new FileStorageProvider<CalendarData>('./data/calendar-data.json', {
				events: [],
				calendars: [],
			});
	}

	async onModuleInit() {
		await this.loadData();
	}

	private async loadData(): Promise<void> {
		try {
			this.data = await this.storage.load();
			this.logger.log(
				`Loaded ${this.data.events.length} events, ${this.data.calendars.length} calendars`
			);
		} catch (error) {
			this.logger.error('Failed to load calendar data:', error);
			this.data = { events: [], calendars: [] };
		}
	}

	private async saveData(): Promise<void> {
		try {
			await this.storage.save(this.data);
		} catch (error) {
			this.logger.error('Failed to save calendar data:', error);
		}
	}

	private ensureDefaultCalendar(userId: string): Calendar {
		let calendar = this.data.calendars.find((c) => c.userId === userId);
		if (!calendar) {
			calendar = {
				id: generateId(),
				name: 'Mein Kalender',
				color: '#3B82F6',
				userId,
			};
			this.data.calendars.push(calendar);
			this.saveData();
		}
		return calendar;
	}

	// ===== Event CRUD Operations =====

	async createEvent(userId: string, input: CreateEventInput): Promise<CalendarEvent> {
		const calendar = this.ensureDefaultCalendar(userId);

		// Calculate endTime if not provided
		let endTime: Date;
		if (input.endTime) {
			endTime = input.endTime;
		} else if (input.isAllDay) {
			// For all-day events, end at end of the same day
			endTime = new Date(input.startTime);
			endTime.setHours(23, 59, 59, 999);
		} else {
			// Default to 1 hour after start
			endTime = new Date(input.startTime.getTime() + 60 * 60 * 1000);
		}

		const event: CalendarEvent = {
			id: generateId(),
			userId,
			title: input.title,
			description: input.description ?? null,
			location: input.location ?? null,
			startTime: input.startTime.toISOString(),
			endTime: endTime.toISOString(),
			isAllDay: input.isAllDay ?? false,
			calendarId: input.calendarId ?? calendar.id,
			calendarName: calendar.name,
			createdAt: new Date().toISOString(),
		};

		this.data.events.push(event);
		await this.saveData();
		this.logger.log(`Created event "${event.title}" for user ${userId}`);
		return event;
	}

	async updateEvent(
		userId: string,
		eventId: string,
		input: UpdateEventInput
	): Promise<CalendarEvent | null> {
		const event = this.data.events.find((e) => e.id === eventId && e.userId === userId);
		if (!event) return null;

		if (input.title !== undefined) event.title = input.title;
		if (input.startTime !== undefined) event.startTime = input.startTime.toISOString();
		if (input.endTime !== undefined) event.endTime = input.endTime.toISOString();
		if (input.description !== undefined) event.description = input.description;
		if (input.location !== undefined) event.location = input.location;
		if (input.isAllDay !== undefined) event.isAllDay = input.isAllDay;
		event.updatedAt = new Date().toISOString();

		await this.saveData();
		return event;
	}

	async deleteEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
		const eventIndex = this.data.events.findIndex((e) => e.id === eventId && e.userId === userId);
		if (eventIndex === -1) return null;

		const [event] = this.data.events.splice(eventIndex, 1);
		await this.saveData();
		this.logger.log(`Deleted event "${event.title}" for user ${userId}`);
		return event;
	}

	async deleteEventByIndex(userId: string, index: number): Promise<CalendarEvent | null> {
		const events = await this.getUpcomingEvents(userId, 30);
		if (index < 1 || index > events.length) return null;

		const event = events[index - 1];
		return this.deleteEvent(userId, event.id);
	}

	// ===== Event Queries =====

	async getEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
		return this.data.events.find((e) => e.id === eventId && e.userId === userId) ?? null;
	}

	async getEventByIndex(userId: string, index: number): Promise<CalendarEvent | null> {
		const events = await this.getUpcomingEvents(userId, 30);
		if (index < 1 || index > events.length) return null;
		return events[index - 1];
	}

	async getEvents(userId: string, filter?: EventFilter): Promise<CalendarEvent[]> {
		let events = this.data.events.filter((e) => e.userId === userId);

		if (filter) {
			if (filter.calendarId) {
				events = events.filter((e) => e.calendarId === filter.calendarId);
			}
			if (filter.startAfter) {
				events = events.filter((e) => new Date(e.startTime) >= filter.startAfter!);
			}
			if (filter.startBefore) {
				events = events.filter((e) => new Date(e.startTime) <= filter.startBefore!);
			}
			if (filter.isAllDay !== undefined) {
				events = events.filter((e) => e.isAllDay === filter.isAllDay);
			}
		}

		return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
	}

	async getEventsInRange(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
		return this.data.events
			.filter((e) => {
				if (e.userId !== userId) return false;
				const eventStart = new Date(e.startTime);
				const eventEnd = new Date(e.endTime);
				return eventStart < end && eventEnd > start;
			})
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
	}

	async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
		const today = startOfDay();
		const tomorrow = addDays(today, 1);
		return this.getEventsInRange(userId, today, tomorrow);
	}

	async getTomorrowEvents(userId: string): Promise<CalendarEvent[]> {
		const tomorrow = startOfDay(addDays(new Date(), 1));
		const dayAfter = addDays(tomorrow, 1);
		return this.getEventsInRange(userId, tomorrow, dayAfter);
	}

	async getWeekEvents(userId: string): Promise<CalendarEvent[]> {
		const today = startOfDay();
		const weekEnd = addDays(today, 7);
		return this.getEventsInRange(userId, today, weekEnd);
	}

	async getUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
		const now = new Date();
		const endDate = addDays(now, days);
		return this.getEventsInRange(userId, now, endDate);
	}

	// ===== Calendars =====

	async getCalendars(userId: string): Promise<Calendar[]> {
		this.ensureDefaultCalendar(userId);
		return this.data.calendars.filter((c) => c.userId === userId);
	}

	async createCalendar(userId: string, name: string, color?: string): Promise<Calendar> {
		const calendar: Calendar = {
			id: generateId(),
			name,
			color: color ?? '#808080',
			userId,
		};
		this.data.calendars.push(calendar);
		await this.saveData();
		return calendar;
	}

	// ===== Formatting =====

	formatEventTime(event: CalendarEvent): string {
		const start = new Date(event.startTime);

		let dateStr: string;
		if (isToday(start)) {
			dateStr = 'Heute';
		} else if (isTomorrow(start)) {
			dateStr = 'Morgen';
		} else {
			dateStr = formatDateDE(start, { weekday: 'short', day: '2-digit', month: '2-digit' });
		}

		if (event.isAllDay) {
			return `${dateStr} (ganztägig)`;
		}

		return `${dateStr}, ${formatTimeDE(start)}`;
	}

	// ===== Input Parsing =====

	/**
	 * Parse natural language event input
	 * Supports: "am DD.MM.", "heute/morgen/übermorgen", "um HH:MM", "ganztägig"
	 */
	parseEventInput(input: string): ParsedEventInput {
		let title = input;
		let startTime: Date | null = null;
		let endTime: Date | null = null;
		let isAllDay = false;

		const now = new Date();

		// Check for "ganztägig" (all-day)
		if (/ganztägig/i.test(title)) {
			isAllDay = true;
			title = title.replace(/ganztägig/gi, '').trim();
		}

		// Parse date patterns
		// "am DD.MM." or "am DD.MM.YYYY"
		const dateMatch = title.match(/am\s+(\d{1,2})\.(\d{1,2})\.?(\d{4})?/i);
		// "heute", "morgen", "übermorgen"
		const relativeMatch = title.match(/(heute|morgen|übermorgen)/i);
		// Time: "um HH:MM" or "um HH Uhr"
		const timeMatch = title.match(/um\s+(\d{1,2})[:.]?(\d{2})?\s*(uhr)?/i);

		if (dateMatch) {
			const day = parseInt(dateMatch[1]);
			const month = parseInt(dateMatch[2]) - 1;
			const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();

			startTime = new Date(year, month, day);

			// If date is in the past this year, assume next year
			if (startTime < now && !dateMatch[3]) {
				startTime.setFullYear(startTime.getFullYear() + 1);
			}

			title = title.replace(/am\s+\d{1,2}\.\d{1,2}\.?\d{0,4}/i, '').trim();
		} else if (relativeMatch) {
			const relative = relativeMatch[1].toLowerCase();
			startTime = startOfDay();

			if (relative === 'morgen') {
				startTime = addDays(startTime, 1);
			} else if (relative === 'übermorgen') {
				startTime = addDays(startTime, 2);
			}

			title = title.replace(/(heute|morgen|übermorgen)/i, '').trim();
		}

		if (timeMatch && startTime) {
			const hours = parseInt(timeMatch[1]);
			const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

			startTime.setHours(hours, minutes, 0, 0);
			isAllDay = false;

			title = title.replace(/um\s+\d{1,2}[:.]?\d{0,2}\s*(uhr)?/i, '').trim();
		} else if (startTime && !isAllDay) {
			// Default to 9:00 if no time specified
			startTime.setHours(9, 0, 0, 0);
		}

		// Set end time (1 hour later for timed events, end of day for all-day)
		if (startTime) {
			endTime = new Date(startTime);
			if (isAllDay) {
				endTime = endOfDay(startTime);
			} else {
				endTime.setHours(endTime.getHours() + 1);
			}
		}

		// Clean up title
		title = title.replace(/\s+/g, ' ').trim();

		return { title, startTime, endTime, isAllDay, location: null };
	}
}
