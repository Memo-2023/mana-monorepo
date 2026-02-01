import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseMatrixService, MatrixBotConfig, MatrixRoomEvent } from '@manacore/matrix-bot-common';
import { CalendarService, CalendarEvent } from '../calendar/calendar.service';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

// Natural language keywords that trigger commands (German + English)
const KEYWORD_COMMANDS: { keywords: string[]; command: string }[] = [
	{ keywords: ['hilfe', 'help', 'was kannst du', 'befehle', 'commands'], command: 'help' },
	{
		keywords: ['was steht heute an', 'termine heute', 'heute termine', "today's events"],
		command: 'today',
	},
	{ keywords: ['termine morgen', 'morgen termine', 'was ist morgen'], command: 'tomorrow' },
	{
		keywords: ['diese woche', 'wochenübersicht', 'week', 'woche'],
		command: 'week',
	},
	{ keywords: ['zeige kalender', 'meine kalender', 'calendars'], command: 'calendars' },
	{ keywords: ['status', 'verbindung', 'connection'], command: 'status' },
];

@Injectable()
export class MatrixService extends BaseMatrixService {
	constructor(
		configService: ConfigService,
		private calendarService: CalendarService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath: this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string | null {
		return BOT_INTRODUCTION;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Check for ! commands first (before keyword detection)
		if (message.startsWith('!')) {
			const [command, ...args] = message.slice(1).split(' ');
			await this.executeCommand(roomId, event, sender, command.toLowerCase(), args.join(' '));
			return;
		}

		// Check for natural language keywords
		const keywordCommand = this.detectKeywordCommand(message);
		if (keywordCommand) {
			await this.executeCommand(roomId, event, sender, keywordCommand, '');
			return;
		}
	}

	private detectKeywordCommand(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();

		// Only check short messages for keywords
		if (lowerMessage.length > 60) return null;

		for (const { keywords, command } of KEYWORD_COMMANDS) {
			for (const keyword of keywords) {
				if (
					lowerMessage === keyword ||
					lowerMessage.startsWith(keyword + ' ') ||
					lowerMessage.includes(keyword)
				) {
					this.logger.log(`Detected keyword "${keyword}" -> command "${command}"`);
					return command;
				}
			}
		}
		return null;
	}

	private async executeCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		command: string,
		args: string
	) {
		switch (command) {
			case 'help':
			case 'hilfe':
				await this.sendReply(roomId, event, HELP_TEXT);
				break;

			case 'heute':
			case 'today':
				await this.handleTodayEvents(roomId, event, userId);
				break;

			case 'morgen':
			case 'tomorrow':
				await this.handleTomorrowEvents(roomId, event, userId);
				break;

			case 'woche':
			case 'week':
				await this.handleWeekEvents(roomId, event, userId);
				break;

			case 'termine':
			case 'events':
			case 'upcoming':
				await this.handleUpcomingEvents(roomId, event, userId);
				break;

			case 'termin':
			case 'event':
			case 'neu':
			case 'add':
				await this.handleCreateEvent(roomId, event, userId, args);
				break;

			case 'details':
			case 'info':
				await this.handleEventDetails(roomId, event, userId, args);
				break;

			case 'löschen':
			case 'delete':
			case 'entfernen':
				await this.handleDeleteEvent(roomId, event, userId, args);
				break;

			case 'kalender':
			case 'calendars':
				await this.handleCalendars(roomId, event, userId);
				break;

			case 'status':
				await this.handleStatus(roomId, event, userId);
				break;

			case 'pin':
				await this.handlePinHelp(roomId, event);
				break;

			default:
				// Unknown command - ignore silently
				break;
		}
	}

	private async handleTodayEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		const events = await this.calendarService.getTodayEvents(userId);

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Termine für heute.\n\nErstelle einen mit `!termin Titel heute um 14:00`'
			);
			return;
		}

		const response = this.formatEventList('📅 **Termine heute:**', events);
		await this.sendReply(roomId, event, response);
	}

	private async handleTomorrowEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		const events = await this.calendarService.getTomorrowEvents(userId);

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Termine für morgen.\n\nErstelle einen mit `!termin Titel morgen um 10:00`'
			);
			return;
		}

		const response = this.formatEventList('📅 **Termine morgen:**', events);
		await this.sendReply(roomId, event, response);
	}

	private async handleWeekEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		const events = await this.calendarService.getWeekEvents(userId);

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Termine diese Woche.\n\nErstelle einen mit `!termin Titel am 20.02. um 14:00`'
			);
			return;
		}

		const response = this.formatEventList('📅 **Termine diese Woche:**', events);
		await this.sendReply(roomId, event, response);
	}

	private async handleUpcomingEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		const events = await this.calendarService.getUpcomingEvents(userId, 14);

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine anstehenden Termine.\n\nErstelle einen mit `!termin Meeting am 15.02. um 14:00`'
			);
			return;
		}

		const response = this.formatEventList('📅 **Anstehende Termine:**', events);
		await this.sendReply(roomId, event, response);
	}

	private async handleCreateEvent(roomId: string, event: MatrixRoomEvent, userId: string, input: string) {
		if (!input.trim()) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib einen Termin an.\n\nBeispiele:\n• `!termin Meeting morgen um 14:00`\n• `!termin Geburtstag am 20.03. ganztägig`\n• `!termin Zahnarzt am 15.02. um 10:30`'
			);
			return;
		}

		const { title, startTime, endTime, isAllDay } = this.calendarService.parseEventInput(input);

		if (!startTime || !endTime) {
			await this.sendReply(
				roomId,
				event,
				'❌ Konnte Datum/Uhrzeit nicht erkennen.\n\nBeispiele:\n• `!termin Meeting morgen um 14:00`\n• `!termin Arzt am 15.02. um 10:00`\n• `!termin Urlaub am 01.03. ganztägig`'
			);
			return;
		}

		if (!title) {
			await this.sendReply(roomId, event, '❌ Bitte gib einen Titel für den Termin an.');
			return;
		}

		const calendarEvent = await this.calendarService.createEvent(
			userId,
			title,
			startTime,
			endTime,
			{
				isAllDay,
			}
		);

		const timeStr = this.calendarService.formatEventTime(calendarEvent);
		await this.sendReply(roomId, event, `✅ Termin erstellt: **${title}**\n📆 ${timeStr}`);
	}

	private async handleEventDetails(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const eventNumber = parseInt(args.trim());

		if (isNaN(eventNumber) || eventNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine gültige Terminnummer an.\n\nBeispiel: `!details 1`'
			);
			return;
		}

		const calendarEvent = await this.calendarService.getEventByIndex(userId, eventNumber);

		if (!calendarEvent) {
			await this.sendReply(roomId, event, `❌ Termin #${eventNumber} nicht gefunden.`);
			return;
		}

		const timeStr = this.calendarService.formatEventTime(calendarEvent);
		let response = `📅 **${calendarEvent.title}**\n\n`;
		response += `🕐 ${timeStr}\n`;
		response += `📁 Kalender: ${calendarEvent.calendarName}\n`;

		if (calendarEvent.location) {
			response += `📍 Ort: ${calendarEvent.location}\n`;
		}

		if (calendarEvent.description) {
			response += `\n📝 ${calendarEvent.description}`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleDeleteEvent(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const eventNumber = parseInt(args.trim());

		if (isNaN(eventNumber) || eventNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine gültige Terminnummer an.\n\nBeispiel: `!löschen 1`'
			);
			return;
		}

		const deletedEvent = await this.calendarService.deleteEvent(userId, eventNumber);

		if (!deletedEvent) {
			await this.sendReply(roomId, event, `❌ Termin #${eventNumber} nicht gefunden.`);
			return;
		}

		await this.sendReply(roomId, event, `🗑️ Gelöscht: ${deletedEvent.title}`);
	}

	private async handleCalendars(roomId: string, event: MatrixRoomEvent, userId: string) {
		const calendars = await this.calendarService.getCalendars(userId);

		let response = '📁 **Deine Kalender:**\n\n';
		for (const calendar of calendars) {
			response += `• ${calendar.name}\n`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleStatus(roomId: string, event: MatrixRoomEvent, userId: string) {
		const events = await this.calendarService.getUpcomingEvents(userId, 7);
		const todayEvents = await this.calendarService.getTodayEvents(userId);

		const response = `📊 **Status**

• Termine heute: ${todayEvents.length}
• Termine nächste 7 Tage: ${events.length}

Bot: ✅ Online`;

		await this.sendReply(roomId, event, response);
	}

	private async handlePinHelp(roomId: string, event: MatrixRoomEvent) {
		try {
			// Send help message
			const helpEventId = await this.sendMessage(roomId, HELP_TEXT);

			// Pin it
			await this.getClient().sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});

			await this.sendReply(roomId, event, '📌 Hilfe wurde angepinnt!');
		} catch (error) {
			this.logger.error('Failed to pin help:', error);
			await this.sendReply(
				roomId,
				event,
				'❌ Konnte Hilfe nicht anpinnen (fehlende Berechtigung?)'
			);
		}
	}

	private formatEventList(header: string, events: CalendarEvent[]): string {
		let response = `${header}\n\n`;

		events.forEach((event, index) => {
			const num = index + 1;
			const timeStr = this.calendarService.formatEventTime(event);
			response += `**${num}.** ${event.title}\n   🕐 ${timeStr}\n`;
		});

		response += `\n📋 Details: \`!details [Nr]\` | 🗑️ Löschen: \`!löschen [Nr]\``;
		return response;
	}

	// Public method to send welcome message to new users
	async sendWelcomeMessage(roomId: string, userId: string) {
		try {
			await this.sendMessage(roomId, WELCOME_TEXT);
			this.logger.log(`Sent welcome message to ${userId} in ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to send welcome message: ${error}`);
		}
	}
}
