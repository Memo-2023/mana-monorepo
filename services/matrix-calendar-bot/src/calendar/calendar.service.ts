import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface CalendarEvent {
	id: string;
	title: string;
	description: string | null;
	location: string | null;
	startTime: string; // ISO datetime
	endTime: string; // ISO datetime
	isAllDay: boolean;
	calendarId: string;
	calendarName: string;
	createdAt: string;
	userId: string; // Matrix user ID
}

export interface Calendar {
	id: string;
	name: string;
	color: string;
	userId: string;
}

interface CalendarData {
	events: CalendarEvent[];
	calendars: Calendar[];
}

@Injectable()
export class CalendarService implements OnModuleInit {
	private readonly logger = new Logger(CalendarService.name);
	private data: CalendarData = { events: [], calendars: [] };
	private dataPath: string;

	constructor(private configService: ConfigService) {
		const storagePath = this.configService.get<string>(
			'matrix.storagePath',
			'./data/bot-storage.json'
		);
		this.dataPath = storagePath.replace('bot-storage.json', 'calendar-data.json');
	}

	async onModuleInit() {
		await this.loadData();
	}

	private async loadData(): Promise<void> {
		try {
			const dir = path.dirname(this.dataPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (fs.existsSync(this.dataPath)) {
				const content = fs.readFileSync(this.dataPath, 'utf-8');
				this.data = JSON.parse(content);
				this.logger.log(
					`Loaded ${this.data.events.length} events, ${this.data.calendars.length} calendars`
				);
			} else {
				this.data = { events: [], calendars: [] };
				await this.saveData();
				this.logger.log('Created new calendar data file');
			}
		} catch (error) {
			this.logger.error('Failed to load calendar data:', error);
			this.data = { events: [], calendars: [] };
		}
	}

	private async saveData(): Promise<void> {
		try {
			fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
		} catch (error) {
			this.logger.error('Failed to save calendar data:', error);
		}
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	private ensureDefaultCalendar(userId: string): Calendar {
		let calendar = this.data.calendars.find((c) => c.userId === userId);
		if (!calendar) {
			calendar = {
				id: this.generateId(),
				name: 'Mein Kalender',
				color: '#3B82F6',
				userId,
			};
			this.data.calendars.push(calendar);
			this.saveData();
		}
		return calendar;
	}

	// Event operations

	async createEvent(
		userId: string,
		title: string,
		startTime: Date,
		endTime: Date,
		options?: Partial<CalendarEvent>
	): Promise<CalendarEvent> {
		const calendar = this.ensureDefaultCalendar(userId);

		const event: CalendarEvent = {
			id: this.generateId(),
			title,
			description: options?.description || null,
			location: options?.location || null,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			isAllDay: options?.isAllDay || false,
			calendarId: calendar.id,
			calendarName: calendar.name,
			createdAt: new Date().toISOString(),
			userId,
		};

		this.data.events.push(event);
		await this.saveData();
		this.logger.log(`Created event "${title}" for user ${userId}`);
		return event;
	}

	async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return this.getEventsInRange(userId, today, tomorrow);
	}

	async getTomorrowEvents(userId: string): Promise<CalendarEvent[]> {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		const dayAfter = new Date(tomorrow);
		dayAfter.setDate(dayAfter.getDate() + 1);

		return this.getEventsInRange(userId, tomorrow, dayAfter);
	}

	async getWeekEvents(userId: string): Promise<CalendarEvent[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const weekEnd = new Date(today);
		weekEnd.setDate(weekEnd.getDate() + 7);

		return this.getEventsInRange(userId, today, weekEnd);
	}

	async getUpcomingEvents(userId: string, days: number = 7): Promise<CalendarEvent[]> {
		const now = new Date();
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() + days);

		return this.getEventsInRange(userId, now, endDate);
	}

	private getEventsInRange(userId: string, start: Date, end: Date): CalendarEvent[] {
		return this.data.events
			.filter((e) => {
				if (e.userId !== userId) return false;
				const eventStart = new Date(e.startTime);
				const eventEnd = new Date(e.endTime);
				// Event overlaps with range
				return eventStart < end && eventEnd > start;
			})
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
	}

	async getEventByIndex(userId: string, index: number): Promise<CalendarEvent | null> {
		const events = await this.getUpcomingEvents(userId, 30);
		if (index < 1 || index > events.length) {
			return null;
		}
		return events[index - 1];
	}

	async deleteEvent(userId: string, eventIndex: number): Promise<CalendarEvent | null> {
		const events = await this.getUpcomingEvents(userId, 30);
		if (eventIndex < 1 || eventIndex > events.length) {
			return null;
		}

		const event = events[eventIndex - 1];
		this.data.events = this.data.events.filter((e) => e.id !== event.id);
		await this.saveData();
		this.logger.log(`Deleted event "${event.title}" for user ${userId}`);
		return event;
	}

	// Calendar operations

	async getCalendars(userId: string): Promise<Calendar[]> {
		this.ensureDefaultCalendar(userId);
		return this.data.calendars.filter((c) => c.userId === userId);
	}

	// Parse natural language date/time input
	parseEventInput(input: string): {
		title: string;
		startTime: Date | null;
		endTime: Date | null;
		isAllDay: boolean;
	} {
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
			startTime = new Date();
			startTime.setHours(0, 0, 0, 0);

			if (relative === 'morgen') {
				startTime.setDate(startTime.getDate() + 1);
			} else if (relative === 'übermorgen') {
				startTime.setDate(startTime.getDate() + 2);
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
				endTime.setHours(23, 59, 59, 999);
			} else {
				endTime.setHours(endTime.getHours() + 1);
			}
		}

		// Clean up title
		title = title.replace(/\s+/g, ' ').trim();

		return { title, startTime, endTime, isAllDay };
	}

	// Format date for display
	formatEventTime(event: CalendarEvent): string {
		const start = new Date(event.startTime);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const eventDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());

		let dateStr: string;
		if (eventDate.getTime() === today.getTime()) {
			dateStr = 'Heute';
		} else if (eventDate.getTime() === tomorrow.getTime()) {
			dateStr = 'Morgen';
		} else {
			dateStr = start.toLocaleDateString('de-DE', {
				weekday: 'short',
				day: '2-digit',
				month: '2-digit',
			});
		}

		if (event.isAllDay) {
			return `${dateStr} (ganztägig)`;
		}

		const timeStr = start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		return `${dateStr}, ${timeStr}`;
	}
}
