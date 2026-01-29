import { Injectable, Logger } from '@nestjs/common';
import { CalendarService, CalendarEvent } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';

@Injectable()
export class CalendarHandler {
	private readonly logger = new Logger(CalendarHandler.name);

	constructor(private calendarService: CalendarService) {}

	async today(ctx: CommandContext): Promise<string> {
		const events = await this.calendarService.getTodayEvents(ctx.userId);

		if (events.length === 0) {
			return '📅 Keine Termine für heute.\n\nErstelle einen mit `!event [Titel] [Zeit]`';
		}

		return this.formatEventList('📅 **Termine heute:**', events);
	}

	async week(ctx: CommandContext): Promise<string> {
		const events = await this.calendarService.getWeekEvents(ctx.userId);

		if (events.length === 0) {
			return '📅 Keine Termine diese Woche.';
		}

		return this.formatEventList('📅 **Termine diese Woche:**', events);
	}

	async create(ctx: CommandContext, input: string): Promise<string> {
		if (!input.trim()) {
			return `**Verwendung:** \`!event [Titel] [Zeit]\`

**Beispiele:**
• \`!event Meeting morgen 14:30\`
• \`!event Zahnarzt 15.02. 10:00\`
• \`!event Geburtstag heute ganztägig\``;
		}

		const parsed = this.calendarService.parseEventInput(input);
		const event = await this.calendarService.createEvent(ctx.userId, parsed);

		const timeStr = event.isAllDay
			? 'Ganztägig'
			: this.formatTime(event.startTime);

		const dateStr = this.formatDate(event.startTime);

		this.logger.log(`Created event "${event.title}" for ${ctx.userId}`);
		return `✅ Termin erstellt: **${event.title}**\n📅 ${dateStr} ${timeStr}`;
	}

	async listCalendars(ctx: CommandContext): Promise<string> {
		const calendars = await this.calendarService.getCalendars(ctx.userId);

		if (calendars.length === 0) {
			return '📅 Keine Kalender vorhanden.\n\nTermine werden automatisch im Standard-Kalender gespeichert.';
		}

		let response = '📅 **Deine Kalender:**\n\n';
		for (const cal of calendars) {
			const color = cal.color || '⬜';
			response += `${color} ${cal.name}\n`;
		}

		return response;
	}

	private formatEventList(header: string, events: CalendarEvent[]): string {
		let response = `${header}\n\n`;

		// Group events by date
		const byDate = new Map<string, CalendarEvent[]>();
		for (const event of events) {
			const dateKey = new Date(event.startTime).toISOString().split('T')[0];
			if (!byDate.has(dateKey)) {
				byDate.set(dateKey, []);
			}
			byDate.get(dateKey)!.push(event);
		}

		for (const [dateKey, dayEvents] of byDate) {
			const dateLabel = this.formatDate(dateKey);
			response += `**${dateLabel}:**\n`;

			for (const event of dayEvents) {
				const timeStr = event.isAllDay
					? '🌅 Ganztägig'
					: `⏰ ${this.formatTime(event.startTime)}`;
				response += `• ${timeStr} - ${event.title}\n`;
			}
			response += '\n';
		}

		return response;
	}

	private formatDate(dateInput: string | Date): string {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const dateStr = date.toISOString().split('T')[0];
		const todayStr = today.toISOString().split('T')[0];
		const tomorrowStr = tomorrow.toISOString().split('T')[0];

		if (dateStr === todayStr) return 'Heute';
		if (dateStr === tomorrowStr) return 'Morgen';

		return date.toLocaleDateString('de-DE', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
		});
	}

	private formatTime(dateInput: string | Date): string {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}
}
