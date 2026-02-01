import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { TranscriptionService, SessionService, CreditService } from '@manacore/bot-services';
import { CalendarService, CalendarEvent } from '../calendar/calendar.service';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

const EVENT_CREATE_CREDITS = 0.02;

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly keywordDetector = new KeywordCommandDetector(
		[
			...COMMON_KEYWORDS,
			{ keywords: ['was kannst du'], command: 'help' },
			{ keywords: ['was steht heute an', 'termine heute', 'heute termine', "today's events"], command: 'today' },
			{ keywords: ['termine morgen', 'morgen termine', 'was ist morgen'], command: 'tomorrow' },
			{ keywords: ['diese woche', 'wochenübersicht', 'week', 'woche'], command: 'week' },
			{ keywords: ['zeige kalender', 'meine kalender', 'calendars'], command: 'calendars' },
			{ keywords: ['verbindung', 'connection'], command: 'status' },
		],
		{ partialMatch: true }
	);

	constructor(
		configService: ConfigService,
		private readonly transcriptionService: TranscriptionService,
		private calendarService: CalendarService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) return;

			const audioBuffer = await this.downloadMedia(mxcUrl);
			const text = await this.transcriptionService.transcribe(audioBuffer);
			if (!text) {
				await this.sendReply(roomId, event, '❌ Sprachnachricht konnte nicht erkannt werden.');
				return;
			}

			await this.sendMessage(roomId, `🎤 *"${text}"*`);
			await this.handleTextMessage(roomId, event, text, sender);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(roomId, event, '❌ Fehler bei der Spracherkennung.');
		}
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
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			await this.executeCommand(roomId, event, sender, keywordCommand, '');
			return;
		}
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

			case 'login':
				await this.handleLogin(roomId, event, userId, args);
				break;

			case 'logout':
				await this.handleLogout(roomId, event, userId);
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

		// Validate credits if user is logged in
		const token = this.sessionService.getToken(userId);
		if (token) {
			const validation = await this.creditService.validateCredits(token, EVENT_CREATE_CREDITS);
			if (!validation.hasCredits) {
				const errorMsg = this.creditService.formatInsufficientCreditsError(
					EVENT_CREATE_CREDITS,
					validation.availableCredits,
					'Termin erstellen'
				);
				await this.sendReply(roomId, event, errorMsg.text);
				return;
			}
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
		let response = `✅ Termin erstellt: **${title}**\n📆 ${timeStr}`;

		// Show credit deduction if logged in
		if (token) {
			const balance = await this.creditService.getBalance(token);
			response += `\n⚡ -${EVENT_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)`;
		}

		await this.sendReply(roomId, event, response);
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

		// Check login status and credits
		const token = this.sessionService.getToken(userId);
		const session = this.sessionService.getSession(userId);

		let response = `📊 **Status**\n\n`;
		response += `• Termine heute: ${todayEvents.length}\n`;
		response += `• Termine nächste 7 Tage: ${events.length}\n\n`;

		if (token && session) {
			const balance = await this.creditService.getBalance(token);
			response += `👤 Angemeldet als: ${session.email}\n`;
			response += `⚡ Credits: ${balance.balance.toFixed(2)}\n\n`;
		} else {
			response += `👤 Nicht angemeldet\n`;
			response += `💡 Login: \`!login email passwort\`\n\n`;
		}

		response += `Bot: ✅ Online`;

		await this.sendReply(roomId, event, response);
	}

	private async handleLogin(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const parts = args.trim().split(/\s+/);
		if (parts.length < 2) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib Email und Passwort an.\n\nBeispiel: `!login email@example.com passwort`'
			);
			return;
		}

		const [email, password] = parts;
		const result = await this.sessionService.login(userId, email, password);

		if (!result.success) {
			await this.sendReply(roomId, event, `❌ Login fehlgeschlagen: ${result.error}`);
			return;
		}

		const token = this.sessionService.getToken(userId);
		if (token) {
			const balance = await this.creditService.getBalance(token);
			await this.sendReply(
				roomId,
				event,
				`✅ Erfolgreich angemeldet als **${email}**\n⚡ Credits: ${balance.balance.toFixed(2)}`
			);
		} else {
			await this.sendReply(roomId, event, `✅ Erfolgreich angemeldet als **${email}**`);
		}
	}

	private async handleLogout(roomId: string, event: MatrixRoomEvent, userId: string) {
		const session = this.sessionService.getSession(userId);
		if (!session) {
			await this.sendReply(roomId, event, '❌ Du bist nicht angemeldet.');
			return;
		}

		this.sessionService.logout(userId);
		await this.sendReply(roomId, event, '✅ Erfolgreich abgemeldet.');
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
